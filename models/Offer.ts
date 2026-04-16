import mongoose, { Document, Schema } from "mongoose";

export interface IOffer extends Document {
  slug: string;
  title: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  hostedPaymentUrl?: string;
  includedVideoIds: string[];
  includedVideoSlugs: string[];
  isActive: boolean;
  createdAt: Date;
}

const OfferSchema = new Schema<IOffer>({
  slug: { type: String, required: true, unique: true, index: true, trim: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  price: { type: Number, required: true },
  compareAtPrice: { type: Number },
  hostedPaymentUrl: { type: String, trim: true },
  includedVideoIds: { type: [String], default: [] },
  includedVideoSlugs: { type: [String], default: [] },
  isActive: { type: Boolean, default: true, index: true },
  createdAt: { type: Date, default: Date.now },
});

OfferSchema.index({ isActive: 1, createdAt: -1 });

export const Offer =
  mongoose.models.Offer || mongoose.model<IOffer>("Offer", OfferSchema);
