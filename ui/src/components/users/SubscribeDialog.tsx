import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { subscribeSchema } from '../../schemas/user.schema';
import type { SubscribeFormData } from '../../schemas/user.schema';
import type { User } from '../../types';

interface Props {
  open: boolean;
  user?: User;
  onClose: () => void;
  onSubmit: (data: SubscribeFormData) => void;
  loading?: boolean;
}

export default function SubscribeDialog({ open, user, onClose, onSubmit, loading }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SubscribeFormData>({
    resolver: zodResolver(subscribeSchema),
    defaultValues: { weatherStationId: '' },
  });

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
          <TextField
            label="Weather Station ID (UUID)"
            {...register('weatherStationId')}
            error={!!errors.weatherStationId}
            helperText={errors.weatherStationId?.message}
            fullWidth
            placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
          />
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
