import mongoose, { Schema, Document, Model } from 'mongoose';
import { StationStatusType } from '@/domain';

export interface IWeatherStationDocument extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  location: {
    latitude: number;
    longitude: number;
  };
  sensorModel: string;
  status: StationStatusType;
  ownerId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const weatherStationSchema = new Schema<IWeatherStationDocument>(
  {
    name: { type: String, required: true },
    location: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    sensorModel: { type: String, required: true },
    status: { type: String, enum: Object.values(StationStatusType), required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const WeatherStationModel: Model<IWeatherStationDocument> = mongoose.model<IWeatherStationDocument>(
  'WeatherStation',
  weatherStationSchema
);
