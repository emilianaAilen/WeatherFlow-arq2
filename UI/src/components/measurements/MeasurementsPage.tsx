import { useState } from 'react';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import {
  useMeasurements,
  useCreateMeasurement,
  useUpdateMeasurement,
} from '../../hooks/useMeasurements';
import type { Measurement, MeasurementFilters } from '../../types';
import MeasurementsTable from './MeasurementsTable';
import MeasurementForm from './MeasurementForm';
import MeasurementFiltersPanel from './MeasurementFilters';
import ErrorAlert from '../common/ErrorAlert';
import Notification from '../common/Notification';
import type { CreateMeasurementFormData } from '../../schemas/measurement.schema';

export default function MeasurementsPage() {
  const [filters, setFilters] = useState<MeasurementFilters>({});
  const { data: measurements, isLoading, error } = useMeasurements(filters);
  const createMeasurement = useCreateMeasurement();
  const updateMeasurement = useUpdateMeasurement();

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Measurement | undefined>();
  const [notification, setNotification] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);

  const handleSubmit = (data: CreateMeasurementFormData) => {
    if (editTarget) {
      const { temperature, humidity, atmosphericPressure } = data;
      updateMeasurement.mutate(
        { id: editTarget.id, data: { temperature, humidity, atmosphericPressure } },
        {
          onSuccess: () => {
            setNotification({ message: 'Measurement updated successfully', severity: 'success' });
            setFormOpen(false);
            setEditTarget(undefined);
          },
          onError: (err: unknown) => {
            const message = err && typeof err === 'object' && 'message' in err
              ? (err as { message: string }).message
              : 'Failed to update measurement';
            setNotification({ message, severity: 'error' });
          },
        }
      );
    } else {
      createMeasurement.mutate(data, {
        onSuccess: () => {
          setNotification({ message: 'Measurement recorded successfully', severity: 'success' });
          setFormOpen(false);
        },
        onError: (err: unknown) => {
          const message = err && typeof err === 'object' && 'message' in err
            ? (err as { message: string }).message
            : 'Failed to record measurement';
          setNotification({ message, severity: 'error' });
        },
      });
    }
  };

  return (
    <Box>
      <Box
        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
      >
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Climate Measurements
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => { setEditTarget(undefined); setFormOpen(true); }}
        >
          Record Measurement
        </Button>
      </Box>

      <MeasurementFiltersPanel
        onFilter={setFilters}
        onReset={() => setFilters({})}
      />

      {isLoading && <CircularProgress />}
      {error && <ErrorAlert error={error} />}
      {measurements && (
        <MeasurementsTable
          measurements={measurements}
          onEdit={(m) => { setEditTarget(m); setFormOpen(true); }}
        />
      )}

      <MeasurementForm
        open={formOpen}
        measurement={editTarget}
        onClose={() => { setFormOpen(false); setEditTarget(undefined); }}
        onSubmit={handleSubmit}
        loading={createMeasurement.isPending || updateMeasurement.isPending}
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
