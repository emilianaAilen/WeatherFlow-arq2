import { Alert, Box } from '@mui/material';
import type { ApiError } from '../../types';

interface Props {
  error: ApiError | Error | unknown;
}

export default function ErrorAlert({ error }: Props) {
  const message =
    error && typeof error === 'object' && 'message' in error
      ? (error as ApiError).message
      : 'Something went wrong';

  return (
    <Box sx={{ mt: 2 }}>
      <Alert severity="error">{message}</Alert>
    </Box>
  );
}
