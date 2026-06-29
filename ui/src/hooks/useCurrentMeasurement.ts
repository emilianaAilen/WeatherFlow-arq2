import { useQuery } from '@tanstack/react-query';
import { measurementsApi } from '../api/measurements';

export function useCurrentMeasurement(stationId: string) {
  return useQuery({
    queryKey: ['measurements', 'current', stationId],
    queryFn: () => measurementsApi.getCurrentByStation(stationId),
    enabled: !!stationId,
  });
}
