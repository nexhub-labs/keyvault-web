import secrets from 'secrets.js-grempe';
import { argon2id } from 'hash-wasm';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import axios from 'axios';

/**
 * Zero-Knowledge Cryptography Utilities
 * Uses Web Crypto API for client-side encryption/decryption.
 * The server never sees plain-text passwords or the master key.
 */

const KEY_LENGTH = 256;
const ALGORITHM = 'AES-GCM';

// Argon2id Parameters
const ARGON2_ITERATIONS = 3;
const ARGON2_MEMORY = 65536; // 64MB
const ARGON2_PARALLELISM = 1;

// RSA Parameters
const RSA_MODULUS_LENGTH = 4096;
const RSA_PUBLIC_EXPONENT = new Uint8Array([0x01, 0x00, 0x01]); // 65537
const RSA_HASH = 'SHA-256';

/**
 * Generates a cryptographically secure random salt.
 * @param length - Length of the salt in bytes (default 16)
 * @returns Base64-encoded salt string
 */
export function generateSalt(length: number = 16): string {
    const saltBytes = window.crypto.getRandomValues(new Uint8Array(length));
    return btoa(String.fromCharCode(...saltBytes));
}

/**
 * Helper to derive bits using Argon2id.
 */
async function deriveBitsArgon2(password: string, salt: string, length: number = 32): Promise<Uint8Array> {
    const hash = await argon2id({
        password,
        salt: salt.slice(0, 16).padEnd(16, '0'), // Salt must be at least 16 bytes
        iterations: ARGON2_ITERATIONS,
        memorySize: ARGON2_MEMORY,
        parallelism: ARGON2_PARALLELISM,
        hashLength: length,
        outputType: 'binary',
    });
    return hash as Uint8Array;
}

/**
 * Derives the Master Password Hash (MPH) for server-side authentication.
 * @param masterPassword - The user's master password
 * @param salt - A unique salt (master password salt)
 * @returns The MPH hex string
 */
export async function deriveMasterPasswordHash(masterPassword: string, salt: string): Promise<string> {
    const derivedBits = await deriveBitsArgon2(masterPassword, salt, 32);
    return Array.from(derivedBits)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}


/**
 * Generates what we call a "Vault Key" (EK).
 * This is a standard AES-GCM 256-bit key that encrypts the actual data.
 * It is itself encrypted (wrapped) by the MEK (KEK).
 */
export async function generateVaultKey(): Promise<CryptoKey> {
    return window.crypto.subtle.generateKey(
        {
            name: ALGORITHM,
            length: KEY_LENGTH
        },
        true,
        ['encrypt', 'decrypt']
    );
}

/**
 * Derives an extractable Master Encryption Key for setup purposes.
 * @param masterPassword - The user's master password
 * @param salt - A unique salt (e.g., user's email or ID)
 * @returns Extractable CryptoKey for setup
 */
export async function deriveExtractableMasterKey(masterPassword: string, salt: string): Promise<CryptoKey> {
    const derivedBits = await deriveBitsArgon2(masterPassword, salt, 32);

    // Import MEK as a CryptoKey (extractable for setup)
    return await window.crypto.subtle.importKey(
        'raw',
        Uint8Array.from(derivedBits),
        { name: ALGORITHM, length: KEY_LENGTH },
        true, // Set extractable to true for setup
        ['encrypt', 'decrypt']
    );
}

/**
 * Generates a high-entropy random Master Seed.
 * @returns 32-byte hex string (256 bits)
 */
export function generateMasterSeed(): string {
    return Array.from(window.crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * Derives the Master Encryption Key (MEK) from the Master Seed.
 */
export async function deriveMekFromSeed(seed: string, salt: string): Promise<CryptoKey> {
    const derivedBits = await deriveBitsArgon2(seed, salt, 32);

    return window.crypto.subtle.importKey(
        'raw',
        Uint8Array.from(derivedBits),
        { name: ALGORITHM, length: KEY_LENGTH },
        true, // Must be extractable for legacy vault key promotion
        ['encrypt', 'decrypt']
    );
}

/**
 * Wraps (encrypts) the Master Seed using the user's password.
 */
export async function wrapMasterSeed(seed: string, password: string, salt: string): Promise<{ wrappedSeed: string; iv: string }> {
    const derivedBits = await deriveBitsArgon2(password, salt, 32);
    const wrappingKey = await window.crypto.subtle.importKey(
        'raw',
        Uint8Array.from(derivedBits),
        { name: ALGORITHM, length: KEY_LENGTH },
        false,
        ['encrypt', 'decrypt']
    );

    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encryptedBuffer = await window.crypto.subtle.encrypt(
        { name: ALGORITHM, iv },
        wrappingKey,
        new TextEncoder().encode(seed)
    );

    return {
        wrappedSeed: btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer))),
        iv: btoa(String.fromCharCode(...iv))
    };
}

