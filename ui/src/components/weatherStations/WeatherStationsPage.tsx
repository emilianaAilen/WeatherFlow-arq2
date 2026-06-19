import { useState } from 'react';
import { Box, Button, CircularProgress, InputAdornment, TextField, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import {
  useWeatherStations,
  useSearchStation,
  useCreateStation,
  useUpdateStation,
} from '../../hooks/useWeatherStations';
import type { WeatherStation } from '../../types';
import WeatherStationsTable from './WeatherStationsTable';
import WeatherStationForm from './WeatherStationForm';
import ErrorAlert from '../common/ErrorAlert';
import Notification from '../common/Notification';
import type { StationFormData } from '../../schemas/weatherStation.schema';

export default function WeatherStationsPage() {
  const { data: stations, isLoading, error } = useWeatherStations();
  const createStation = useCreateStation();
  const updateStation = useUpdateStation();

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<WeatherStation | undefined>();
  const [notification, setNotification] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const isSearching = searchQuery.trim().length > 0;
  const { data: searchResult, isFetching: searchFetching, error: searchError } = useSearchStation(searchQuery);
  const displayedStations = isSearching ? (searchResult ? [searchResult] : []) : (stations ?? []);

  const handleSubmit = (data: StationFormData) => {
    const { latitude, longitude, name, model, status, ownerId, receivesExternalData } = data;

    if (editTarget) {
      updateStation.mutate(
        {
          id: editTarget.id,
          data: {
            name,
            model,
            status,
            location: { latitude, longitude },
            receivesExternalData,
          },
        },
        {
          onSuccess: () => {
            setNotification({ message: 'Station updated successfully', severity: 'success' });
            setFormOpen(false);
            setEditTarget(undefined);
          },
          onError: (err: unknown) => {
            const message =
              err && typeof err === 'object' && 'message' in err
                ? (err as { message: string }).message
                : 'Failed to update station';
            setNotification({ message, severity: 'error' });
          },
        }
      );
    } else {
      createStation.mutate(
        { name, model, ownerId: ownerId ?? '', location: { latitude, longitude }, receivesExternalData },
        {
          onSuccess: () => {
            setNotification({ message: 'Station created successfully', severity: 'success' });
            setFormOpen(false);
          },
          onError: (err: unknown) => {
            const message =
              err && typeof err === 'object' && 'message' in err
                ? (err as { message: string }).message
                : 'Failed to create station';
            setNotification({ message, severity: 'error' });
          },
        }
      );
    }
  };

  return (
    <Box>
      <Box
        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
      >
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Weather Stations
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => { setEditTarget(undefined); setFormOpen(true); }}
        >
          Add Station
        </Button>
      </Box>

      <TextField
        placeholder="Search by name…"
        size="small"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ mb: 2, width: 300 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
      />

      {(isLoading || searchFetching) && <CircularProgress />}
      {!isSearching && error && <ErrorAlert error={error} />}
      <WeatherStationsTable
        stations={displayedStations}
        onEdit={(s) => { setEditTarget(s); setFormOpen(true); }}
      />

      <WeatherStationForm
        open={formOpen}
        station={editTarget}
        onClose={() => { setFormOpen(false); setEditTarget(undefined); }}
        onSubmit={(data) => handleSubmit(data as StationFormData)}
        loading={createStation.isPending || updateStation.isPending}
      />

      {notification && (
        <Notification
          open
          message={notification.message}
          severity={notification.severity}
          onClose={() => setNotification(null)}
        />
      )}
    </Box>
  );
}
