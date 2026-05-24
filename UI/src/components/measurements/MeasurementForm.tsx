import { useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createMeasurementSchema } from '../../schemas/measurement.schema';
import type { CreateMeasurementFormData } from '../../schemas/measurement.schema';
import type { Measurement } from '../../types';

type FormData = CreateMeasurementFormData;

interface Props {
  open: boolean;
  measurement?: Measurement;
  onClose: () => void;
  onSubmit: (data: FormData) => void;
  loading?: boolean;
}

export default function MeasurementForm({ open, measurement, onClose, onSubmit, loading }: Props) {
  const isEdit = !!measurement;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(createMeasurementSchema) as Resolver<FormData>,
    defaultValues: { temperature: undefined, humidity: undefined, atmosphericPressure: undefined, stationId: '' },
  });

  useEffect(() => {
    reset(
      isEdit
        ? {
            temperature: measurement.temperature.value,
            humidity: measurement.humidity.value,
            atmosphericPressure: measurement.atmosphericPressure.value,
          }
        : { temperature: undefined, humidity: undefined, atmosphericPressure: undefined, stationId: '' }
    );
  }, [measurement, open, reset, isEdit]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogTitle>{isEdit ? 'Edit Measurement' : 'Record Measurement'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Temperature (°C)"
              type="number"
              slotProps={{ htmlInput: { step: 'any' } }}
              {...register('temperature')}
              error={!!errors.temperature}
              helperText={errors.temperature?.message}
              fullWidth
            />
            <TextField
              label="Humidity (%)"
              type="number"
              slotProps={{ htmlInput: { step: 'any', min: 0, max: 100 } }}
              {...register('humidity')}
              error={!!errors.humidity}
              helperText={errors.humidity?.message}
              fullWidth
            />
            <TextField
              label="Atmospheric Pressure (hPa)"
              type="number"
              slotProps={{ htmlInput: { step: 'any' } }}
              {...register('atmosphericPressure')}
              error={!!errors.atmosphericPressure}
              helperText={errors.atmosphericPressure?.message}
              fullWidth
            />
            {!isEdit && (
              <TextField
                label="Station ID (UUID)"
                {...register('stationId')}
                error={!!errors.stationId}
                helperText={errors.stationId?.message}
                fullWidth
                placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {isEdit ? 'Save' : 'Record'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
