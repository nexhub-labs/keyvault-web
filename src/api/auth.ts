import axiosInstance from "../utils/axiosInstance";

// ---------------------------
// Types
// ---------------------------

export interface MasterStatusResponse {
    hasMasterSetup: boolean;
    masterPasswordIsCustom: boolean;
    salt?: string;
    masterPasswordSalt?: string;
    hasPasskeys?: boolean;
}

export interface SetupMasterPayload {
    masterPasswordHash: string; // The MPH derived from master password + salt
    recoveryKeyHash: string; // The hash of the Recovery Key (for verification)
    vaultSalt: string; // Salt for vault encryption
    masterPasswordSalt: string; // Salt for master password derivation
    wrappedMasterSeed: string; // Master Seed encrypted with the user's password
    wrappedMasterSeedIv: string; // IV for the wrappedMasterSeed
}

export interface SetupTrustedContactsPayload {
    contacts: TrustedContactPayload[];
}

export interface TrustedContactPayload {
    email: string;        // Consistently used across frontend/backend
    keyShard?: string;    // Shamir shard (optional, not returned by GET endpoint)
    shardIndex: number;
    status?: string;      // Status of the contact (pending/complete)
}

export interface RecoveryStatusResponse {
    status: 'pending' | 'complete' | 'expired' | 'none' | 'no_request';
    // For pending status
    approvedCount?: number;
    requiredCount?: number;
    // For complete status
    shards?: string[];
    vaultSalt?: string;
}

export interface OTPRequestResponse {
    message: string;
    expiresIn: number;
}

export interface VerifyOTPResponse {
    salt: string;
    masterPasswordSalt?: string;
    vaultSalt: string;
}

export interface InitiateRecoveryResponse {
    message: string;
    requestId: string;
}

export interface APIError {
    message: string;
    statusCode: number;
    error?: string;
}

export interface TwoFASetupResponse {
    totpSetupKey: string;
    qrCodeUrl: string;
}

export interface TwoFAStatusResponse {
    enabled: boolean;
}

export interface PricingLimitsResponse {
    tier: string;
    vaultLimit: number;
    canShare: boolean;
    maxLength: number;
    canUseSymbols: boolean;
}

// ---------------------------
// Endpoints
// ---------------------------

/**
 * Sets up the user's Master Password (encrypted master key) and Recovery Key.
 */
export const setupMasterAPI = async (data: SetupMasterPayload): Promise<{ message: string }> => {
    // console.log("setupMasterAPI called with:", JSON.stringify(data, null, 2));
    const response = await axiosInstance.post('/auth/setup-master', data);
    return response.data;
};

/**
 * Stores the 3 trusted contacts and their respective key shards.
 */
export const setupTrustedContactsAPI = async (contacts: TrustedContactPayload[]): Promise<{ message: string }> => {
    const response = await axiosInstance.post('/auth/setup-contacts', { contacts });
    return response.data;
};

/**
 * Payload for migrating legacy PBKDF2 hash to Argon2.
 */
export interface MigrateLegacyHashPayload {
    newMasterPasswordHash: string;
    newWrappedMasterSeed: string;
    newWrappedMasterSeedIv: string;
}

/**
 * Migrates a legacy user's PBKDF2 hash to Argon2.
 * Called automatically during unlock when legacy hash is detected.
 */
export const migrateLegacyHashAPI = async (data: MigrateLegacyHashPayload): Promise<{ message: string }> => {
    const response = await axiosInstance.post('/auth/migrate-hash', data);
    return response.data;
};

/**
 * Requests an OTP to be sent to the user's email for Recovery Key flow.
 * @param recoveryKey - The hex recovery key provided by the user (sent as hash to verify ownership)
 */
export const requestRecoveryOTPAPI = async (recoveryKeyHash: string): Promise<OTPRequestResponse> => {
    const response = await axiosInstance.post('/auth/recover/otp', { recoveryKeyHash });
    return response.data;
};

