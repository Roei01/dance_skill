import { api } from "@/lib/api-client";
import { type OfferQuoteRecord, type OfferRecord } from "@/lib/offer-types";

const offerBySlugPromise = new Map<string, Promise<OfferRecord>>();

export const getCachedOfferBySlug = async (slug: string) => {
  const existing = offerBySlugPromise.get(slug);
  if (existing) {
    return existing;
  }

  const request = api
    .get<OfferRecord>(`/offers/${slug}`)
    .then((response) => response.data)
    .finally(() => {
      offerBySlugPromise.delete(slug);
    });

  offerBySlugPromise.set(slug, request);
  return request;
};

export const getOfferQuote = async ({
  slug,
  email,
  discountCode,
}: {
  slug: string;
  email?: string;
  discountCode: string;
}) => {
  const response = await api.post<OfferQuoteRecord>(`/offers/${slug}/quote`, {
    email,
    discountCode,
  });

  return response.data;
};

export const clearClientOfferCache = () => {
  offerBySlugPromise.clear();
};
