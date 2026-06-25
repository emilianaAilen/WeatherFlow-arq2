import { useQuery } from '@tanstack/react-query';
import { alertingStationsApi } from '../api/alertingStations';

export function useWeeklyAverage(stationId: string) {
  return useQuery({
    queryKey: ['stations', 'weekly-average', stationId],
    queryFn: () => alertingStationsApi.getWeeklyAverage(stationId),
    enabled: !!stationId,
  });
}
