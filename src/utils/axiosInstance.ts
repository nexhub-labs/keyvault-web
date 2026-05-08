// axiosInstance.ts
import axios from 'axios';
import { supabase } from './supabase';
import { toaster } from '../components/ui/toaster';

const keyvaultServerUrl = import.meta.env.VITE_KEYVAULT_SERVER;

const axiosInstance = axios.create({
  baseURL: keyvaultServerUrl || 'http://localhost:6251',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }

  const deviceId = localStorage.getItem('kv_device_id');
  if (deviceId) {
    config.headers.set('x-device-id', deviceId);
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response Interceptor: Handle Errors (429, 401)
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 429 Rate Limiting
    if (error.response?.status === 429) {
      toaster.create({
        title: "Slow down!",
        description: "You've made too many requests. Please wait a minute.",
        type: "error",
      });
    }

    // Handle 401 Unauthorized (Token Expiry)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const { data, error: refreshError } = await supabase.auth.refreshSession();

      if (!refreshError && data.session) {
        originalRequest.headers.Authorization = `Bearer ${data.session.access_token}`;
        return axiosInstance(originalRequest);
      } else {
        // Refresh failed, kick to login
        await supabase.auth.signOut();
        window.location.href = '/login';
      }
    }

    // Handle Global Network Error (Connection Refused, Timeout, etc.)
    if (!error.response || error.code === 'ERR_NETWORK') {
      window.dispatchEvent(new CustomEvent('keyvault-network-error'));
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
