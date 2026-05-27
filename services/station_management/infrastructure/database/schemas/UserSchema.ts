import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUserDocument extends Document {
  _id: string;
  name: string;
  surname: string;
  email: string;
  subscriptions: string[];
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUserDocument>(
  {
    _id: { type: String },
    name: { type: String, required: true },
    surname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    subscriptions: [{ type: String, ref: 'WeatherStation' }],
  },
  { timestamps: true },
);

export const UserModel: Model<IUserDocument> = mongoose.model<IUserDocument>('User', userSchema);
