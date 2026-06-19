import { useEffect } from 'react';
import {
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { stationFormSchema } from '../../schemas/weatherStation.schema';
import type { StationFormData } from '../../schemas/weatherStation.schema';
import type { WeatherStation } from '../../types';
import { useUsers } from '../../hooks/useUsers';

interface Props {
  open: boolean;
  station?: WeatherStation;
  onClose: () => void;
  onSubmit: (data: StationFormData) => void;
  loading?: boolean;
}

export default function WeatherStationForm({ open, station, onClose, onSubmit, loading }: Props) {
  const isEdit = !!station;
  const { data: users, isLoading: usersLoading } = useUsers();
  const {
    register,
    handleSubmit,
    reset,
    control,
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
      receivesExternalData: false,
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
            receivesExternalData: station.receivesExternalData ?? false,
          }
        : { name: '', model: '', ownerId: '', latitude: undefined, longitude: undefined, status: 'Active', receivesExternalData: false }
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
              <Controller
                name="ownerId"
                control={control}
                render={({ field }) => (
                  <TextField
                    select
                    label="Owner"
                    {...field}
                    error={!!errors.ownerId}
                    helperText={errors.ownerId?.message}
                    fullWidth
                    slotProps={{
                      select: { displayEmpty: true },
                      inputLabel: { shrink: true },
                      input: {
                        endAdornment: usersLoading ? <CircularProgress size={18} sx={{ mr: 3 }} /> : null,
                      },
                    }}
                  >
                    {(users ?? []).map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.name} {user.surname}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
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
            <Controller
              name="receivesExternalData"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox checked={!!field.value} onChange={field.onChange} />}
                  label="Receives external data (OWM ingestion)"
                />
              )}
            />
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
