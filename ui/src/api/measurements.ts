import { alertingClient as client } from './client';
import type { Measurement, MeasurementFilters } from '../types';

export interface CreateMeasurementPayload {
  temperature: number;
  humidity: number;
  atmosphericPressure: number;
  stationId: string;
}

export interface UpdateMeasurementPayload {
  temperature?: number;
  humidity?: number;
  atmosphericPressure?: number;
}

export const measurementsApi = {
  list: (filters?: MeasurementFilters) => {
    const params: Record<string, string> = {};
    if (filters?.station) params.station = filters.station;
    if (filters?.min_temperature !== undefined)
      params.min_temperature = String(filters.min_temperature);
    if (filters?.max_temperature !== undefined)
      params.max_temperature = String(filters.max_temperature);
    if (filters?.min_humidity !== undefined)
      params.min_humidity = String(filters.min_humidity);
    if (filters?.max_humidity !== undefined)
      params.max_humidity = String(filters.max_humidity);
    if (filters?.min_pressure !== undefined)
      params.min_pressure = String(filters.min_pressure);
    if (filters?.max_pressure !== undefined)
      params.max_pressure = String(filters.max_pressure);
    if (filters?.alert_status !== undefined)
      params.alert_status = String(filters.alert_status);
    return client.get<Measurement[]>('/measurements', { params }).then((r) => r.data);
  },

  getById: (id: string) =>
    client.get<Measurement>(`/measurements/${id}`).then((r) => r.data),

  create: (data: CreateMeasurementPayload) =>
    client.post<Measurement>('/measurements', data).then((r) => r.data),

  update: (id: string, data: UpdateMeasurementPayload) =>
    client.patch<Measurement>(`/measurements/${id}`, data).then((r) => r.data),

  delete: (id: string) => client.delete(`/measurements/${id}`),

  getCurrentByStation: (stationId: string) =>
    client.get<Measurement>(`/measurements/stations/${stationId}/current`).then((r) => r.data),
};
