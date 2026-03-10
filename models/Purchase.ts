import mongoose, { Document, Schema } from 'mongoose';

export interface IPurchase extends Document {
  userId: mongoose.Types.ObjectId;
  videoId: string;
  paymentId: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
}

const PurchaseSchema = new Schema<IPurchase>({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  videoId: { type: String, required: true, index: true },
  paymentId: { type: String, required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});

export const Purchase = mongoose.models.Purchase || mongoose.model<IPurchase>('Purchase', PurchaseSchema);
