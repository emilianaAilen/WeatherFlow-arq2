import mongoose, { Schema, Document, Model } from 'mongoose';
import { AlertType } from '@/domain';

export interface IClimateMeasurementDocument extends Document {
  _id: mongoose.Types.ObjectId;
  temperature: number;
  humidity: number;
  atmosphericPressure: number;
  dateTime: Date;
  alert: {
    status: boolean;
    type: AlertType;
  };
  stationId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const climateMeasurementSchema = new Schema<IClimateMeasurementDocument>(
  {
    temperature: { type: Number, required: true },
    humidity: { type: Number, required: true },
    atmosphericPressure: { type: Number, required: true },
    dateTime: { type: Date, required: true },
    alert: {
      status: { type: Boolean, required: true },
      type: { type: String, enum: Object.values(AlertType), required: true },
    },
    stationId: { type: Schema.Types.ObjectId, ref: 'WeatherStation', required: true },
  },
  { timestamps: true }
);

export const ClimateMeasurementModel: Model<IClimateMeasurementDocument> =
  mongoose.model<IClimateMeasurementDocument>('ClimateMeasurement', climateMeasurementSchema);