/**
 * Verifies the OTP and returns the Encrypted Master Key.
 */
export const verifyRecoveryOTPAPI = async (
    recoveryKeyHash: string,
    otp: string
): Promise<VerifyOTPResponse> => {
    const response = await axiosInstance.post('/auth/recover/verify-otp', {
        recoveryKeyHash,
        otp
    });
    return response.data;
};

/**
 * Initiates the Trusted Contact recovery flow (sends magic links).
 */
export const initiateTrustedRecoveryAPI = async (): Promise<InitiateRecoveryResponse> => {
    const response = await axiosInstance.post('/auth/recover/request');
    return response.data;
};

/**
 * Checks the status of an active recovery request.
 * Poll this to see if enough contacts have approved.
 */
export const checkRecoveryStatusAPI = async (): Promise<RecoveryStatusResponse> => {
    const response = await axiosInstance.get('/auth/recover/status');
    return response.data;
};

/**
 * Gets the user's trusted contacts.
 */
export const getTrustedContactsAPI = async (): Promise<TrustedContactPayload[]> => {
    const response = await axiosInstance.get('/auth/contacts');
    return response.data.contacts || [];
};

/**
 * Gets the user's master password setup status.
 */
export const getMasterPasswordStatusAPI = async (): Promise<MasterStatusResponse> => {
    const response = await axiosInstance.get('/auth/master-status');
    return response.data;
};

/**
 * Sends the Master Password Hash (MPH) to the server to verify the "Two-Factor Context".
 * If successful, the server sets a session flag indicating the vault is "unlocked" for this device.
 */
export const verifyMasterPasswordAPI = async (masterPasswordHash: string, totpToken?: string): Promise<{
    valid: boolean;
    wrappedMasterSeed: string;
    wrappedMasterSeedIv: string;
    vaultSalt: string;
    masterPasswordSalt: string;
}> => {
    const response = await axiosInstance.post('/auth/verify-master', { masterPasswordHash, totpToken });
    return response.data;
};

/**
 * Initiates Supabase password recovery for a user
 */
export const initiateSupabasePasswordRecoveryAPI = async (
    email: string,
): Promise<{ message: string; success: boolean }> => {
    const response = await axiosInstance.post('/auth/supabase-recover-password', {
        email,
    });
    return response.data;
};

/**
 * Approves a recovery request using a magic link token.
 */
export const approveRecoveryAPI = async (token: string, requestId: string): Promise<{ message: string; approved: boolean }> => {
    const response = await axiosInstance.get(`/auth/recover/approve/${token}?requestId=${requestId}`);
    return response.data;
};

/**
 * Gets the current 2FA status for the user.
 */
export const get2FAStatusAPI = async (): Promise<TwoFAStatusResponse> => {
    const response = await axiosInstance.get('/auth/2fa/status');
    return response.data;
};

/**
 * Starts 2FA setup and returns the secret and QR code.
 */
export const setup2FAAPI = async (): Promise<TwoFASetupResponse> => {
    const response = await axiosInstance.get('/auth/2fa/setup');
    return response.data;
};

/**
 * Activates 2FA with the provided secret and verification token.
 */
export const activate2FAAPI = async (secret: string, token: string): Promise<{ message: string; backupCodes: string[] }> => {
    const response = await axiosInstance.post('/auth/2fa/activate', { secret, token });
    return response.data;
};

/**
 * Deactivates 2FA with a verification token.
 */
export const deactivate2FAAPI = async (token: string): Promise<{ message: string }> => {
    const response = await axiosInstance.post('/auth/2fa/deactivate', { token });
    return response.data;
};

/**
 * Gets the pricing tier limits for the current user.
 */
export const getPricingLimitsAPI = async (): Promise<PricingLimitsResponse> => {
    const response = await axiosInstance.get('/pricing/limits');
    return response.data;
};
