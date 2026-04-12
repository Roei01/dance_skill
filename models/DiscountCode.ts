import mongoose, { Document, Schema } from "mongoose";

export interface IDiscountCode extends Document {
  code: string;
  offerSlug: string;
  email?: string;
  discountAmount: number;
  isActive: boolean;
  usedAt?: Date;
  usedByPurchaseId?: mongoose.Types.ObjectId;
  usedByEmail?: string;
  expiresAt?: Date;
  createdAt: Date;
}

const DiscountCodeSchema = new Schema<IDiscountCode>({
  code: { type: String, required: true, unique: true, index: true, trim: true, uppercase: true },
  offerSlug: { type: String, required: true, index: true, trim: true },
  email: { type: String, trim: true, lowercase: true, index: true },
  discountAmount: { type: Number, required: true },
  isActive: { type: Boolean, default: true, index: true },
  usedAt: { type: Date },
  usedByPurchaseId: { type: mongoose.Schema.Types.ObjectId, ref: "Purchase" },
  usedByEmail: { type: String, trim: true, lowercase: true },
  expiresAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

DiscountCodeSchema.index({ offerSlug: 1, isActive: 1, createdAt: -1 });

export const DiscountCode =
  mongoose.models.DiscountCode ||
  mongoose.model<IDiscountCode>("DiscountCode", DiscountCodeSchema);
