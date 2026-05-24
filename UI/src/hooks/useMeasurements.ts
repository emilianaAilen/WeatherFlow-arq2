import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { measurementsApi } from '../api/measurements';
import type { CreateMeasurementPayload, UpdateMeasurementPayload } from '../api/measurements';
import type { MeasurementFilters } from '../types';

const MEASUREMENTS_KEY = 'measurements';

export const useMeasurements = (filters?: MeasurementFilters) =>
  useQuery({
    queryKey: [MEASUREMENTS_KEY, filters],
    queryFn: () => measurementsApi.list(filters),
  });

export const useCreateMeasurement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMeasurementPayload) => measurementsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [MEASUREMENTS_KEY] }),
  });
};

export const useUpdateMeasurement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMeasurementPayload }) =>
      measurementsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [MEASUREMENTS_KEY] }),
  });
};

export const useDeleteMeasurement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => measurementsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [MEASUREMENTS_KEY] }),
  });
};
