import { type VideoCardRecord } from "./video-types";

export type OfferRecord = {
  slug: string;
  title: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  hostedPaymentUrl?: string;
  includedVideoIds: string[];
  includedVideoSlugs: string[];
  videos: VideoCardRecord[];
};

export type OfferQuoteRecord = {
  offerSlug: string;
  originalPrice: number;
  finalPrice: number;
  discountAmount: number;
  appliedCode?: string;
  message?: string;
};
