import {
  Box,
  Button,
  Grid,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import type { MeasurementFilters as Filters } from '../../types';

interface Props {
  onFilter: (filters: Filters) => void;
  onReset: () => void;
}

export default function MeasurementFilters({ onFilter, onReset }: Props) {
  const [station, setStation] = useState('');
  const [minTemp, setMinTemp] = useState('');
  const [maxTemp, setMaxTemp] = useState('');
  const [minHumidity, setMinHumidity] = useState('');
  const [maxHumidity, setMaxHumidity] = useState('');
  const [minPressure, setMinPressure] = useState('');
  const [maxPressure, setMaxPressure] = useState('');
  const [alertStatus, setAlertStatus] = useState('');

  const handleApply = () => {
    const filters: Filters = {};
    if (station.trim()) filters.station = station.trim();
    if (minTemp !== '') filters.min_temperature = Number(minTemp);
    if (maxTemp !== '') filters.max_temperature = Number(maxTemp);
    if (minHumidity !== '') filters.min_humidity = Number(minHumidity);
    if (maxHumidity !== '') filters.max_humidity = Number(maxHumidity);
    if (minPressure !== '') filters.min_pressure = Number(minPressure);
    if (maxPressure !== '') filters.max_pressure = Number(maxPressure);
    if (alertStatus !== '') filters.alert_status = alertStatus === 'true';
    onFilter(filters);
  };

  const handleReset = () => {
    setStation('');
    setMinTemp('');
    setMaxTemp('');
    setMinHumidity('');
    setMaxHumidity('');
    setMinPressure('');
    setMaxPressure('');
    setAlertStatus('');
    onReset();
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 'bold' }}>
        Filters
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField
            label="Station Name"
            value={station}
            onChange={(e) => setStation(e.target.value)}
            size="small"
            fullWidth
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3, md: 2 }}>
          <TextField
            label="Min Temp (°C)"
            type="number"
            value={minTemp}
            onChange={(e) => setMinTemp(e.target.value)}
            size="small"
            fullWidth
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3, md: 2 }}>
          <TextField
            label="Max Temp (°C)"
            type="number"
            value={maxTemp}
            onChange={(e) => setMaxTemp(e.target.value)}
            size="small"
            fullWidth
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3, md: 2 }}>
          <TextField
            label="Min Humidity (%)"
            type="number"
            value={minHumidity}
            onChange={(e) => setMinHumidity(e.target.value)}
            size="small"
            fullWidth
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3, md: 2 }}>
          <TextField
            label="Max Humidity (%)"
            type="number"
            value={maxHumidity}
            onChange={(e) => setMaxHumidity(e.target.value)}
            size="small"
            fullWidth
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3, md: 2 }}>
          <TextField
            label="Min Pressure (hPa)"
            type="number"
            value={minPressure}
            onChange={(e) => setMinPressure(e.target.value)}
            size="small"
            fullWidth
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3, md: 2 }}>
          <TextField
            label="Max Pressure (hPa)"
            type="number"
            value={maxPressure}
            onChange={(e) => setMaxPressure(e.target.value)}
            size="small"
            fullWidth
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 3, md: 2 }}>
          <TextField
            select
            label="Alert Status"
            value={alertStatus}
            onChange={(e) => setAlertStatus(e.target.value)}
            size="small"
            fullWidth
          >
            <MenuItem value="">Any</MenuItem>
            <MenuItem value="true">Active</MenuItem>
            <MenuItem value="false">Inactive</MenuItem>
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 'auto' }} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button variant="contained" size="small" onClick={handleApply}>
            Apply
          </Button>
          <Button variant="outlined" size="small" onClick={handleReset}>
            Reset
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
}
