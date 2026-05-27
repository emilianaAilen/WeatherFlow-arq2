import axios from 'axios';
import type { ApiError } from '../types';

function createClient(baseURL: string) {
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

  return client;
}

const stationManagementURL = import.meta.env.VITE_STATION_MANAGEMENT_URL;
const alertingURL = import.meta.env.VITE_ALERTING_URL;

if (!stationManagementURL) throw new Error('VITE_STATION_MANAGEMENT_URL is not set');
if (!alertingURL) throw new Error('VITE_ALERTING_URL is not set');

export const stationManagementClient = createClient(stationManagementURL);
export const alertingClient = createClient(alertingURL);
