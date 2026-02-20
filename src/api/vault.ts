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
}

export interface GenerateProps {
    includeUppercase: boolean;
    includeLowercase: boolean;
    includeDigits: boolean;
    includeSymbols: boolean;
    length?: number;
};

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
    extra: { projectId?: string; teamId?: string; familyId?: string; secretType?: string } = {}
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
    const response = await axiosInstance.post('/keyvault/viewDB', filter || {});
    return response.data;
};

/**
 * Retrieves an encrypted password blob from the vault.
 * Decryption must be handled by the client.
 */
export const retrievePasswordAPI = async (keyName: string): Promise<{ encryptedData: string; iv: string; algorithm: string }> => {
    const response = await axiosInstance.post('/keyvault/retrieve', { keyName });
    return response.data;
};
/**
 * Deletes a password from the vault.
 */
export const deletePasswordAPI = async (keyName: string): Promise<{ message: string }> => {
    const response = await axiosInstance.post('/keyvault/delete', { keyName });
    return response.data;
};
