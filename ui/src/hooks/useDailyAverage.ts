import { useQuery } from '@tanstack/react-query';
import { measurementsApi } from '../api/measurements';

export function useDailyAverage(stationId: string) {
  return useQuery({
    queryKey: ['measurements', 'daily-average', stationId],
    queryFn: () => measurementsApi.getDailyAverageByStation(stationId),
    enabled: !!stationId,
  });
}
