import { Schema, model, Document } from 'mongoose';

export interface IStationReadModel extends Document {
  _id: string; // station id
  name: string;
}

const stationReadModelSchema = new Schema<IStationReadModel>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
  },
  { collection: 'stations_read_model', timestamps: false },
);

export const StationReadModelModel = model<IStationReadModel>(
  'StationReadModel',
  stationReadModelSchema,
);
