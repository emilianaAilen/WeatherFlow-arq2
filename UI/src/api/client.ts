import axios from 'axios';
import type { ApiError } from '../types';

const baseURL = import.meta.env.VITE_API_BASE_URL;

if (!baseURL) {
  throw new Error('VITE_API_BASE_URL environment variable is not set');
}

const client = axios.create({ baseURL, timeout: 10000 });

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError: ApiError = { message: 'An unexpected error occurred' };

    if (error.response?.data) {
      const data = error.response.data;
      apiError.message = typeof data.message === 'string' ? data.message : apiError.message;
      if (Array.isArray(data.errors)) {
        apiError.errors = data.errors;
      }
    } else if (error.request) {
      apiError.message = 'No response from server. Check your connection.';
    }

    return Promise.reject(apiError);
  }
);

export default client;
