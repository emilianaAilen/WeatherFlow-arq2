import { stationManagementClient as client } from './client';
import type { WeatherStation } from '../types';

export interface CreateStationPayload {
  name: string;
  location: { latitude: number; longitude: number };
  model: string;
  ownerId: string;
}

export interface UpdateStationPayload {
  name?: string;
  location?: { latitude: number; longitude: number };
  model?: string;
  status?: 'Active' | 'Inactive';
}

export const weatherStationsApi = {
  list: () => client.get<WeatherStation[]>('/weatherStations').then((r) => r.data),

  searchByName: (name: string) =>
    client
      .get<WeatherStation>('/weatherStations/search', { params: { name } })
      .then((r) => r.data)
      .catch((err) => {
        if (err?.message === 'Weather station not found') return null;
        return Promise.reject(err);
      }),

  getById: (id: string) =>
    client.get<WeatherStation>(`/weatherStations/${id}`).then((r) => r.data),

  create: (data: CreateStationPayload) =>
    client.post<WeatherStation>('/weatherStations', data).then((r) => r.data),

  update: (id: string, data: UpdateStationPayload) =>
    client.patch<WeatherStation>(`/weatherStations/${id}`, data).then((r) => r.data),

  delete: (id: string) => client.delete(`/weatherStations/${id}`),
};
