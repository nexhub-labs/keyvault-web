import axiosInstance from './axiosInstance';

/**
 * Interface for password generation options
 */
export interface PasswordOptions {
    length: number;
    includeUppercase: boolean;
    includeLowercase: boolean;
    includeDigits: boolean;
    includeSymbols: boolean;
}

/**
 * Zero-Knowledge Password Generation
 * 1. Asks the backend for authorization (enforces tiers/limits)
 * 2. Generates the random string LOCALLY using window.crypto
 */
export async function generateSecurePassword(options: PasswordOptions): Promise<string> {
    const { length, includeUppercase, includeLowercase, includeDigits, includeSymbols } = options;

    // 1. Handshake with Backend (Enforce Tier Limits)
    // The backend validates the 'length' and user 'tier' but never sees the result
    const response = await axiosInstance.post('/keyvault/authorize-generation', {
        length,
        includeUppercase,
        includeLowercase,
        includeDigits,
        includeSymbols,
    });

    if (!response.data.authorized) {
        throw new Error('Server denied password generation parameters.');
    }

    // 2. Client-Side Generation (Pure Zero-Knowledge)
    const charsets = {
        uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        lowercase: 'abcdefghijklmnopqrstuvwxyz',
        digits: '0123456789',
        symbols: '!@#$%^&*()_+[]{}|;:,.<>?',
    };

    let charset = '';
    if (includeUppercase) charset += charsets.uppercase;
    if (includeLowercase) charset += charsets.lowercase;
    if (includeDigits) charset += charsets.digits;
    if (includeSymbols) charset += charsets.symbols;

    if (!charset) {
        throw new Error('At least one character set must be selected.');
    }

    return generateRandomString(length, charset);
}

/**
 * Cryptographically secure random string generation using Web Crypto API
 */
function generateRandomString(length: number, charset: string): string {
    const array = new Uint32Array(length);
    window.crypto.getRandomValues(array);

    let result = '';
    for (let i = 0; i < length; i++) {
        result += charset.charAt(array[i] % charset.length);
    }

    return result;
}
