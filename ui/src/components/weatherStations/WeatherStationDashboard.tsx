import { useParams, useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useCurrentMeasurement } from '../../hooks/useCurrentMeasurement';
import { useWeatherStations } from '../../hooks/useWeatherStations';
import { useDailyAverage } from '../../hooks/useDailyAverage';

function formatHour(isoTime: string) {
  return new Date(isoTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

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

  const {
    data: dailyAverage,
    isLoading: dailyLoading,
    error: dailyError,
  } = useDailyAverage(id);

  const isLoading = stationsLoading || measurementLoading || dailyLoading;

  const chartData = dailyAverage?.data.map((point) => ({
    hour: formatHour(point.time),
    temperature: point.temperature,
  }));

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

      {!isLoading && (
        <Grid container spacing={3}>
          {/* Current temperature card */}
          <Grid size={{ xs: 12, md: 4 }}>
            {measurementError ? (
              <Alert severity="error">
                {(measurementError as { message?: string }).message ?? 'Failed to load current measurement.'}
              </Alert>
            ) : measurement ? (
              <Card elevation={3} sx={{ height: '100%' }}>
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
                    <Chip label={measurement.alert.type} color="error" sx={{ mt: 2 }} />
                  )}
                </CardContent>
              </Card>
            ) : (
              <Alert severity="info">No measurements recorded yet for this station.</Alert>
            )}
          </Grid>

          {/* Daily average chart */}
          <Grid size={{ xs: 12, md: 8 }}>
            {dailyError ? (
              <Alert severity="error">
                {(dailyError as { message?: string }).message ?? 'Failed to load daily average.'}
              </Alert>
            ) : dailyAverage && chartData ? (
              <Card elevation={3} sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      Temperature — Last 24 Hours
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Avg&nbsp;
                      <strong>{dailyAverage.averageTemperature.toFixed(1)}°C</strong>
                    </Typography>
                  </Box>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="hour"
                        tick={{ fontSize: 11 }}
                        interval={2}
                      />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        domain={['auto', 'auto']}
                        unit="°"
                      />
                      <Tooltip
                        formatter={(value: number | null) =>
                          value !== null ? [`${value.toFixed(1)}°C`, 'Avg temperature'] : ['No data', '']
                        }
                      />
                      <ReferenceLine
                        y={dailyAverage.averageTemperature}
                        stroke="#1565c0"
                        strokeDasharray="4 2"
                        label={{ value: 'Avg', position: 'insideTopRight', fontSize: 11, fill: '#1565c0' }}
                      />
                      <Bar dataKey="temperature" fill="#42a5f5" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            ) : (
              <Alert severity="info">No daily data available for this station.</Alert>
            )}
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
