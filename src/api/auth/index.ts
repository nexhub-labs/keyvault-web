import axios, { AxiosError } from 'axios';
import axiosInstance from '../../utils/axiosInstance';
import { keyvaultServerUrl, serverApiKey } from '..';

interface LocalRegisterData {
  name?: string;
  email: string;
  password: string;
}

interface LocalLoginData {
  email: string;
  password: string;
}

/**
 * Registers a new user.
 */
async function localRegister(data: LocalRegisterData) {
  const jsonData = JSON.stringify({
    name: data.name,
    email: data.email,
    password: data.password,
  });

  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: `${keyvaultServerUrl}/users/register`,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': serverApiKey,
    },
    data: jsonData,
  };

  try {
    const response = await axios.request(config);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        console.error('Error during local registration:', axiosError.response.data);
        const errorMessage = (axiosError.response.data as { message: string }).message || 'An error occurred';
        throw new Error(errorMessage);
      } else if (axiosError.request) {
        console.error('No response received:', axiosError.request);
        throw new Error('No response received from the server');
      } else {
        console.error('Error setting up the request:', axiosError.message);
        throw new Error(axiosError.message);
      }
    } else {
      console.error('Unexpected error:', error);
      throw new Error('An unexpected error occurred');
    }
  }
}

/**
 * Logs in a user. With HTTP‑only cookies, the server sets the token cookie automatically.
 * You only need to ensure that your axios instance sends credentials on every request.
 */
async function localLogin(data: LocalLoginData) {
  const jsonData = JSON.stringify({
    email: data.email,
    password: data.password,
  });

  try {
    const response = await axiosInstance.post(`${keyvaultServerUrl}/auth/login`, jsonData);

    // With HTTP‑only cookies, you don't extract the token on the client side.
    // The server sets the cookie, and it is sent automatically with future requests.
    // console.log('Login response:', response.data);
    return {
      email: data.email,
      statusCode: response.data.statusCode,
      message: response.data.message,
      expiresIn: response.data.expiresIn,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        console.error('Error during local login:', axiosError.response.data);
        const errorMessage = (axiosError.response.data as { message: string }).message || 'An error occurred';
        throw new Error(errorMessage);
      } else if (axiosError.request) {
        console.error('No response received:', axiosError.request);
        throw new Error('No response received from the server');
      } else {
        console.error('Error setting up the request:', axiosError.message);
        throw new Error(axiosError.message);
      }
    } else {
      console.error('Unexpected error:', error);
      throw new Error('An unexpected error occurred');
    }
  }
}

export { localRegister, localLogin };
