/**
 * Vault API Unit Tests
 * Tests for vault CRUD operations using MSW mocks.
 */
import {
    generatePasswordAPI,
    storePasswordAPI,
    viewVaultDBAPI,
    retrievePasswordAPI,
} from './vault';

describe('generatePasswordAPI', () => {
    it('generates a password with specified options', async () => {
        const password = await generatePasswordAPI({
            includeUppercase: true,
            includeLowercase: true,
            includeDigits: true,
            includeSymbols: false,
            length: 16,
        });

        expect(typeof password).toBe('string');
        expect(password.length).toBe(16);
    });

    it('respects length option', async () => {
        const password = await generatePasswordAPI({
            includeUppercase: true,
            includeLowercase: true,
            includeDigits: false,
            includeSymbols: false,
            length: 24,
        });

        expect(password.length).toBe(24);
    });
});

describe('storePasswordAPI', () => {
    it('stores encrypted password and returns success message', async () => {
        const result = await storePasswordAPI(
            'my_account',
            'encryptedDataBase64',
            'ivBase64'
        );

        expect(result.message).toContain('my_account');
        expect(result.message).toContain('stored successfully');
    });
});

describe('viewVaultDBAPI', () => {
    it('returns list of vault items', async () => {
        const items = await viewVaultDBAPI();

        expect(Array.isArray(items)).toBe(true);
        expect(items.length).toBeGreaterThan(0);

        const firstItem = items[0];
        expect(firstItem).toHaveProperty('_id');
        expect(firstItem).toHaveProperty('keyName');
        expect(firstItem).toHaveProperty('encryptedData');
        expect(firstItem).toHaveProperty('iv');
        expect(firstItem).toHaveProperty('algorithm');
    });
});

describe('retrievePasswordAPI', () => {
    it('retrieves encrypted data for a key name', async () => {
        const result = await retrievePasswordAPI('my_account');

        expect(result).toHaveProperty('encryptedData');
        expect(result).toHaveProperty('iv');
        expect(result).toHaveProperty('algorithm');
        expect(result.algorithm).toBe('aes-256-gcm');
    });
});
