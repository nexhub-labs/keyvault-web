/**
 * Jest Test Setup
 * Configures the testing environment with necessary polyfills and mocks.
 */
import '@testing-library/jest-dom';
import { TextDecoder } from 'util';

// Polyfill TextEncoder/TextDecoder for Node.js
Object.defineProperty(global, 'TextDecoder', {
    value: TextDecoder,
    writable: true,
});

// Simple crypto mock without using jest.fn() (which causes issues in ESM setup)
const cryptoMock = {
    getRandomValues: (arr: Uint8Array) => {
        for (let i = 0; i < arr.length; i++) {
            arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
    },
    subtle: {
        importKey: () => Promise.resolve({} as CryptoKey),
        deriveKey: () => Promise.resolve({} as CryptoKey),
        deriveBits: () => Promise.resolve(new ArrayBuffer(32)),
        encrypt: () => Promise.resolve(new ArrayBuffer(32)),
        decrypt: () => Promise.resolve(new ArrayBuffer(32)),
        digest: () => Promise.resolve(new ArrayBuffer(32)),
        exportKey: () => Promise.resolve(new ArrayBuffer(32)),
    },
    randomUUID: () => 'test-uuid-1234-5678-9012',
};

Object.defineProperty(global, 'crypto', {
    value: cryptoMock,
    writable: true,
});

// Mock window.crypto for browser-like environment
Object.defineProperty(window, 'crypto', {
    value: cryptoMock,
    writable: true,
});

// Mock import.meta.env for Vite
// Note: This requires the test environment to support ES Modules or a transformer that handles import.meta
interface GlobalWithImportMeta extends Global {
    importMeta: {
        env: {
            VITE_KEYVAULT_SERVER: string;
            VITE_SUPABASE_URL: string;
            VITE_SUPABASE_ANON_KEY: string;
        };
    };
}

(global as unknown as GlobalWithImportMeta).importMeta = {
    env: {
        VITE_KEYVAULT_SERVER: 'http://localhost:6251',
        VITE_SUPABASE_URL: 'https://test.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'test-anon-key',
    }
};
