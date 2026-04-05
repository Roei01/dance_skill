import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  username: string;
  passwordHash: string;
  resetPasswordTokenHash?: string;
  resetPasswordExpiresAt?: Date;
  ipAddress?: string;
  allowedIps: string[];
  activeSessionId?: string;
  activeSessionStartedAt?: Date;
  activeSessionExpiresAt?: Date;
  activeSessionDisconnectAt?: Date;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  resetPasswordTokenHash: { type: String },
  resetPasswordExpiresAt: { type: Date },
  ipAddress: { type: String },
  allowedIps: { type: [String], default: [] },
  activeSessionId: { type: String },
  activeSessionStartedAt: { type: Date },
  activeSessionExpiresAt: { type: Date },
  activeSessionDisconnectAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
