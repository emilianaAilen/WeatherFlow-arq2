import { useParams, useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import { useCurrentMeasurement } from '../../hooks/useCurrentMeasurement';
import { useWeatherStations } from '../../hooks/useWeatherStations';

export default function WeatherStationDashboard() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: stations, isLoading: stationsLoading } = useWeatherStations();
  const station = stations?.find((s) => s.id === id);

  const {
    data: measurement,
    isLoading: measurementLoading,
    error: measurementError,
  } = useCurrentMeasurement(id);

  const isLoading = stationsLoading || measurementLoading;

  return (
    <Box sx={{ p: 3 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/weather-stations')}
        sx={{ mb: 3 }}
      >
        Back to Stations
      </Button>

      <Typography variant="h5" fontWeight={600} gutterBottom>
        {station?.name ?? 'Weather Station'}
      </Typography>

      {station && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {station.location.latitude}, {station.location.longitude} · {station.sensorModel}
        </Typography>
      )}

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {!isLoading && measurementError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {(measurementError as { message?: string }).message ?? 'Failed to load current measurement.'}
        </Alert>
      )}

      {!isLoading && !measurementError && measurement && (
        <Card elevation={3} sx={{ mt: 1 }}>
          <CardContent sx={{ textAlign: 'center', py: 5 }}>
            <ThermostatIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography variant="overline" color="text.secondary" display="block">
              Current Temperature
            </Typography>
            <Typography variant="h2" fontWeight={700} color="primary.main">
              {measurement.temperature.value}°C
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {new Date(measurement.dateTime).toLocaleString()}
            </Typography>
            {measurement.alert.status && (
              <Chip
                label={measurement.alert.type}
                color="error"
                sx={{ mt: 2 }}
              />
            )}
          </CardContent>
        </Card>
      )}

      {!isLoading && !measurementError && !measurement && (
        <Alert severity="info" sx={{ mt: 2 }}>
          No measurements recorded yet for this station.
        </Alert>
      )}
    </Box>
  );
}
