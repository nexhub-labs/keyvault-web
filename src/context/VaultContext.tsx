import { createContext, useContext, useState, ReactNode, useEffect, useRef, useCallback } from 'react';
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
    familyKeys: Record<string, CryptoKey>;
    setFamilyKey: (familyId: string, key: CryptoKey) => void;
    isLoading: boolean;
    refresh: (filter?: { projectId?: string; teamId?: string; familyId?: string } | boolean, force?: boolean) => Promise<void>;
    saveToVault: (keyName: string, password: string, extra?: { projectId?: string; teamId?: string; familyId?: string; secretType?: string; tags?: string[]; folder?: string }) => Promise<void>;
    copyToClipboard: (text: string, label?: string, isSensitive?: boolean) => void;
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
    const [familyKeys, setFamilyKeys] = useState<Record<string, CryptoKey>>({});
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const wasUnreachable = useRef(false);

    const lastRefreshTime = useRef<number>(0);
    const isLoadingRef = useRef<boolean>(false);
    const inactivityTimer = useRef<NodeJS.Timeout | null>(null);
    const clipboardTimer = useRef<NodeJS.Timeout | null>(null);

    const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes
    const CLIPBOARD_TIMEOUT = 30 * 1000; // 30 seconds

    const refreshVault = useCallback(async (filter?: { projectId?: string; teamId?: string; familyId?: string }, force: boolean = false) => {
        const now = Date.now();
        if (!force && (now - lastRefreshTime.current < 5000)) {
            logger.info("Skipping vault refresh (too soon)");
            return;
        }

        // Use ref to avoid re-creating callback every time isLoading state changes
        if (isLoadingRef.current) return;
        isLoadingRef.current = true;
        setIsLoading(true);
        lastRefreshTime.current = now;

        try {
            const data = await viewVaultDBAPI(filter);
            const userItems = data.filter(item => item?.keyName && !item.keyName.startsWith('__'));
            setVaultItems(userItems);
        } catch (err) {
            logger.error("Failed to fetch vault", err);
        } finally {
            isLoadingRef.current = false;
            setIsLoading(false);
        }
    }, []);

    const refresh = useCallback(async (arg1?: { projectId?: string; teamId?: string; familyId?: string } | boolean, arg2?: boolean) => {
        if (typeof arg1 === 'boolean') {
            return refreshVault(undefined, arg1);
        }
        return refreshVault(arg1, arg2);
    }, [refreshVault]);

    /**
     * Encrypts the password client-side and stores it in the vault.
     * Uses the Vault Key (EK), Team Key, or Family Key based on context.
     */
    const saveToVault = async (keyName: string, password: string, extra: { projectId?: string; teamId?: string; familyId?: string; secretType?: string; tags?: string[]; folder?: string } = {}) => {
        // Prioritize Context Keys (Team/Family) -> Vault Key (Personal) -> MEK (Legacy)
        let keyToUse: CryptoKey | null = null;

        if (extra.teamId) {
            keyToUse = teamKeys[extra.teamId] || null;
            if (!keyToUse) throw new Error(`Access Denied: Missing encryption key for team ${extra.teamId}. Please ensure you are a member and your access is initialized.`);
        } else if (extra.familyId) {
            keyToUse = familyKeys[extra.familyId] || null;
            if (!keyToUse) throw new Error(`Access Denied: Missing encryption key for family ${extra.familyId}. Please ensure you are a member and your access is initialized.`);
        }

        // Use personal vault key or MEK ONLY if no shared context was provided
        if (!keyToUse && !extra.teamId && !extra.familyId) {
            keyToUse = vaultKey || mek;
        }

        if (!keyToUse) {
            throw new Error("Vault not unlocked or missing context key");
        }

        const saltToUse = salt;
        if (!saltToUse) {
            throw new Error("Vault not initialized");
        }

        try {
            const { encryptedData, iv } = await encryptWithKey(password, keyToUse);
            await storePasswordAPI(keyName, encryptedData, iv, "AES-GCM", extra);

            // Auto-refresh the current view
            const filter = extra.teamId ? { teamId: extra.teamId } : (extra.familyId ? { familyId: extra.familyId } : undefined);
            refresh(filter, true);
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
    }, [isServerReachable, refreshVault]);

    const clearSession = () => {
        setMek(null);
        setVaultKey(null);
        setSalt(null);
        setIsUnlocked(false);
        setVaultItems([]);
        setTeamKeys({});
        setFamilyKeys({});
        setIsLoading(false);
        if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
        if (clipboardTimer.current) clearTimeout(clipboardTimer.current);
    };

    const resetInactivityTimer = () => {
        if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
        if (isUnlocked) {
            inactivityTimer.current = setTimeout(() => {
                logger.warn("Vault locked due to inactivity");
                clearSession();
            }, INACTIVITY_TIMEOUT);
        }
    };

    const copyToClipboard = (text: string, label: string = "Item", isSensitive: boolean = true) => {
        try {
            navigator.clipboard.writeText(text).then(() => {
                import('../components/ui/toaster').then(({ toaster }) => {
                    toaster.create({ title: `${label} copied to clipboard`, type: "success" });
                });
            }).catch(err => {
                logger.warn(`Clipboard write failed for ${label}:`, err);
            });

            if (isSensitive) {
                if (clipboardTimer.current) clearTimeout(clipboardTimer.current);
                clipboardTimer.current = setTimeout(() => {
                    try {
                        // Security Guard: Browser blocks clipboard access if document is not focused.
                        // We try-catch to prevent application crash on tab switch or permission denial.
                        if (document.hasFocus()) {
                            // Blindly clear for security - we don't read to avoid extra permission prompts
                            navigator.clipboard.writeText("").then(() => {
                                logger.info(`Clipboard auto-cleared for sensitive ${label}`);
                            }).catch(() => {
                                // Silent fail for auto-clear
                            });
                        }
                    } catch (e) {
                        // Ignore clear errors
                    }
                }, CLIPBOARD_TIMEOUT);
            }
        } catch (error) {
            logger.warn(`Clipboard access denied for ${label}:`, error);
        }
    };

    // Tracking activity for auto-lock
    useEffect(() => {
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        const handleActivity = () => resetInactivityTimer();

        if (isUnlocked) {
            events.forEach(event => window.addEventListener(event, handleActivity));
            resetInactivityTimer();
        }

        return () => {
            events.forEach(event => window.removeEventListener(event, handleActivity));
            if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
        };
    }, [isUnlocked]);
    const setTeamKey = (teamId: string, key: CryptoKey) => {
        setTeamKeys(prev => ({ ...prev, [teamId]: key }));
    };

    const setFamilyKey = (familyId: string, key: CryptoKey) => {
        setFamilyKeys(prev => ({ ...prev, [familyId]: key }));
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
            familyKeys,
            setFamilyKey,
            isLoading,
            refresh,
            saveToVault,
            copyToClipboard
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
