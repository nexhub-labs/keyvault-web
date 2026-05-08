/**
 * Auth API Unit Tests
 * Tests for authentication API functions using MSW mocks.
 */
import {
    setupMasterAPI,
    getMasterPasswordStatusAPI,
    verifyMasterPasswordAPI,
    getTrustedContactsAPI,
    requestRecoveryOTPAPI,
    verifyRecoveryOTPAPI,
    initiateTrustedRecoveryAPI,
    checkRecoveryStatusAPI,
    initiateSupabasePasswordRecoveryAPI,
} from './auth';

describe('getMasterPasswordStatusAPI', () => {
    it('returns master password setup status', async () => {
        const status = await getMasterPasswordStatusAPI();

        expect(status).toHaveProperty('hasMasterSetup');
        expect(status).toHaveProperty('masterPasswordIsCustom');
        expect(status.hasMasterSetup).toBe(true);
    });
});

describe('verifyMasterPasswordAPI', () => {
    it('verifies master password hash and returns vault data', async () => {
        const result = await verifyMasterPasswordAPI('validMasterPasswordHash');

        expect(result.valid).toBe(true);
        expect(result).toHaveProperty('wrappedMasterSeed');
        expect(result).toHaveProperty('wrappedMasterSeedIv');
        expect(result).toHaveProperty('vaultSalt');
        expect(result).toHaveProperty('masterPasswordSalt');
    });
});

describe('setupMasterAPI', () => {
    it('sets up master password successfully', async () => {
        const result = await setupMasterAPI({
            masterPasswordHash: 'testHash',
            recoveryKeyHash: 'testRecoveryHash',
            vaultSalt: 'testVaultSalt',
            masterPasswordSalt: 'testMasterSalt',
            wrappedMasterSeed: 'testWrappedSeed',
            wrappedMasterSeedIv: 'testIv',
        });

        expect(result.message).toContain('successfully');
    });
});

describe('getTrustedContactsAPI', () => {
    it('returns list of trusted contacts', async () => {
        const contacts = await getTrustedContactsAPI();

        expect(Array.isArray(contacts)).toBe(true);
        expect(contacts.length).toBe(3);

        const contact = contacts[0];
        expect(contact).toHaveProperty('email');
        expect(contact).toHaveProperty('shardIndex');
        expect(contact).toHaveProperty('status');
    });
});

describe('requestRecoveryOTPAPI', () => {
    it('requests OTP and returns expiry info', async () => {
        const result = await requestRecoveryOTPAPI('test@example.com', 'recoveryKeyHashValue');

        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('expiresIn');
        expect(result.expiresIn).toBe(300);
    });
});

describe('verifyRecoveryOTPAPI', () => {
    it('verifies OTP and returns salt data', async () => {
        const result = await verifyRecoveryOTPAPI('test@example.com','recoveryKeyHash', '123456');

        expect(result).toHaveProperty('salt');
        expect(result).toHaveProperty('vaultSalt');
    });
});

describe('initiateTrustedRecoveryAPI', () => {
    it('initiates recovery and returns request ID', async () => {
        const result = await initiateTrustedRecoveryAPI();

        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('requestId');
        expect(result.requestId).toBeTruthy();
    });
});

describe('checkRecoveryStatusAPI', () => {
    it('returns recovery status with approval count', async () => {
        const result = await checkRecoveryStatusAPI();

        expect(result).toHaveProperty('status');
        expect(result.status).toBe('pending');
        expect(result).toHaveProperty('approvedCount');
        expect(result).toHaveProperty('requiredCount');
    });
});

describe('initiateSupabasePasswordRecoveryAPI', () => {
    it('initiates Supabase password recovery', async () => {
        const result = await initiateSupabasePasswordRecoveryAPI('user@example.com');

        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('success');
        expect(result.success).toBe(true);
    });
});
