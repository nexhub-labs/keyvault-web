/**
 * MSW Request Handlers
 * Mock API responses matching the real backend endpoints.
 */
import { http, HttpResponse } from 'msw';

const baseUrl = 'http://localhost:6251';

export const handlers = [
    // ===== Vault Endpoints =====

    // GET /keyvault - Welcome endpoint
    http.get(`${baseUrl}/keyvault`, () => {
        return HttpResponse.json({
            message: 'Welcome to KeyVault, a subsidiary of Nexhub Labs. This is the password generator API.',
        });
    }),

    // POST /keyvault/generate - Generate password
    http.post(`${baseUrl}/keyvault/generate`, async ({ request }) => {
        const body = await request.json() as {
            includeUppercase: boolean;
            includeLowercase: boolean;
            includeDigits: boolean;
            includeSymbols: boolean;
            length: number;
        };
        const length = body.length || 16;

        // Generate a mock password based on options
        let chars = '';
        if (body.includeUppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (body.includeLowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
        if (body.includeDigits) chars += '0123456789';
        if (body.includeSymbols) chars += '!@#$%^&*';

        if (!chars) chars = 'abcdefghijklmnopqrstuvwxyz'; // Fallback

        let password = '';
        for (let i = 0; i < length; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        return HttpResponse.json({ password });
    }),

    // POST /keyvault/store - Store encrypted password
    http.post(`${baseUrl}/keyvault/store`, async ({ request }) => {
        const body = await request.json() as { keyName: string };
        return HttpResponse.json({
            message: `Secure blob for ${body.keyName} stored successfully`,
        });
    }),

    // POST /keyvault/retrieve - Retrieve encrypted password
    http.post(`${baseUrl}/keyvault/retrieve`, async () => {
        // Return mock encrypted data
        return HttpResponse.json({
            encryptedData: 'bW9ja0VuY3J5cHRlZERhdGE=', // base64 "mockEncryptedData"
            iv: 'bW9ja0lW', // base64 "mockIV"
            algorithm: 'aes-256-gcm',
        });
    }),

    // POST /keyvault/viewDB - View all vault items
    http.post(`${baseUrl}/keyvault/viewDB`, () => {
        return HttpResponse.json([
            {
                _id: '1',
                keyName: 'test_gmail_account',
                encryptedData: 'c3VwZXJTZWN1cmVFbmNyeXB0ZWRCbG9i',
                iv: 'aW5pdGlhbGl6YXRpb25WZWN0b3I=',
                algorithm: 'aes-256-gcm',
                userId: 'test-user-id',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
            {
                _id: '2',
                keyName: 'test_github_account',
                encryptedData: 'YW5vdGhlckVuY3J5cHRlZEJsb2I=',
                iv: 'c29tZU90aGVySVY=',
                algorithm: 'aes-256-gcm',
                userId: 'test-user-id',
                createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(), // 100 days ago
                updatedAt: new Date().toISOString(),
            },
        ]);
    }),

    // ===== Auth Endpoints =====

    // GET /auth/master-status - Get master password status
    http.get(`${baseUrl}/auth/master-status`, () => {
        return HttpResponse.json({
            hasMasterSetup: true,
            masterPasswordIsCustom: true,
            masterPasswordSalt: 'dGVzdFNhbHQ=', // base64 "testSalt"
        });
    }),

    // POST /auth/verify-master - Verify master password
    http.post(`${baseUrl}/auth/verify-master`, () => {
        return HttpResponse.json({
            valid: true,
            wrappedMasterSeed: 'd3JhcHBlZE1hc3RlclNlZWQ=',
            wrappedMasterSeedIv: 'd3JhcHBlZElW',
            vaultSalt: 'dmF1bHRTYWx0',
            masterPasswordSalt: 'bWFzdGVyU2FsdA==',
        });
    }),

    // POST /auth/setup-master - Setup master password
    http.post(`${baseUrl}/auth/setup-master`, () => {
        return HttpResponse.json({
            message: 'Master password setup successfully',
        });
    }),

    // POST /auth/setup-contacts - Setup trusted contacts
    http.post(`${baseUrl}/auth/setup-contacts`, () => {
        return HttpResponse.json({
            message: 'Trusted contacts setup successfully',
        });
    }),

    // GET /auth/contacts - Get trusted contacts
    http.get(`${baseUrl}/auth/contacts`, () => {
        return HttpResponse.json({
            contacts: [
                { email: 'contact1@example.com', shardIndex: 0, status: 'complete' },
                { email: 'contact2@example.com', shardIndex: 1, status: 'complete' },
                { email: 'contact3@example.com', shardIndex: 2, status: 'pending' },
            ],
        });
    }),

    // POST /auth/recover/otp - Request recovery OTP
    http.post(`${baseUrl}/auth/recover/otp`, () => {
        return HttpResponse.json({
            message: 'OTP sent successfully',
            expiresIn: 300,
        });
    }),

    // POST /auth/recover/verify-otp - Verify recovery OTP
    http.post(`${baseUrl}/auth/recover/verify-otp`, () => {
        return HttpResponse.json({
            salt: 'cmVjb3ZlcnlTYWx0',
            masterPasswordSalt: 'bWFzdGVyUGFzc3dvcmRTYWx0',
            vaultSalt: 'dmF1bHRTYWx0',
        });
    }),

    // POST /auth/recover/request - Initiate trusted recovery
    http.post(`${baseUrl}/auth/recover/request`, () => {
        return HttpResponse.json({
            message: 'Recovery request initiated',
            requestId: 'recovery-request-123',
        });
    }),

    // GET /auth/recover/status - Check recovery status
    http.get(`${baseUrl}/auth/recover/status`, () => {
        return HttpResponse.json({
            status: 'pending',
            approvedCount: 1,
            requiredCount: 2,
        });
    }),

    // POST /auth/supabase-recover-password - Supabase password recovery
    http.post(`${baseUrl}/auth/supabase-recover-password`, () => {
        return HttpResponse.json({
            message: 'Password recovery email sent',
            success: true,
        });
    }),
];
