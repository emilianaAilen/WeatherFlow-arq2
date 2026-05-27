import { useState } from 'react';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useUsers, useCreateUser, useUpdateUser, useSubscribeUser } from '../../hooks/useUsers';
import type { User } from '../../types';
import UsersTable from './UsersTable';
import UserForm from './UserForm';
import SubscribeDialog from './SubscribeDialog';
import ErrorAlert from '../common/ErrorAlert';
import Notification from '../common/Notification';
import type { CreateUserFormData } from '../../schemas/user.schema';
import type { SubscribeFormData } from '../../schemas/user.schema';

export default function UsersPage() {
  const { data: users, isLoading, error } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const subscribeUser = useSubscribeUser();

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<User | undefined>();
  const [subscribeTarget, setSubscribeTarget] = useState<User | undefined>();
  const [notification, setNotification] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);

  const handleSubmit = (data: CreateUserFormData) => {
    if (editTarget) {
      updateUser.mutate(
        { id: editTarget.id, data },
        {
          onSuccess: () => {
            setNotification({ message: 'User updated successfully', severity: 'success' });
            setFormOpen(false);
            setEditTarget(undefined);
          },
          onError: (err: unknown) => {
            const message = err && typeof err === 'object' && 'message' in err
              ? (err as { message: string }).message
              : 'Failed to update user';
            setNotification({ message, severity: 'error' });
          },
        }
      );
    } else {
      createUser.mutate(data, {
        onSuccess: () => {
          setNotification({ message: 'User created successfully', severity: 'success' });
          setFormOpen(false);
        },
        onError: (err: unknown) => {
          const message = err && typeof err === 'object' && 'message' in err
            ? (err as { message: string }).message
            : 'Failed to create user';
          setNotification({ message, severity: 'error' });
        },
      });
    }
  };

  const handleSubscribe = (data: SubscribeFormData) => {
    if (!subscribeTarget) return;
    subscribeUser.mutate(
      { id: subscribeTarget.id, weatherStationId: data.weatherStationId },
      {
        onSuccess: () => {
          setNotification({ message: 'Subscribed successfully', severity: 'success' });
          setSubscribeTarget(undefined);
        },
        onError: (err: unknown) => {
          const message = err && typeof err === 'object' && 'message' in err
            ? (err as { message: string }).message
            : 'Failed to subscribe';
          setNotification({ message, severity: 'error' });
        },
      }
    );
  };

  return (
    <Box>
      <Box
        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
      >
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Users
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => { setEditTarget(undefined); setFormOpen(true); }}
        >
          Add User
        </Button>
      </Box>

      {isLoading && <CircularProgress />}
      {error && <ErrorAlert error={error} />}
      {users && (
        <UsersTable
          users={users}
          onEdit={(u) => { setEditTarget(u); setFormOpen(true); }}
          onSubscribe={(u) => setSubscribeTarget(u)}
        />
      )}

      <UserForm
        open={formOpen}
        user={editTarget}
        onClose={() => { setFormOpen(false); setEditTarget(undefined); }}
        onSubmit={handleSubmit}
        loading={createUser.isPending || updateUser.isPending}
      />

      <SubscribeDialog
        open={!!subscribeTarget}
        user={subscribeTarget}
        onClose={() => setSubscribeTarget(undefined)}
        onSubmit={handleSubscribe}
        loading={subscribeUser.isPending}
      />

      {notification && (
        <Notification
          open
          message={notification.message}
          severity={notification.severity}
          onClose={() => setNotification(null)}
        />
      )}
    </Box>
  );
}
