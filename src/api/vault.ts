import axiosInstance from "../utils/axiosInstance";

export interface VaultItem {
    _id: string;
    keyName: string;
    encryptedData: string; // The encrypted blob from the frontend
    iv: string;
    algorithm: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
    projectId?: string;
    teamId?: string;
    familyId?: string;
    secretType?: string;
    tags?: string[];
    folder?: string;
}

export interface GenerateProps {
    includeUppercase: boolean;
    includeLowercase: boolean;
    includeDigits: boolean;
    includeSymbols: boolean;
    length?: number;
};

/**
 * @deprecated Use generateSecurePassword() from utils/password for Zero-Knowledge generation.
 * This remains for legacy support but triggers a security warning on the backend.
 */
export const generatePasswordAPI = async (options: GenerateProps): Promise<string> => {
    const response = await axiosInstance.post('/keyvault/generate', options);
    return response.data.generatedKey;
};

/**
 * Stores a pre-encrypted password blob in the vault.
 * The server never sees the plain-text password.
 */
export const storePasswordAPI = async (
    keyName: string,
    encryptedData: string,
    iv: string,
    algorithm: string = 'AES-GCM',
    extra: { projectId?: string; teamId?: string; familyId?: string; secretType?: string; tags?: string[]; folder?: string } = {}
): Promise<{ message: string }> => {
    const response = await axiosInstance.post('/keyvault/store', {
        keyName,
        encryptedData,
        iv,
        algorithm,
        ...extra
    });
    return response.data;
};

export const viewVaultDBAPI = async (filter?: { projectId?: string; teamId?: string; familyId?: string }): Promise<VaultItem[]> => {
    const response = await axiosInstance.get('/keyvault/secrets', { params: filter });
    return response.data;
};

/**
 * Retrieves an encrypted password blob from the vault.
 * Decryption must be handled by the client.
 */
export const retrievePasswordAPI = async (keyName: string, query?: { teamId?: string; familyId?: string }): Promise<{ encryptedData: string; iv: string; algorithm: string }> => {
    const response = await axiosInstance.get(`/keyvault/secrets/${keyName}`, { params: query });
    return response.data;
};
/**
 * Deletes a password from the vault.
 */
export const deletePasswordAPI = async (keyName: string, extra?: { teamId?: string; familyId?: string }): Promise<{ message: string }> => {
    const response = await axiosInstance.post('/keyvault/delete', { keyName, ...extra });
    return response.data;
};

/**
 * Updates metadata of a vault item without modifying the encrypted payload.
 */
export const updateVaultItemAPI = async (
    keyName: string,
    updateData: {
        projectId?: string;
        tags?: string[];
        folder?: string;
        encryptedData?: string;
        iv?: string;
    },
    extra?: { currentTeamId?: string; currentFamilyId?: string }
): Promise<{ message: string }> => {
    const response = await axiosInstance.post('/keyvault/update', {
        keyName,
        ...updateData,
        ...extra
    });
    return response.data;
};
