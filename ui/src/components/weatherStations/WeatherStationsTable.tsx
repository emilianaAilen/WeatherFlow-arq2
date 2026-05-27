import { useState } from 'react';
import {
  Chip,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import type { WeatherStation } from '../../types';
import ConfirmDialog from '../common/ConfirmDialog';
import Notification from '../common/Notification';
import { useDeleteStation } from '../../hooks/useWeatherStations';

interface Props {
  stations: WeatherStation[];
  onEdit: (station: WeatherStation) => void;
}

export default function WeatherStationsTable({ stations, onEdit }: Props) {
  const [deleteTarget, setDeleteTarget] = useState<WeatherStation | null>(null);
  const [notification, setNotification] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);
  const deleteStation = useDeleteStation();

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteStation.mutate(deleteTarget.id, {
      onSuccess: () => {
        setNotification({ message: 'Station deleted successfully', severity: 'success' });
        setDeleteTarget(null);
      },
      onError: (err: unknown) => {
        const message = err && typeof err === 'object' && 'message' in err
          ? (err as { message: string }).message
          : 'Failed to delete station';
        setNotification({ message, severity: 'error' });
        setDeleteTarget(null);
      },
    });
  };

  return (
    <>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Sensor Model</TableCell>
              <TableCell>Latitude</TableCell>
              <TableCell>Longitude</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Owner ID</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stations.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    No weather stations found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {stations.map((station) => (
              <TableRow key={station.id} hover>
                <TableCell>{station.name}</TableCell>
                <TableCell>{station.sensorModel}</TableCell>
                <TableCell>{station.location.latitude}</TableCell>
                <TableCell>{station.location.longitude}</TableCell>
                <TableCell>
                  <Chip
                    label={station.status}
                    color={station.status === 'Active' ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell sx={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <Tooltip title={station.ownerId}>
                    <span>{station.ownerId.slice(0, 8)}…</span>
                  </Tooltip>
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => onEdit(station)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => setDeleteTarget(station)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Station"
        message={`Are you sure you want to delete station "${deleteTarget?.name}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteStation.isPending}
      />

      {notification && (
        <Notification
          open
          message={notification.message}
          severity={notification.severity}
          onClose={() => setNotification(null)}
        />
      )}
    </>
  );
}
