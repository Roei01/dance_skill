import mongoose, { Document, Schema } from 'mongoose';

export interface IPurchase extends Document {
  userId?: mongoose.Types.ObjectId;
  videoId: mongoose.Types.ObjectId | string;
  grantedVideoIds?: mongoose.Types.ObjectId[];
  purchaseType?: 'video' | 'offer';
  offerSlug?: string;
  paymentId: string;
  orderId?: string;
  customerFullName: string;
  customerPhone: string;
  customerEmail: string;
  appBaseUrl?: string;
  originalPrice?: number;
  finalPrice?: number;
  appliedDiscountCode?: string;
  status: 'pending' | 'completed' | 'failed';
  credentialsSentAt?: Date;
  createdAt: Date;
}

const PurchaseSchema = new Schema<IPurchase>({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Video', required: true, index: true },
  grantedVideoIds: { type: [mongoose.Schema.Types.ObjectId], ref: 'Video', default: [] },
  purchaseType: { type: String, enum: ['video', 'offer'], default: 'video', index: true },
  offerSlug: { type: String, trim: true, index: true },
  paymentId: { type: String, required: true, unique: true, index: true },
  orderId: { type: String, trim: true, index: true },
  customerFullName: { type: String, required: true, trim: true },
  customerPhone: { type: String, required: true, trim: true },
  customerEmail: { type: String, required: true, trim: true, lowercase: true, index: true },
  appBaseUrl: { type: String, trim: true },
  originalPrice: { type: Number },
  finalPrice: { type: Number },
  appliedDiscountCode: { type: String, trim: true, uppercase: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  credentialsSentAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

export const Purchase = mongoose.models.Purchase || mongoose.model<IPurchase>('Purchase', PurchaseSchema);
