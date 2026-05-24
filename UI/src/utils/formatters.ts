import type { AlertType } from '../types';

export const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleString();

export const alertColor = (
  type: AlertType
): 'default' | 'error' | 'info' | 'secondary' | 'warning' => {
  switch (type) {
    case 'Extreme heat':
      return 'error';
    case 'Frost':
      return 'info';
    case 'Storm/Low pressure':
      return 'secondary';
    case 'Critical humidity':
      return 'warning';
    default:
      return 'default';
  }
};
