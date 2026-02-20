/**
 * Validation Utilities Unit Tests
 * Tests for Yup validation schemas.
 */
import {
    profileSchema,
    passwordChangeSchema,
    resetPasswordSchema,
    trustedContactsSchema,
    recoveryKeySchema,
    otpSchema,
    forgotPasswordSchema,
} from './validation';

describe('profileSchema', () => {
    it('validates a valid full name', async () => {
        const result = await profileSchema.isValid({ fullName: 'John Doe' });
        expect(result).toBe(true);
    });

    it('rejects empty name', async () => {
        await expect(profileSchema.validate({ fullName: '' }))
            .rejects.toThrow();
    });

    it('rejects name with invalid characters', async () => {
        await expect(profileSchema.validate({ fullName: 'John123' }))
            .rejects.toThrow('Name can only contain letters');
    });

    it('rejects name longer than 50 characters', async () => {
        const longName = 'a'.repeat(51);
        await expect(profileSchema.validate({ fullName: longName }))
            .rejects.toThrow('cannot exceed 50 characters');
    });

    it('accepts names with hyphens and apostrophes', async () => {
        const result = await profileSchema.isValid({ fullName: "Mary-Jane O'Brien" });
        expect(result).toBe(true);
    });
});

describe('passwordChangeSchema', () => {
    it('validates matching passwords', async () => {
        const result = await passwordChangeSchema.isValid({
            newPassword: 'securePass123',
            confirmPassword: 'securePass123',
        });
        expect(result).toBe(true);
    });

    it('rejects non-matching passwords', async () => {
        await expect(passwordChangeSchema.validate({
            newPassword: 'securePass123',
            confirmPassword: 'differentPass',
        })).rejects.toThrow('Passwords do not match');
    });

    it('rejects password shorter than 6 characters', async () => {
        await expect(passwordChangeSchema.validate({
            newPassword: '12345',
            confirmPassword: '12345',
        })).rejects.toThrow('at least 6 characters');
    });
});

describe('resetPasswordSchema', () => {
    it('validates valid reset password form', async () => {
        const result = await resetPasswordSchema.isValid({
            newPassword: 'newSecurePass',
            confirmPassword: 'newSecurePass',
        });
        expect(result).toBe(true);
    });

    it('requires password fields', async () => {
        await expect(resetPasswordSchema.validate({
            newPassword: '',
            confirmPassword: '',
        })).rejects.toThrow('confirm');
    });
});

describe('trustedContactsSchema', () => {
    it('validates exactly 3 unique email contacts', async () => {
        const result = await trustedContactsSchema.isValid({
            contacts: ['a@test.com', 'b@test.com', 'c@test.com'],
        });
        expect(result).toBe(true);
    });

    it('rejects fewer than 3 contacts', async () => {
        await expect(trustedContactsSchema.validate({
            contacts: ['a@test.com', 'b@test.com'],
        })).rejects.toThrow('Exactly 3 trusted contacts');
    });

    it('rejects more than 3 contacts', async () => {
        await expect(trustedContactsSchema.validate({
            contacts: ['a@test.com', 'b@test.com', 'c@test.com', 'd@test.com'],
        })).rejects.toThrow('Exactly 3 trusted contacts');
    });

    it('rejects duplicate email addresses', async () => {
        await expect(trustedContactsSchema.validate({
            contacts: ['a@test.com', 'a@test.com', 'b@test.com'],
        })).rejects.toThrow('unique email addresses');
    });

    it('rejects invalid email format', async () => {
        await expect(trustedContactsSchema.validate({
            contacts: ['invalid-email', 'b@test.com', 'c@test.com'],
        })).rejects.toThrow('valid email');
    });
});

describe('recoveryKeySchema', () => {
    it('validates 32-character hex recovery key', async () => {
        const result = await recoveryKeySchema.isValid({
            recoveryKey: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6',
        });
        expect(result).toBe(true);
    });

    it('rejects recovery key not 32 characters', async () => {
        await expect(recoveryKeySchema.validate({
            recoveryKey: 'tooshort',
        })).rejects.toThrow('exactly 32 characters');
    });

    it('rejects non-hexadecimal characters', async () => {
        await expect(recoveryKeySchema.validate({
            recoveryKey: 'ghijklmnopqrstuvwxyz123456789012', // 32 chars but not all hex
        })).rejects.toThrow('hexadecimal');
    });
});

describe('otpSchema', () => {
    it('validates 6-digit OTP', async () => {
        const result = await otpSchema.isValid({ otp: '123456' });
        expect(result).toBe(true);
    });

    it('rejects OTP not 6 digits', async () => {
        await expect(otpSchema.validate({ otp: '12345' }))
            .rejects.toThrow('exactly 6 digits');
    });

    it('rejects non-numeric OTP', async () => {
        await expect(otpSchema.validate({ otp: 'abcdef' }))
            .rejects.toThrow('only numbers');
    });
});

describe('forgotPasswordSchema', () => {
    it('validates valid email', async () => {
        const result = await forgotPasswordSchema.isValid({
            email: 'user@example.com',
        });
        expect(result).toBe(true);
    });

    it('rejects invalid email', async () => {
        await expect(forgotPasswordSchema.validate({
            email: 'not-an-email',
        })).rejects.toThrow('valid email');
    });

    it('requires email field', async () => {
        await expect(forgotPasswordSchema.validate({
            email: '',
        })).rejects.toThrow('required');
    });
});
