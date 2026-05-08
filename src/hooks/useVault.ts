import { useEffect, useMemo, useState } from 'react';
import { retrievePasswordAPI, deletePasswordAPI, updateVaultItemAPI } from '../api/vault';
import { calculateVaultHealth, calculateSecurityLevel } from '../utils/security';
import { decryptWithKey } from '../utils/crypto';
import { useVaultContext } from '../context/VaultContext';
import { logger } from '../utils/logger';

export const useVault = (options: { autoFetch?: boolean } = { autoFetch: true }) => {
    const {
        mek: contextMek,
        vaultKey: contextVaultKey,
        isUnlocked,
        vaultItems,
        refreshVault,
        isLoading: loading,
        refresh,
        saveToVault
    } = useVaultContext();

    const vaultStats = useMemo(() => ({
        totalItems: vaultItems.length,
        vaultHealth: calculateVaultHealth(vaultItems),
        securityScore: calculateSecurityLevel(vaultItems)
    }), [vaultItems]);

    // Context methods (refresh, saveToVault) are now injected directly from VaultContext

    /**
     * Retrieves an encrypted password from the vault and decrypts it.
     * Uses the Vault Key (EK) from context (or MEK if legacy).
     */
    const decryptVaultPassword = async (keyName: string, extra?: { teamId?: string; familyId?: string }): Promise<string | null> => {
        // Prioritize Context Keys -> Vault Key (Key Indirection) -> MEK (Legacy)
        let keyToUse = (extra?.teamId && contextVaultKey) ? (useVaultContext().teamKeys[extra.teamId]) :
            (extra?.familyId && contextVaultKey) ? (useVaultContext().familyKeys[extra.familyId]) :
                (contextVaultKey || contextMek);

        // Re-deriving for clarity if not found in state
        if (extra?.teamId) keyToUse = useVaultContext().teamKeys[extra.teamId] || null;
        else if (extra?.familyId) keyToUse = useVaultContext().familyKeys[extra.familyId] || null;
        else keyToUse = contextVaultKey || contextMek;

        if (!keyToUse) {
            throw new Error("Vault not unlocked");
        }

        try {
            const { encryptedData, iv } = await retrievePasswordAPI(keyName, extra);
            const decryptedPassword = await decryptWithKey(encryptedData, iv, keyToUse);
            return decryptedPassword;
        } catch (err) {
            logger.error("Failed to decrypt password", err);
            throw err;
        }
    };

    /**
     * Deletes a password from the vault.
     */
    const deleteItem = async (keyName: string, extra?: { teamId?: string; familyId?: string }) => {
        try {
            await deletePasswordAPI(keyName, extra);
            refresh(undefined, true); // Refresh list via Context (Forced)
        } catch (err) {
            logger.error("Failed to delete item", err);
            throw err;
        }
    };

    /**
     * Updates the metadata of a vault item (e.g., assigning it to a project).
     */
    const updateItem = async (
        keyName: string,
        updateData: {
            projectId?: string;
            tags?: string[];
            folder?: string;
            encryptedData?: string;
            iv?: string;
        },
        extra?: { currentTeamId?: string; currentFamilyId?: string }
    ) => {
        try {
            await updateVaultItemAPI(keyName, updateData, extra);
            refresh(undefined, true); // Refresh list via Context (Forced)
        } catch (err) {
            logger.error("Failed to update item metadata", err);
            throw err;
        }
    };

    // Check if keys are available in context
    const hasMasterPassword = !!(contextVaultKey || contextMek);

    const [hasFetched, setHasFetched] = useState(false);

    useEffect(() => {
        // Only fetch if autoFetch is true AND we have no items AND we aren't currently loading AND we haven't tried yet.
        // This prevents re-fetching on navigation if data exists, and stops loops if vault is empty.
        if (options.autoFetch && vaultItems.length === 0 && !loading && !hasFetched) {
            setHasFetched(true);
            refreshVault();
        }
    }, [options.autoFetch, vaultItems.length, loading, hasFetched, refreshVault]);

    return { vaultItems, saveToVault, decryptPassword: decryptVaultPassword, deleteItem, updateItem, loading, refresh, vaultStats, isUnlocked, hasMasterPassword };
};