/**
 * Unwraps (decrypts) the Master Seed using the user's password.
 */
export async function unwrapMasterSeed(wrappedSeed: string, iv: string, password: string, salt: string): Promise<string> {
    const derivedBits = await deriveBitsArgon2(password, salt, 32);
    const unwrappingKey = await window.crypto.subtle.importKey(
        'raw',
        Uint8Array.from(derivedBits),
        { name: ALGORITHM, length: KEY_LENGTH },
        false,
        ['encrypt', 'decrypt']
    );

    const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: ALGORITHM, iv: Uint8Array.from(atob(iv), c => c.charCodeAt(0)) },
        unwrappingKey,
        Uint8Array.from(atob(wrappedSeed), c => c.charCodeAt(0))
    );

    return new TextDecoder().decode(decryptedBuffer);
}


/**
 * Encrypts data using AES-GCM with a provided key.
 * @param plainText - The text to encrypt
 * @param key - The CryptoKey (MEK or Recovery Key)
 * @returns Object containing the base64-encoded encrypted data and IV
 */
export async function encryptWithKey(
    plainText: string,
    key: CryptoKey
): Promise<{ encryptedData: string; iv: string }> {
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM
    const encodedData = new TextEncoder().encode(plainText);

    const encryptedBuffer = await window.crypto.subtle.encrypt(
        { name: ALGORITHM, iv },
        key,
        encodedData
    );

    const encryptedData = btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));
    const ivBase64 = btoa(String.fromCharCode(...iv));

    return { encryptedData, iv: ivBase64 };
}

/**
 * Decrypts data using AES-GCM with a provided key.
 * @param encryptedData - The base64-encoded encrypted data
 * @param iv - The base64-encoded initialization vector
 * @param key - The CryptoKey (MEK or Recovery Key)
 * @returns The decrypted plain-text string
 */
export async function decryptWithKey(
    encryptedData: string,
    iv: string,
    key: CryptoKey
): Promise<string> {
    const encryptedBuffer = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    const ivBuffer = Uint8Array.from(atob(iv), c => c.charCodeAt(0));

    const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: ALGORITHM, iv: ivBuffer },
        key,
        encryptedBuffer
    );

    return new TextDecoder().decode(decryptedBuffer);
}

/**
 * Hashes a recovery key using SHA-256 for server-side verification.
 */
export async function hashRecoveryKey(recoveryKey: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(recoveryKey);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * Helper to export a CryptoKey as raw bits (ArrayBuffer).
 */
export async function exportKeyRaw(key: CryptoKey): Promise<ArrayBuffer> {
    return window.crypto.subtle.exportKey('raw', key);
}

/**
 * Helper to import raw bits (ArrayBuffer) as a CryptoKey.
 */
export async function importKeyRaw(raw: ArrayBuffer): Promise<CryptoKey> {
    return window.crypto.subtle.importKey(
        'raw',
        raw,
        { name: ALGORITHM, length: KEY_LENGTH },
        true, // Must be extractable for re-wrapping during recovery
        ['encrypt', 'decrypt']
    );
}

/**
 * Wraps (encrypts) a key using another key.
 * This is the secure way to export a key - it's encrypted during export.
 * Uses AES-GCM for encryption with a random IV.
 * @param keyToWrap - The key to wrap (e.g., MEK)
 * @param wrappingKey - The key to use for wrapping (e.g., derived from Recovery Key)
 * @returns Base64-encoded wrapped key (IV + encrypted key data)
 */
export async function wrapKey(keyToWrap: CryptoKey, wrappingKey: CryptoKey): Promise<string> {
    // Export the key to wrap as raw bits
    const keyData = await window.crypto.subtle.exportKey('raw', keyToWrap);

    // Encrypt the key data using the wrapping key
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encryptedBuffer = await window.crypto.subtle.encrypt(
        { name: ALGORITHM, iv },
        wrappingKey,
        keyData
    );

    // Combine IV and encrypted data for storage
    const wrappedData = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    wrappedData.set(iv, 0);
    wrappedData.set(new Uint8Array(encryptedBuffer), iv.length);

    return btoa(String.fromCharCode(...wrappedData));
}

/**
 * Unwraps (decrypts) a key using another key.
 * @param wrappedKey - Base64-encoded wrapped key (IV + encrypted key data)
 * @param unwrappingKey - The key to use for unwrapping
 * @returns The unwrapped CryptoKey
 */
export async function unwrapKey(wrappedKey: string, unwrappingKey: CryptoKey): Promise<CryptoKey> {
    const wrappedBuffer = Uint8Array.from(atob(wrappedKey), c => c.charCodeAt(0));
    const iv = wrappedBuffer.slice(0, 12);
    const encryptedData = wrappedBuffer.slice(12);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: ALGORITHM, iv },
        unwrappingKey,
        encryptedData
    );

    return window.crypto.subtle.importKey(
        'raw',
        decryptedBuffer,
        { name: ALGORITHM, length: KEY_LENGTH },
        false,
        ['encrypt', 'decrypt']
    );
}


