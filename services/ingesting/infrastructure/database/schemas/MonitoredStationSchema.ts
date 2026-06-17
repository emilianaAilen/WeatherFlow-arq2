import { Schema, model, Document } from 'mongoose';

export interface IMonitoredStationDocument extends Document {
  _id: string;
  name: string;
  alertingStationId: string;
  latitude: number;
  longitude: number;
}

const monitoredStationSchema = new Schema<IMonitoredStationDocument>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    alertingStationId: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  { collection: 'monitored_stations', timestamps: true },
);

export const MonitoredStationModel = model<IMonitoredStationDocument>(
  'MonitoredStation',
  monitoredStationSchema,
);
