import { alertingClient as client } from './client';
import type { WeeklyAverageResult } from '../types';

export const alertingStationsApi = {
  getWeeklyAverage: (stationId: string) =>
    client.get<WeeklyAverageResult>(`/stations/${stationId}/temperature/average/week`).then((r) => r.data),
};
