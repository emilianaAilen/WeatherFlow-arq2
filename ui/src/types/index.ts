export interface User {
  id: string;
  name: string;
  surname: string;
  email: string;
  subscriptions?: string[];
}

export interface Location {
  latitude: number;
  longitude: number;
}

export interface WeatherStation {
  id: string;
  name: string;
  location: Location;
  sensorModel: string;
  status: 'Active' | 'Inactive';
  ownerId: string;
  receivesExternalData?: boolean;
}

export type AlertType =
  | 'None'
  | 'Extreme heat'
  | 'Frost'
  | 'Storm/Low pressure'
  | 'Critical humidity';

export interface Alert {
  status: boolean;
  type: AlertType;
}

export interface Measurement {
  id: string;
  temperature: { value: number };
  humidity: { value: number };
  atmosphericPressure: { value: number };
  dateTime: string;
  alert: Alert;
  stationId: string;
}

export interface MeasurementFilters {
  station?: string;
  min_temperature?: number;
  max_temperature?: number;
  min_humidity?: number;
  max_humidity?: number;
  min_pressure?: number;
  max_pressure?: number;
  alert_status?: boolean;
}

export interface ApiError {
  message: string;
  errors?: { field: string; message: string }[];
}
