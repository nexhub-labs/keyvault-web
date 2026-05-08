import { jest } from '@jest/globals';
import { generateSecurePassword } from './password';
import axiosInstance from './axiosInstance';

describe('generateSecurePassword', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Manually mock the methods since they are imported as plain functions
        jest.spyOn(axiosInstance, 'post');
    });

    const mockedAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;

    it('successfully generates a password after backend authorization', async () => {
        mockedAxios.post.mockResolvedValueOnce({ data: { authorized: true } });

        const options = {
            length: 12,
            includeUppercase: true,
            includeLowercase: true,
            includeDigits: true,
            includeSymbols: true,
        };

        const password = await generateSecurePassword(options);

        expect(mockedAxios.post).toHaveBeenCalledWith('/keyvault/authorize-generation', options);
        expect(password).toHaveLength(12);
        expect(typeof password).toBe('string');
    });

    it('throws error if backend denies authorization', async () => {
        mockedAxios.post.mockResolvedValueOnce({ data: { authorized: false } });

        const options = {
            length: 12,
            includeUppercase: true,
            includeLowercase: true,
            includeDigits: true,
            includeSymbols: true,
        };

        await expect(generateSecurePassword(options)).rejects.toThrow('Server denied password generation parameters.');
    });

    it('throws error if no character sets are selected', async () => {
        mockedAxios.post.mockResolvedValueOnce({ data: { authorized: true } });

        const options = {
            length: 12,
            includeUppercase: false,
            includeLowercase: false,
            includeDigits: false,
            includeSymbols: false,
        };

        await expect(generateSecurePassword(options)).rejects.toThrow('At least one character set must be selected.');
    });
});