// -----------------------------------------------------------------------------
// Asymmetric Key Management (RSA-OAEP 4096)
// -----------------------------------------------------------------------------

/**
 * Generates an asymmetric RSA-OAEP 4096 key pair.
 */
export async function generateAsymmetricKeyPair(): Promise<CryptoKeyPair> {
    return window.crypto.subtle.generateKey(
        {
            name: 'RSA-OAEP',
            modulusLength: RSA_MODULUS_LENGTH,
            publicExponent: RSA_PUBLIC_EXPONENT,
            hash: RSA_HASH,
        },
        true,
        ['encrypt', 'decrypt']
    );
}

/**
 * Exports a public key to SPKI base64 string.
 */
export async function exportPublicKey(key: CryptoKey): Promise<string> {
    const exported = await window.crypto.subtle.exportKey('spki', key);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

/**
 * Wraps a private key with a symmetric key for storage.
 */
export async function exportPrivateKey(key: CryptoKey, wrappingKey: CryptoKey): Promise<{ encryptedPrivateKey: string, iv: string }> {
    const exported = await window.crypto.subtle.exportKey('pkcs8', key);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await window.crypto.subtle.encrypt(
        { name: ALGORITHM, iv },
        wrappingKey,
        exported
    );
    return {
        encryptedPrivateKey: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
        iv: btoa(String.fromCharCode(...iv))
    };
}

/**
 * Imports a public key from SPKI base64 string.
 */
export async function importPublicKey(spkiBase64: string): Promise<CryptoKey> {
    const binary = Uint8Array.from(atob(spkiBase64), c => c.charCodeAt(0));
    return window.crypto.subtle.importKey(
        'spki',
        binary,
        { name: 'RSA-OAEP', hash: RSA_HASH },
        true,
        ['encrypt']
    );
}

/**
 * Unwraps and imports a private key.
 */
export async function importPrivateKey(encryptedPrivateKey: string, iv: string, unwrappingKey: CryptoKey): Promise<CryptoKey> {
    const binary = Uint8Array.from(atob(encryptedPrivateKey), c => c.charCodeAt(0));
    const ivBinary = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
    const decrypted = await window.crypto.subtle.decrypt(
        { name: ALGORITHM, iv: ivBinary },
        unwrappingKey,
        binary
    );
    return window.crypto.subtle.importKey(
        'pkcs8',
        decrypted,
        { name: 'RSA-OAEP', hash: RSA_HASH },
        true,
        ['decrypt']
    );
}

/**
 * Wraps a symmetric key with an asymmetric public key.
 */
export async function wrapKeyAsymmetric(keyToWrap: CryptoKey, publicKey: CryptoKey): Promise<string> {
    const rawKey = await window.crypto.subtle.exportKey('raw', keyToWrap);
    const encrypted = await window.crypto.subtle.encrypt(
        { name: 'RSA-OAEP' },
        publicKey,
        rawKey
    );
    return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
}

/**
 * Unwraps a symmetric key using an asymmetric private key.
 */
export async function unwrapKeyAsymmetric(wrappedKey: string, privateKey: CryptoKey): Promise<CryptoKey> {
    const binary = Uint8Array.from(atob(wrappedKey), c => c.charCodeAt(0));
    const decrypted = await window.crypto.subtle.decrypt(
        { name: 'RSA-OAEP' },
        privateKey,
        binary
    );
    return window.crypto.subtle.importKey(
        'raw',
        decrypted,
        { name: ALGORITHM, length: KEY_LENGTH },
        true,
        ['decrypt']
    );
}

// -----------------------------------------------------------------------------
// Recovery System V2 Utilities (Shamir's Secret Sharing & Recovery Keys)
// -----------------------------------------------------------------------------

/**
 * Generates a high-entropy random recovery key.
 * Format: 32 hex characters (128-bit).
 */
export const generateRecoveryKey = (): string => {
    return secrets.random(128); // 128-bit key in hex
};

/**
 * Splits a master key (or any secret) into shards using Shamir's Secret Sharing.
 * @param secret - The secret string to split (must be hex)
 * @param risks - Minimum number of shares required to reconstruct (e.g., 2)
 * @param total - Total number of shares to generate (e.g., 3)
 * @returns Array of shares (strings)
 */
export const splitSecret = (secret: string, risks: number = 2, total: number = 3): string[] => {
    return secrets.share(secret, total, risks);
};

/**
 * Combines shares to reconstruct the original secret.
 * @param shares - Array of share strings
 * @returns The reconstructed secret (hex)
 */
export const combineShares = (shares: string[]): string => {
    return secrets.combine(shares);
};

/**
 * Converts a string to hex (needed for secrets.js).
 */
export const stringToHex = (str: string): string => {
    return secrets.str2hex(str);
};

/**
 * Converts hex to string (after reconstruction).
 */
export const hexToString = (hex: string): string => {
    return secrets.hex2str(hex);
};
// -----------------------------------------------------------------------------
// WebAuthn & PRF (Hardware-Locked Keys)
// -----------------------------------------------------------------------------


interface PRFExtensionResult {
    results: {
        first: ArrayBuffer;
    };
}

/**
 * Registers a new Passkey with optional PRF support and wraps the Master Seed.
 * @param masterSeed - The user's Master Seed (hex) to wrap with the hardware key.
 * @param usePrf - Whether to enable the PRF extension (required for Hybrid Unlock).
 */
export async function registerPasskey(masterSeed?: string, usePrf: boolean = true) {
    const { data: options } = await axios.get('/auth/passkeys/register-options');

    // Enable PRF extension to derive a seed-wrapping key
    if (usePrf) {
        options.extensions = {
            ...options.extensions,
            prf: { eval: { first: new Uint8Array(32).fill(1) } }
        };
    }

    const attestationResponse = await startRegistration({ optionsJSON: options });

    // registrationData needs to be flexible to include our custom wrapped seed
    const registrationData: Record<string, unknown> = { ...attestationResponse };

    // If we have a Master Seed and PRF output, wrap the seed
    const extensions = attestationResponse.clientExtensionResults;
    if (masterSeed && usePrf && 'prf' in extensions) {
        const prf = extensions.prf as unknown as PRFExtensionResult;
        const prfResult = prf?.results?.first;
        if (prfResult) {
            const hardwareKey = await deriveKeyFromPrf(prfResult);
            // Encrypt the Master Sseed with the Hardware Key
            const { encryptedData, iv } = await encryptWithKey(masterSeed, hardwareKey);

            registrationData.hardwareWrappedMasterSeed = encryptedData;
            registrationData.hardwareWrappedMasterSeedIv = iv;
        }
    }

    const { data: verification } = await axios.post('/auth/passkeys/verify-registration', registrationData);

    return verification;
}

/**
 * Derives a key from the WebAuthn PRF output.
 */
export async function deriveKeyFromPrf(prfValue: ArrayBuffer): Promise<CryptoKey> {
    return window.crypto.subtle.importKey(
        'raw',
        prfValue,
        { name: ALGORITHM, length: KEY_LENGTH },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Authenticates with a Passkey and retrieves PRF internal secret.
 */
export async function authenticateWithPasskey(usePrf: boolean = true) {
    const { data: options } = await axios.get('/auth/passkeys/auth-options');

    if (usePrf) {
        options.extensions = {
            ...options.extensions,
            prf: { eval: { first: new Uint8Array(32).fill(0) } }
        };
    }

    const assertionResponse = await startAuthentication({ optionsJSON: options });
    const { data: verification } = await axios.post('/auth/passkeys/verify-auth', assertionResponse);

    let prfKey: CryptoKey | null = null;
    const extensions = assertionResponse.clientExtensionResults;
    if (usePrf && 'prf' in extensions) {
        const prf = extensions.prf as unknown as PRFExtensionResult;
        const prfResult = prf?.results?.first;
        if (prfResult) {
            prfKey = await deriveKeyFromPrf(prfResult);
        }
    }

    return { verification, prfKey };
}
