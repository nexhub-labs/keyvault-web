import { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { viewVaultDBAPI, VaultItem } from '../api/vault';
import { logger } from '../utils/logger';
import { useNetwork } from './NetworkContext';
import { encryptWithKey } from '../utils/crypto';
import { storePasswordAPI } from '../api/vault';

interface VaultContextType {
    mek: CryptoKey | null; // Master Encryption Key (KEK) derived from credentials
    setMek: (key: CryptoKey) => void;
    vaultKey: CryptoKey | null; // Persistent Vault Key (EK) for data
    setVaultKey: (key: CryptoKey) => void;
    salt: string | null;
    setSalt: (salt: string) => void;
    isUnlocked: boolean; // Indicates if the vault has been unlocked locally (i.e., MEK is set)
    setIsUnlocked: (unlocked: boolean) => void;
    clearSession: () => void;
    vaultItems: VaultItem[];
    setVaultItems: (items: VaultItem[]) => void;
    refreshVault: (filter?: { projectId?: string; teamId?: string; familyId?: string }, force?: boolean) => Promise<void>;
    teamKeys: Record<string, CryptoKey>;
    setTeamKey: (teamId: string, key: CryptoKey) => void;
    isLoading: boolean;
    refresh: (filter?: { projectId?: string; teamId?: string; familyId?: string } | boolean, force?: boolean) => Promise<void>;
    saveToVault: (keyName: string, password: string, extra?: { projectId?: string; teamId?: string; familyId?: string; secretType?: string }) => Promise<void>;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export const VaultProvider = ({ children }: { children: ReactNode }) => {
    const { isServerReachable } = useNetwork();
    const [mek, setMek] = useState<CryptoKey | null>(null);
    const [vaultKey, setVaultKey] = useState<CryptoKey | null>(null);
    const [salt, setSalt] = useState<string | null>(null);
    const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
    const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
    const [teamKeys, setTeamKeys] = useState<Record<string, CryptoKey>>({});
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const wasUnreachable = useRef(false);

    const lastRefreshTime = useRef<number>(0);

    const refreshVault = async (filter?: { projectId?: string; teamId?: string; familyId?: string }, force: boolean = false) => {
        const now = Date.now();
        // If not forced (auto-refresh), and last refresh was less than 5 seconds ago, skip to prevent loops
        if (!force && (now - lastRefreshTime.current < 5000)) {
            logger.info("Skipping vault refresh (too soon)");
            return;
        }

        if (isLoading) return;
        setIsLoading(true);
        lastRefreshTime.current = now;

        try {
            const data = await viewVaultDBAPI(filter);
            // Filter out internal system entries (keys prefixed with __ are reserved)
            const userItems = data.filter(item => item?.keyName && !item.keyName.startsWith('__'));
            setVaultItems(userItems);
        } catch (err) {
            logger.error("Failed to fetch vault", err);
        } finally {
            setIsLoading(false);
        }
    };

    const refresh = async (arg1?: { projectId?: string; teamId?: string; familyId?: string } | boolean, arg2?: boolean) => {
        if (typeof arg1 === 'boolean') {
            return refreshVault(undefined, arg1);
        }
        return refreshVault(arg1, arg2);
    };

    /**
     * Encrypts the password client-side and stores it in the vault.
     * Uses the Vault Key (EK) from context (or MEK if legacy).
     */
    const saveToVault = async (keyName: string, password: string, extra: { projectId?: string; teamId?: string; familyId?: string; secretType?: string } = {}) => {
        // Prioritize Vault Key (Key Indirection), fallback to MEK (Legacy)
        const keyToUse = vaultKey || mek;
        const saltToUse = salt;

        if (!keyToUse) {
            throw new Error("Vault not unlocked");
        }
        if (!saltToUse) {
            throw new Error("Vault not initialized");
        }

        try {
            const { encryptedData, iv } = await encryptWithKey(password, keyToUse);
            await storePasswordAPI(keyName, encryptedData, iv, "AES-GCM", extra);
            refresh(undefined, true); // Refresh list via Context (Forced)
        } catch (error) {
            logger.error("Failed to save to vault", error);
            throw error;
        }
    };

    // Auto-refresh when server becomes reachable again
    useEffect(() => {
        if (isServerReachable && wasUnreachable.current) {
            logger.info("Server reachable again, refreshing vault...");
            refreshVault();
        }
        wasUnreachable.current = !isServerReachable;
    }, [isServerReachable]);

    const clearSession = () => {
        setMek(null);
        setVaultKey(null);
        setSalt(null);
        setIsUnlocked(false);
        setVaultItems([]);
        setTeamKeys({});
        setIsLoading(false);
    };

    const setTeamKey = (teamId: string, key: CryptoKey) => {
        setTeamKeys(prev => ({ ...prev, [teamId]: key }));
    };

    // Update isUnlocked whenever mek changes
    useEffect(() => {
        setIsUnlocked(!!mek);
    }, [mek]);

    return (
        <VaultContext.Provider value={{
            mek,
            setMek,
            vaultKey,
            setVaultKey,
            salt,
            setSalt,
            isUnlocked,
            setIsUnlocked,
            clearSession,
            vaultItems,
            setVaultItems,
            refreshVault,
            teamKeys,
            setTeamKey,
            isLoading,
            refresh,
            saveToVault
        }}>
            {children}
        </VaultContext.Provider>
    );
};

export const useVaultContext = () => {
    const context = useContext(VaultContext);
    if (context === undefined) {
        throw new Error('useVaultContext must be used within a VaultProvider');
    }
    return context;
};
