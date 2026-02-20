/**
 * Jest Test Setup
 * Configures the testing environment with necessary polyfills and mocks.
 */
import '@testing-library/jest-dom';
import { TextDecoder } from 'util';

// Polyfill TextEncoder/TextDecoder for Node.js
(global as any).TextDecoder = TextDecoder;

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
