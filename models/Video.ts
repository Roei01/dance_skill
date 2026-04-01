import mongoose, { Document, Schema } from 'mongoose';

export interface IVideo extends Document {
  videoId?: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  level: string;
  videoUrl: string;
  previewUrl: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: Date;
}

const VideoSchema = new Schema<IVideo>({
  videoId: { type: String, trim: true, index: true, sparse: true },
  slug: { type: String, required: true, unique: true, index: true, trim: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  price: { type: Number, required: true },
  level: { type: String, required: true, trim: true },
  videoUrl: { type: String, required: true, trim: true },
  previewUrl: { type: String, required: true, trim: true },
  imageUrl: { type: String, trim: true },
  isActive: { type: Boolean, default: true, index: true },
  createdAt: { type: Date, default: Date.now },
});

export const Video = mongoose.models.Video || mongoose.model<IVideo>('Video', VideoSchema);
