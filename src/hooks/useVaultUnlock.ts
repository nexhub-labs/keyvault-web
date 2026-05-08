import { useState, useCallback } from 'react';
import { useVaultContext } from '../context/VaultContext';
import {
    deriveMasterPasswordHash, unwrapMasterSeed, deriveMekFromSeed,
    decryptWithKey, importKeyRaw, generateVaultKey, exportKeyRaw, encryptWithKey
} from '../utils/crypto';
import { verifyMasterPasswordAPI, getMasterPasswordStatusAPI, getAuthSaltAPI } from '../api/auth';
import { retrievePasswordAPI, storePasswordAPI } from '../api/vault';
import { supabase } from '../utils/supabase';
import { logger } from '../utils/logger';

export interface UnlockResult {
    success: boolean;
    error?: string;
    mek?: CryptoKey;
    vaultKey?: CryptoKey;
    salt?: string;
}

/**
 * Reusable hook for vault unlock operations.
 * Encapsulates the entire crypto flow: MPH verification, seed unwrapping,
 * MEK derivation, and Vault Key management.
 * 
 * SOLID: Single Responsibility - only handles unlock logic
 * DRY: Extracted from VaultUnlock.tsx and generate.tsx
 * YAGNI: Only includes what's needed for unlock
 */
export function useVaultUnlock() {
    const { setMek, setVaultKey, setSalt, setIsUnlocked } = useVaultContext();
    const [isUnlocking, setIsUnlocking] = useState(false);
    const [masterPasswordSalt, setMasterPasswordSalt] = useState<string | null>(null);

    /**
     * Fetches the master password salt from the server.
     * Should be called before attempting unlock.
     */
    const fetchSalt = useCallback(async (): Promise<string | null> => {
        try {
            const status = await getMasterPasswordStatusAPI();
            const salt = status.masterPasswordSalt || null;
            setMasterPasswordSalt(salt);
            return salt;
        } catch (e) {
            // logger.error("Failed to fetch salt:", e);
            return null;
        }
    }, []);

    /**
     * Performs the full vault unlock flow.
     * 
     * @param masterPassword - The user's master password
     * @param salt - Optional salt (will use cached if not provided)
     * @param totpToken - Optional 2FA token
     * @returns UnlockResult with success status and keys
     */
    const unlock = useCallback(async (
        masterPassword: string,
        salt?: string,
        totpToken?: string
    ): Promise<UnlockResult> => {
        const effectiveSalt = salt || masterPasswordSalt;

        if (!masterPassword || !effectiveSalt) {
            return { success: false, error: "Master password and salt required" };
        }

        setIsUnlocking(true);
        try {
            // 1. Fetch user email for Auth Salt
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || !user.email) {
                return { success: false, error: "Session expired or invalid" };
            }

            // 2. Fetch Server-Issued Auth Salt
            const { authSalt } = await getAuthSaltAPI(user.email);

            // 3. Derive MPH for server authentication using server auth salt
            const mph = await deriveMasterPasswordHash(masterPassword, authSalt);

            // 4. Verify MPH against server and get wrapped seed data
            const response = await verifyMasterPasswordAPI(mph, totpToken);

            if (!response.valid) {
                return { success: false, error: "Invalid master password" };
            }

            // 5. Unwrap (decrypt) the Master Seed locally
            const masterSeed = await unwrapMasterSeed(
                response.wrappedMasterSeed,
                response.wrappedMasterSeedIv,
                masterPassword,
                effectiveSalt
            );

            // 6. Derive MEK from the unwrapped Master Seed
            const mek = await deriveMekFromSeed(masterSeed, response.vaultSalt);

            // Store MEK and salt in context
            setMek(mek);
            setSalt(response.vaultSalt);

            // 7. Unwrap or create the Vault Key
            let vaultKey: CryptoKey;
            try {
                const { encryptedData: ekEnc, iv: ekIv } = await retrievePasswordAPI("__VAULT_KEY__");
                const ekRawStr = await decryptWithKey(ekEnc, ekIv, mek);
                const ekRaw = Uint8Array.from(atob(ekRawStr), c => c.charCodeAt(0));
                vaultKey = await importKeyRaw(ekRaw.buffer);
            } catch (error) {
                const err = error as { response?: { status?: number } };
                if (err?.response?.status === 404) {
                    // logger.info("Vault Key not found, creating new one...");
                    vaultKey = await generateVaultKey();
                    const rawKey = await exportKeyRaw(vaultKey);
                    const rawKeyStr = btoa(String.fromCharCode(...new Uint8Array(rawKey)));
                    const { encryptedData, iv } = await encryptWithKey(rawKeyStr, mek);
                    await storePasswordAPI("__VAULT_KEY__", encryptedData, iv);
                } else {
                    throw err;
                }
            }

            // Store Vault Key and mark as unlocked
            setVaultKey(vaultKey);
            setIsUnlocked(true);

            return {
                success: true,
                mek,
                vaultKey,
                salt: response.vaultSalt
            };

        } catch (error) {
            const err = error as { response?: { status?: number, data?: { message?: string, error?: string } }, message?: string };
            logger.error("Unlock failed:", err);

            // Check for 2FA requirement
            if (err.response?.status === 403 && (err.response?.data?.error === 'TwoFactorRequired' || err.response?.data?.message === 'TwoFactorRequired')) {
                try {
                    const status = await getMasterPasswordStatusAPI();
                    if (!status.twoFactorEnabled) {
                        return { success: false, error: 'TwoFactorDisabled' };
                    }
                } catch (e) {
                    // Ignore and fallback
                }
                return {
                    success: false,
                    error: 'TwoFactorRequired'
                };
            }

            return {
                success: false,
                error: err.response?.data?.message || err?.message || "Unlock failed"
            };
        } finally {
            setIsUnlocking(false);
        }
    }, [masterPasswordSalt, setMek, setVaultKey, setSalt, setIsUnlocked]);

    return {
        unlock,
        fetchSalt,
        isUnlocking,
        masterPasswordSalt
    };
}
