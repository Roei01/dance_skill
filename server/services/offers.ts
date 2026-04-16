import { DiscountCode, type IDiscountCode } from "../../models/DiscountCode";
import { Offer } from "../../models/Offer";
import { Video } from "../../models/Video";
import {
  DEFAULT_BUNDLE_OFFER_SLUG,
  DEFAULT_BUNDLE_HOSTED_PAYMENT_URL,
  DEFAULT_BUNDLE_VIDEO_IDS,
} from "../../lib/offers";
import { type OfferQuoteRecord, type OfferRecord } from "../../lib/offer-types";
import { listActiveVideoCards } from "./videos";

type OfferSource = {
  slug: string;
  title: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  hostedPaymentUrl?: string;
  includedVideoIds?: string[];
  includedVideoSlugs: string[];
  isActive: boolean;
};

let ensureDefaultOfferPromise: Promise<void> | null = null;
let offersInitialized = false;

const serializeOffer = async (offer: OfferSource): Promise<OfferRecord> => {
  const videos = await listActiveVideoCards();
  const includedVideoIdsSet = new Set(offer.includedVideoIds ?? []);
  const includedVideoSlugsSet = new Set(offer.includedVideoSlugs);
  const includedVideos = videos.filter((video) =>
    includedVideoIdsSet.size > 0
      ? includedVideoIdsSet.has(video.id)
      : includedVideoSlugsSet.has(video.slug),
  );

  return {
    slug: offer.slug,
    title: offer.title,
    description: offer.description,
    price: offer.price,
    compareAtPrice: offer.compareAtPrice,
    hostedPaymentUrl: offer.hostedPaymentUrl,
    includedVideoIds: offer.includedVideoIds ?? [],
    includedVideoSlugs: offer.includedVideoSlugs,
    videos: includedVideos.filter((video): video is NonNullable<typeof video> =>
      Boolean(video),
    ),
  };
};

export const ensureDefaultBundleOfferExists = async () => {
  if (offersInitialized) {
    return;
  }

  if (ensureDefaultOfferPromise) {
    await ensureDefaultOfferPromise;
    return;
  }

  ensureDefaultOfferPromise = (async () => {
    const videos = await listActiveVideoCards();
    if (videos.length === 0) {
      offersInitialized = true;
      return;
    }

    const selectedVideos = DEFAULT_BUNDLE_VIDEO_IDS.map((videoId) =>
      videos.find((video) => video.id === videoId),
    ).filter((video): video is NonNullable<typeof video> => Boolean(video));

    if (selectedVideos.length === 0) {
      offersInitialized = true;
      return;
    }

    const includedVideoSlugs = selectedVideos.map((video) => video.slug);
    const compareAtPrice = selectedVideos.reduce(
      (sum, video) => sum + video.price,
      0,
    );

    await Offer.updateOne(
      { slug: DEFAULT_BUNDLE_OFFER_SLUG },
      {
        $setOnInsert: {
          slug: DEFAULT_BUNDLE_OFFER_SLUG,
          title: 'כל 3 השיעורים ב-99 ש"ח',
          description:
            "חבילת צפייה מלאה לשלושת הסרטונים שנבחרו באתר, במחיר מיוחד ונוח.",
          price: 99,
          compareAtPrice,
          hostedPaymentUrl: DEFAULT_BUNDLE_HOSTED_PAYMENT_URL,
          includedVideoIds: DEFAULT_BUNDLE_VIDEO_IDS,
          includedVideoSlugs,
          isActive: true,
        },
      },
      { upsert: true },
    );

    await Offer.updateOne(
      {
        slug: DEFAULT_BUNDLE_OFFER_SLUG,
        $or: [
          { includedVideoIds: { $exists: false } },
          { includedVideoIds: { $size: 0 } },
        ],
      },
      {
        $set: {
          title: 'כל 3 השיעורים ב-99 ש"ח',
          description:
            "חבילת צפייה מלאה לשלושת הסרטונים שנבחרו באתר, במחיר מיוחד ונוח.",
          price: 99,
          compareAtPrice,
          hostedPaymentUrl: DEFAULT_BUNDLE_HOSTED_PAYMENT_URL,
          includedVideoIds: DEFAULT_BUNDLE_VIDEO_IDS,
          includedVideoSlugs,
          isActive: true,
        },
      },
    );

    offersInitialized = true;
  })()
    .catch((error) => {
      offersInitialized = false;
      ensureDefaultOfferPromise = null;
      throw error;
    })
    .finally(() => {
      if (offersInitialized) {
        ensureDefaultOfferPromise = null;
      }
    });

  await ensureDefaultOfferPromise;
};

