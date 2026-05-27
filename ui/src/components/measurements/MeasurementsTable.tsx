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
import type { Measurement } from '../../types';
import ConfirmDialog from '../common/ConfirmDialog';
import Notification from '../common/Notification';
import { useDeleteMeasurement } from '../../hooks/useMeasurements';
import { alertColor, formatDateTime } from '../../utils/formatters';

interface Props {
  measurements: Measurement[];
  onEdit: (m: Measurement) => void;
}

export default function MeasurementsTable({ measurements, onEdit }: Props) {
  const [deleteTarget, setDeleteTarget] = useState<Measurement | null>(null);
  const [notification, setNotification] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);
  const deleteMeasurement = useDeleteMeasurement();

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMeasurement.mutate(deleteTarget.id, {
      onSuccess: () => {
        setNotification({ message: 'Measurement deleted', severity: 'success' });
        setDeleteTarget(null);
      },
      onError: (err: unknown) => {
        const message = err && typeof err === 'object' && 'message' in err
          ? (err as { message: string }).message
          : 'Failed to delete measurement';
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
              <TableCell>Date/Time</TableCell>
              <TableCell>Temp (°C)</TableCell>
              <TableCell>Humidity (%)</TableCell>
              <TableCell>Pressure (hPa)</TableCell>
              <TableCell>Alert</TableCell>
              <TableCell>Station ID</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {measurements.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    No measurements found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {measurements.map((m) => (
              <TableRow key={m.id} hover>
                <TableCell>{formatDateTime(m.dateTime)}</TableCell>
                <TableCell>{m.temperature.value}</TableCell>
                <TableCell>{m.humidity.value}</TableCell>
                <TableCell>{m.atmosphericPressure.value}</TableCell>
                <TableCell>
                  <Chip
                    label={m.alert.type}
                    color={alertColor(m.alert.type)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Tooltip title={m.stationId}>
                    <span>{m.stationId.slice(0, 8)}…</span>
                  </Tooltip>
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => onEdit(m)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => setDeleteTarget(m)}
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
        title="Delete Measurement"
        message="Are you sure you want to delete this measurement?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteMeasurement.isPending}
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
