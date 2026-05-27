import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { subscribeSchema } from '../../schemas/user.schema';
import type { SubscribeFormData } from '../../schemas/user.schema';
import type { User } from '../../types';
import { useWeatherStations } from '../../hooks/useWeatherStations';

interface Props {
  open: boolean;
  user?: User;
  onClose: () => void;
  onSubmit: (data: SubscribeFormData) => void;
  loading?: boolean;
}

export default function SubscribeDialog({ open, user, onClose, onSubmit, loading }: Props) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SubscribeFormData>({
    resolver: zodResolver(subscribeSchema),
    defaultValues: { weatherStationId: '' },
  });

  const { data: stations = [] } = useWeatherStations();

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogTitle>Subscribe to Weather Station</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Subscribing user: <strong>{user?.name} {user?.surname}</strong>
          </Typography>
          <FormControl fullWidth error={!!errors.weatherStationId}>
            <InputLabel id="station-select-label">Weather Station</InputLabel>
            <Controller
              name="weatherStationId"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  labelId="station-select-label"
                  label="Weather Station"
                >
                  {stations.map((station) => (
                    <MenuItem key={station.id} value={station.id}>
                      {station.name}
                    </MenuItem>
                  ))}
                </Select>
              )}
            />
            {errors.weatherStationId && (
              <FormHelperText>{errors.weatherStationId.message}</FormHelperText>
            )}
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            Subscribe
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
