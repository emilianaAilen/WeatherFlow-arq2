import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUserDocument extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  surname: string;
  email: string;
  subscriptions: string[];
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true },
    surname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    subscriptions: [{ type: Schema.Types.ObjectId, ref: 'WeatherStation' }],
  },
  { timestamps: true }
);

export const UserModel: Model<IUserDocument> = mongoose.model<IUserDocument>('User', userSchema);
