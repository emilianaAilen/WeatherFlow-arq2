import {
  Box,
  Button,
  MenuItem,
  Paper,
  Stack,
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
  const [alertStatus, setAlertStatus] = useState('');

  const handleApply = () => {
    const filters: Filters = {};
    if (station.trim()) filters.station = station.trim();
    if (minTemp !== '') filters.min_temperature = Number(minTemp);
    if (maxTemp !== '') filters.max_temperature = Number(maxTemp);
    if (alertStatus !== '') filters.alert_status = alertStatus === 'true';
    onFilter(filters);
  };

  const handleReset = () => {
    setStation('');
    setMinTemp('');
    setMaxTemp('');
    setAlertStatus('');
    onReset();
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
        Filters
      </Typography>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ alignItems: 'flex-end' }}
      >
        <TextField
          label="Station Name"
          value={station}
          onChange={(e) => setStation(e.target.value)}
          size="small"
        />
        <TextField
          label="Min Temperature (°C)"
          type="number"
          value={minTemp}
          onChange={(e) => setMinTemp(e.target.value)}
          size="small"
          sx={{ width: 160 }}
        />
        <TextField
          label="Max Temperature (°C)"
          type="number"
          value={maxTemp}
          onChange={(e) => setMaxTemp(e.target.value)}
          size="small"
          sx={{ width: 160 }}
        />
        <TextField
          select
          label="Alert Status"
          value={alertStatus}
          onChange={(e) => setAlertStatus(e.target.value)}
          size="small"
          sx={{ width: 130 }}
        >
          <MenuItem value="">Any</MenuItem>
          <MenuItem value="true">Active</MenuItem>
          <MenuItem value="false">Inactive</MenuItem>
        </TextField>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="contained" size="small" onClick={handleApply}>
            Apply
          </Button>
          <Button variant="outlined" size="small" onClick={handleReset}>
            Reset
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
}
