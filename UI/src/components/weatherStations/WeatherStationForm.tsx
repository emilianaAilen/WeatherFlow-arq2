import { useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { stationFormSchema } from '../../schemas/weatherStation.schema';
import type { StationFormData } from '../../schemas/weatherStation.schema';
import type { WeatherStation } from '../../types';

interface Props {
  open: boolean;
  station?: WeatherStation;
  onClose: () => void;
  onSubmit: (data: StationFormData) => void;
  loading?: boolean;
}

export default function WeatherStationForm({ open, station, onClose, onSubmit, loading }: Props) {
  const isEdit = !!station;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StationFormData>({
    resolver: zodResolver(stationFormSchema) as Resolver<StationFormData>,
    defaultValues: {
      name: '',
      model: '',
      ownerId: '',
      latitude: undefined,
      longitude: undefined,
      status: 'Active',
    },
  });

  useEffect(() => {
    reset(
      isEdit
        ? {
            name: station.name,
            model: station.sensorModel,
            status: station.status,
            latitude: station.location.latitude,
            longitude: station.location.longitude,
            ownerId: station.ownerId,
          }
        : { name: '', model: '', ownerId: '', latitude: undefined, longitude: undefined, status: 'Active' }
    );
  }, [station, open, reset, isEdit]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogTitle>{isEdit ? 'Edit Weather Station' : 'Create Weather Station'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Station Name"
              {...register('name')}
              error={!!errors.name}
              helperText={errors.name?.message}
              fullWidth
            />
            <TextField
              label="Sensor Model"
              {...register('model')}
              error={!!errors.model}
              helperText={errors.model?.message}
              fullWidth
            />
            {!isEdit && (
              <TextField
                label="Owner ID (UUID)"
                {...register('ownerId')}
                error={!!errors.ownerId}
                helperText={errors.ownerId?.message}
                fullWidth
                placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
              />
            )}
            <TextField
              label="Latitude"
              type="number"
              slotProps={{ htmlInput: { step: 'any' } }}
              {...register('latitude')}
              error={!!errors.latitude}
              helperText={errors.latitude?.message ?? 'Range: -90 to 90'}
              fullWidth
            />
            <TextField
              label="Longitude"
              type="number"
              slotProps={{ htmlInput: { step: 'any' } }}
              {...register('longitude')}
              error={!!errors.longitude}
              helperText={errors.longitude?.message ?? 'Range: -180 to 180'}
              fullWidth
            />
            <TextField
              select
              label="Status"
              defaultValue="Active"
              {...register('status')}
              error={!!errors.status}
              helperText={errors.status?.message}
              fullWidth
            >
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {isEdit ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
