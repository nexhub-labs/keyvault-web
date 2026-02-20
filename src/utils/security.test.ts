/**
 * Security Utilities Unit Tests
 * Tests for vault health and security level calculations.
 */
import { VaultItem } from '../api/vault';
import {
    getPasswordStrength,
    getHeuristicStrength,
    calculateVaultHealth,
    calculateSecurityLevel,
} from './security';

describe('getPasswordStrength', () => {
    it('returns "None" for empty password', () => {
        const result = getPasswordStrength('');
        expect(result.label).toBe('None');
        expect(result.score).toBe(0);
    });

    it('returns "Weak" for short simple password', () => {
        const result = getPasswordStrength('abc');
        expect(result.label).toBe('Weak');
        expect(result.score).toBeLessThanOrEqual(20);
    });

    it('returns "Good" for medium-length lowercase password', () => {
        const result = getPasswordStrength('abcdefgh');
        expect(result.label).toBe('Good');
        expect(result.score).toBeGreaterThan(40);
    });

    it('returns "Good" or better for mixed case password', () => {
        const result = getPasswordStrength('AbCdEfGh12');
        expect(result.score).toBeGreaterThan(40);
    });

    it('returns "Strong" for password with all character types', () => {
        const result = getPasswordStrength('AbCd1234!@#$');
        expect(result.score).toBeGreaterThan(60);
    });

    it('returns "Very Strong" for long complex password', () => {
        const result = getPasswordStrength('Ab1!Cd2@Ef3#Gh4$Ij5%');
        expect(result.label).toBe('Very Strong');
        expect(result.score).toBeGreaterThan(80);
    });

    it('penalizes passwords with repeated characters', () => {
        const withRepeats = getPasswordStrength('aaabbbccc');
        const withoutRepeats = getPasswordStrength('abcdefghi');
        expect(withRepeats.score).toBeLessThan(withoutRepeats.score);
    });
});

describe('getHeuristicStrength', () => {
    const createMockVaultItem = (overrides: Partial<VaultItem> = {}): VaultItem => ({
        _id: '1',
        keyName: 'test_key',
        encryptedData: 'c3VwZXJTZWN1cmVFbmNyeXB0ZWRCbG9i', // 32+ chars
        iv: 'aW5pdGlhbGl6YXRpb25WZWN0b3I=',
        algorithm: 'aes-256-gcm',
        userId: 'test-user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...overrides,
    });

    it('returns "Unknown" for item with no encrypted data', () => {
        const item = createMockVaultItem({ encryptedData: '' });
        const result = getHeuristicStrength(item);
        expect(result.label).toBe('Unknown');
        expect(result.score).toBe(0);
    });

    it('gives higher score for longer ciphertext', () => {
        const shortItem = createMockVaultItem({ encryptedData: 'short' }); // <16 chars
        const longItem = createMockVaultItem({ encryptedData: 'c3VwZXJTZWN1cmVFbmNyeXB0ZWRCbG9iVmVyeUxvbmc=' }); // >32 chars

        const shortResult = getHeuristicStrength(shortItem);
        const longResult = getHeuristicStrength(longItem);

        expect(longResult.score).toBeGreaterThan(shortResult.score);
    });

    it('penalizes old passwords (temporal decay)', () => {
        const newItem = createMockVaultItem({
            createdAt: new Date().toISOString(),
        });
        const oldItem = createMockVaultItem({
            createdAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(), // 200 days ago
        });

        const newResult = getHeuristicStrength(newItem);
        const oldResult = getHeuristicStrength(oldItem);

        expect(oldResult.score).toBeLessThan(newResult.score);
    });
});

describe('calculateVaultHealth', () => {
    const createMockVaultItem = (encryptedData: string, createdAt: Date): VaultItem => ({
        _id: '1',
        keyName: 'test_key',
        encryptedData,
        iv: 'aW5pdGlhbGl6YXRpb25WZWN0b3I=',
        algorithm: 'aes-256-gcm',
        userId: 'test-user',
        createdAt: createdAt.toISOString(),
        updatedAt: new Date().toISOString(),
    });

    it('returns 100 for empty vault', () => {
        const result = calculateVaultHealth([]);
        expect(result).toBe(100);
    });

    it('calculates average health for multiple items', () => {
        const items = [
            createMockVaultItem('c3VwZXJTZWN1cmVFbmNyeXB0ZWRCbG9i', new Date()),
            createMockVaultItem('c3VwZXJTZWN1cmVFbmNyeXB0ZWRCbG9i', new Date()),
        ];
        const result = calculateVaultHealth(items);
        expect(result).toBeGreaterThan(0);
        expect(result).toBeLessThanOrEqual(100);
    });
});

describe('calculateSecurityLevel', () => {
    const createMockVaultItem = (encryptedData: string): VaultItem => ({
        _id: '1',
        keyName: 'test_key',
        encryptedData,
        iv: 'aW5pdGlhbGl6YXRpb25WZWN0b3I=',
        algorithm: 'aes-256-gcm',
        userId: 'test-user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    });

    it('returns 100 for empty vault', () => {
        const result = calculateSecurityLevel([]);
        expect(result).toBe(100);
    });

    it('calculates percentage of strong items', () => {
        const items = [
            createMockVaultItem('c3VwZXJTZWN1cmVFbmNyeXB0ZWRCbG9iVmVyeUxvbmc='), // Strong
            createMockVaultItem('short'), // Weak
        ];
        const result = calculateSecurityLevel(items);
        expect(result).toBe(50); // 1 of 2 items is strong
    });
});
