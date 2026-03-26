import mongoose, { Document, Schema } from 'mongoose';

export interface IPurchase extends Document {
  userId?: mongoose.Types.ObjectId;
  videoId: string;
  paymentId: string;
  customerFullName: string;
  customerPhone: string;
  customerEmail: string;
  appBaseUrl?: string;
  status: 'pending' | 'completed' | 'failed';
  credentialsSentAt?: Date;
  createdAt: Date;
}

const PurchaseSchema = new Schema<IPurchase>({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  videoId: { type: String, required: true, index: true },
  paymentId: { type: String, required: true, unique: true, index: true },
  customerFullName: { type: String, required: true, trim: true },
  customerPhone: { type: String, required: true, trim: true },
  customerEmail: { type: String, required: true, trim: true, lowercase: true, index: true },
  appBaseUrl: { type: String, trim: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  credentialsSentAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

export const Purchase = mongoose.models.Purchase || mongoose.model<IPurchase>('Purchase', PurchaseSchema);
