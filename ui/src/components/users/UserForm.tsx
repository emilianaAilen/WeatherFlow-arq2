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
import { zodResolver } from '@hookform/resolvers/zod';
import { createUserSchema } from '../../schemas/user.schema';
import type { CreateUserFormData } from '../../schemas/user.schema';
import type { User } from '../../types';

interface Props {
  open: boolean;
  user?: User;
  onClose: () => void;
  onSubmit: (data: CreateUserFormData) => void;
  loading?: boolean;
}

export default function UserForm({ open, user, onClose, onSubmit, loading }: Props) {
  const isEdit = !!user;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { name: '', surname: '', email: '' },
  });

  useEffect(() => {
    reset(isEdit ? { name: user.name, surname: user.surname, email: user.email } : {});
  }, [user, open, reset, isEdit]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogTitle>{isEdit ? 'Edit User' : 'Create User'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Name"
              {...register('name')}
              error={!!errors.name}
              helperText={errors.name?.message}
              fullWidth
            />
            <TextField
              label="Surname"
              {...register('surname')}
              error={!!errors.surname}
              helperText={errors.surname?.message}
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
              fullWidth
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
