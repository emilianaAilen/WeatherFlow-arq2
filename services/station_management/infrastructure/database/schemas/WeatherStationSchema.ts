import mongoose, { Schema, Document, Model } from 'mongoose';
import { StationStatusType } from '@/domain';

export interface IWeatherStationDocument extends Document {
  _id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
  };
  sensorModel: string;
  status: StationStatusType;
  ownerId: string;
  receivesExternalData: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const weatherStationSchema = new Schema<IWeatherStationDocument>(
  {
    _id: { type: String },
    name: { type: String, required: true },
    location: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    sensorModel: { type: String, required: true },
    status: { type: String, enum: Object.values(StationStatusType), required: true },
    ownerId: { type: String, ref: 'User', required: true },
    receivesExternalData: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

export const WeatherStationModel: Model<IWeatherStationDocument> =
  mongoose.model<IWeatherStationDocument>('WeatherStation', weatherStationSchema);