export const getActiveOfferDocumentBySlug = async (slug: string) => {
  await ensureDefaultBundleOfferExists();
  return Offer.findOne({ slug, isActive: true }).lean<OfferSource | null>();
};

export const getActiveOfferBySlug = async (slug: string) => {
  const offer = await getActiveOfferDocumentBySlug(slug);
  return offer ? serializeOffer(offer) : null;
};

export const listActiveOffers = async () => {
  await ensureDefaultBundleOfferExists();
  const offers = await Offer.find({ isActive: true })
    .sort({ createdAt: -1 })
    .lean<OfferSource[]>();

  return Promise.all(offers.map((offer) => serializeOffer(offer)));
};

const normalizeDiscountCode = (code: string) => code.trim().toUpperCase();

export const getValidDiscountCodeForOffer = async ({
  offerSlug,
  code,
  email,
}: {
  offerSlug: string;
  code: string;
  email?: string;
}): Promise<IDiscountCode | null> => {
  const normalizedCode = normalizeDiscountCode(code);
  const normalizedEmail = email?.trim().toLowerCase();
  const discountCode = await DiscountCode.findOne({
    code: normalizedCode,
    offerSlug,
    isActive: true,
  });

  if (!discountCode) {
    return null;
  }

  if (
    discountCode.expiresAt &&
    discountCode.expiresAt.getTime() <= Date.now()
  ) {
    return null;
  }

  if (
    discountCode.usedAt ||
    discountCode.usedByPurchaseId ||
    discountCode.usedByEmail
  ) {
    return null;
  }

  if (
    discountCode.email &&
    normalizedEmail &&
    discountCode.email !== normalizedEmail
  ) {
    return null;
  }

  if (discountCode.email && !normalizedEmail) {
    return null;
  }

  return discountCode;
};

export const quoteOfferPurchase = async ({
  offerSlug,
  email,
  discountCode,
}: {
  offerSlug: string;
  email?: string;
  discountCode?: string;
}): Promise<OfferQuoteRecord | null> => {
  const offer = await getActiveOfferBySlug(offerSlug);
  if (!offer) {
    return null;
  }

  let discountAmount = 0;
  let appliedCode: string | undefined;

  if (discountCode?.trim()) {
    const validDiscountCode = await getValidDiscountCodeForOffer({
      offerSlug,
      code: discountCode,
      email,
    });

    if (!validDiscountCode) {
      return {
        offerSlug,
        originalPrice: offer.price,
        finalPrice: offer.price,
        discountAmount: 0,
        message: "קוד ההנחה לא תקין, לא פעיל או שכבר נוצל.",
      };
    }

    discountAmount = validDiscountCode.discountAmount;
    appliedCode = validDiscountCode.code;
  }

  return {
    offerSlug,
    originalPrice: offer.price,
    finalPrice: Math.max(0, offer.price - discountAmount),
    discountAmount,
    appliedCode,
    message:
      discountAmount > 0
        ? `קוד ההנחה הופעל. חסכת ₪${discountAmount}.`
        : undefined,
  };
};

export const resolveOfferVideoDocuments = async (offerSlug: string) => {
  const offerDocument = await getActiveOfferDocumentBySlug(offerSlug);
  if (!offerDocument) {
    return null;
  }

  const offer = await serializeOffer(offerDocument);
  const query =
    offerDocument.includedVideoIds && offerDocument.includedVideoIds.length > 0
      ? { _id: { $in: offerDocument.includedVideoIds }, isActive: true }
      : { slug: { $in: offerDocument.includedVideoSlugs }, isActive: true };
  const rawVideos =
    await Video.find(query).lean<
      Array<{ _id: unknown; slug: string } & Record<string, unknown>>
    >();
  const videosById = new Map(
    rawVideos.map((video) => [String(video._id), video] as const),
  );
  const videosBySlug = new Map(
    rawVideos.map((video) => [video.slug, video] as const),
  );
  const orderedVideos =
    offer.includedVideoIds.length > 0
      ? offer.includedVideoIds.map((videoId) => videosById.get(videoId))
      : offer.videos.map((video) => videosBySlug.get(video.slug));

  return {
    offer,
    videos: orderedVideos.filter((video): video is NonNullable<typeof video> =>
      Boolean(video),
    ),
  };
};
