import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { weatherStationsApi } from '../api/weatherStations';
import type { CreateStationPayload, UpdateStationPayload } from '../api/weatherStations';

const STATIONS_KEY = ['weatherStations'];

export const useWeatherStations = () =>
  useQuery({ queryKey: STATIONS_KEY, queryFn: weatherStationsApi.list });

export const useCreateStation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateStationPayload) => weatherStationsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: STATIONS_KEY }),
  });
};

export const useUpdateStation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStationPayload }) =>
      weatherStationsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: STATIONS_KEY }),
  });
};

export const useDeleteStation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => weatherStationsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: STATIONS_KEY }),
  });
};
