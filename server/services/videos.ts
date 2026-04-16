import mongoose from "mongoose";
import { Video, type IVideo } from "../../models/Video";
import { type VideoCardRecord, type VideoRecord } from "../../lib/video-types";
import {
  DEFAULT_VIDEO_DESCRIPTION,
  DEFAULT_VIDEO_ID,
  DEFAULT_VIDEO_IMAGE_URL,
  DEFAULT_VIDEO_LEVEL,
  DEFAULT_VIDEO_PLAYER_URL,
  DEFAULT_VIDEO_PREVIEW_URL,
  DEFAULT_VIDEO_PRICE_ILS,
  DEFAULT_VIDEO_SLUG,
  DEFAULT_VIDEO_TITLE,
} from "../../lib/catalog";

const DEFAULT_VIDEO_SEED = {
  videoId: DEFAULT_VIDEO_ID,
  slug: DEFAULT_VIDEO_SLUG,
  title: DEFAULT_VIDEO_TITLE,
  description: DEFAULT_VIDEO_DESCRIPTION,
  watchDescription: DEFAULT_VIDEO_DESCRIPTION,
  classBreakdown: [
    { time: "18:10", label: "קצב איטי" },
    { time: "19:10", label: "קצב רגיל" },
    { time: "19:55", label: "מלא עם מוזיקה" },
  ],
  price: DEFAULT_VIDEO_PRICE_ILS,
  level: DEFAULT_VIDEO_LEVEL,
  videoUrl: DEFAULT_VIDEO_PLAYER_URL,
  previewUrl: DEFAULT_VIDEO_PREVIEW_URL,
  imageUrl: DEFAULT_VIDEO_IMAGE_URL,
  isActive: true,
};

type VideoSource = {
  _id: mongoose.Types.ObjectId | string;
  slug: string;
  title: string;
  description: string;
  watchDescription?: string;
  classBreakdown?: IVideo["classBreakdown"];
  price: number;
  level: string;
  videoUrl?: string;
  previewUrl?: string;
  imageUrl?: string;
  isActive: boolean;
  videoId?: string;
};

const CARD_VIDEO_PROJECTION = {
  slug: 1,
  title: 1,
  description: 1,
  price: 1,
  level: 1,
  imageUrl: 1,
  isActive: 1,
  createdAt: 1,
} as const;

const FULL_VIDEO_PROJECTION = {
  slug: 1,
  title: 1,
  description: 1,
  watchDescription: 1,
  classBreakdown: 1,
  price: 1,
  level: 1,
  videoUrl: 1,
  previewUrl: 1,
  imageUrl: 1,
  isActive: 1,
} as const;

let ensureDefaultVideoPromise: Promise<void> | null = null;
let initialized = false;

const serializeVideoCard = (video: VideoSource): VideoCardRecord => ({
  id: String(video._id),
  slug: video.slug,
  title: video.title,
  description: video.description,
  price: video.price,
  level: video.level,
  imageUrl: video.imageUrl || DEFAULT_VIDEO_IMAGE_URL,
  isActive: video.isActive,
});

const serializeVideo = (video: VideoSource): VideoRecord => ({
  ...serializeVideoCard(video),
  watchDescription: video.watchDescription || video.description,
  classBreakdown: Array.isArray(video.classBreakdown) ? video.classBreakdown : [],
  videoUrl: video.videoUrl || DEFAULT_VIDEO_PLAYER_URL,
  previewUrl: video.previewUrl || DEFAULT_VIDEO_PREVIEW_URL,
});

type PurchaseVideoReference = mongoose.Types.ObjectId | string;

const asUniqueLookupValues = (
  values: Array<PurchaseVideoReference | null | undefined>,
) => {
  const seen = new Set<string>();
  const uniqueValues: PurchaseVideoReference[] = [];

  for (const value of values) {
    if (!value) {
      continue;
    }

    const key = String(value);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    uniqueValues.push(value);
  }

  return uniqueValues;
};

export const resolveOwnedVideoSlugs = async (
  videoIds: Array<PurchaseVideoReference | null | undefined>,
) => {
  const orderedEntries = videoIds
    .map((videoId, index) => ({ videoId, index }))
    .filter(
      (
        entry,
      ): entry is { videoId: PurchaseVideoReference; index: number } =>
        Boolean(entry.videoId),
    );
  const orderedSlugs = new Map<number, string>();
  const lookupValues = asUniqueLookupValues(
    orderedEntries.map(({ videoId }) => videoId),
  );

  if (lookupValues.length > 0) {
    const videos = await Video.find({
      _id: { $in: lookupValues },
      isActive: true,
    })
      .select({ _id: 1, slug: 1 })
      .lean<Array<Pick<VideoSource, "_id" | "slug">>>();

    const videoIdToSlug = new Map<string, string>();
    for (const video of videos) {
      videoIdToSlug.set(String(video._id), video.slug);
    }

    for (const { videoId, index } of orderedEntries) {
      const slug = videoIdToSlug.get(String(videoId));
      if (slug) {
        orderedSlugs.set(index, slug);
      }
    }
  }

  return Array.from(orderedSlugs.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([, slug]) => slug)
    .filter((slug, index, array) => array.indexOf(slug) === index);
};

export const ensureDefaultVideoExists = async () => {
  if (initialized) {
    return;
  }

  if (ensureDefaultVideoPromise) {
    await ensureDefaultVideoPromise;
    return;
  }

  if (!ensureDefaultVideoPromise) {
    ensureDefaultVideoPromise = (async () => {
      await Video.updateOne(
        { slug: DEFAULT_VIDEO_SLUG },
        { $setOnInsert: DEFAULT_VIDEO_SEED },
        { upsert: true },
      );

      await Promise.all([
        Video.updateOne(
          {
            slug: DEFAULT_VIDEO_SLUG,
            $or: [{ imageUrl: { $exists: false } }, { imageUrl: "" }],
          },
          { $set: { imageUrl: DEFAULT_VIDEO_IMAGE_URL } },
        ),
        Video.updateOne(
          {
            slug: DEFAULT_VIDEO_SLUG,
            $or: [{ videoId: { $exists: false } }, { videoId: "" }],
          },
          { $set: { videoId: DEFAULT_VIDEO_ID } },
        ),
        Video.updateOne(
          {
            slug: DEFAULT_VIDEO_SLUG,
            $or: [{ watchDescription: { $exists: false } }, { watchDescription: "" }],
          },
          { $set: { watchDescription: DEFAULT_VIDEO_DESCRIPTION } },
        ),
        Video.updateOne(
          {
            slug: DEFAULT_VIDEO_SLUG,
            $or: [{ classBreakdown: { $exists: false } }, { classBreakdown: { $size: 0 } }],
          },
          { $set: { classBreakdown: DEFAULT_VIDEO_SEED.classBreakdown } },
        ),
      ]);
      initialized = true;
    })().catch((error) => {
      initialized = false;
      ensureDefaultVideoPromise = null;
      throw error;
    }).finally(() => {
      if (initialized) {
        ensureDefaultVideoPromise = null;
      }
    });
  }

  await ensureDefaultVideoPromise;
};

export const getActiveVideoDocumentBySlug = async (slug: string) => {
  await ensureDefaultVideoExists();
  return Video.findOne({ slug, isActive: true })
    .select(FULL_VIDEO_PROJECTION)
    .lean<VideoSource | null>();
};

export const getActiveVideoDocumentById = async (
  videoId: mongoose.Types.ObjectId | string,
) => {
  await ensureDefaultVideoExists();
  return Video.findOne({ _id: videoId, isActive: true })
    .select(FULL_VIDEO_PROJECTION)
    .lean<VideoSource | null>();
};

const fetchActiveVideoCards = async () => {
  await ensureDefaultVideoExists();

  const videos = await Video.find({ isActive: true })
    .select(CARD_VIDEO_PROJECTION)
    .sort({ createdAt: -1 })
    .lean<VideoSource[]>();

  return videos.map(serializeVideoCard);
};

export const listActiveVideoCards = async () => fetchActiveVideoCards();

const fetchActiveVideos = async () => {
  await ensureDefaultVideoExists();

  const videos = await Video.find({ isActive: true })
    .select(FULL_VIDEO_PROJECTION)
    .sort({ createdAt: 1 })
    .lean<VideoSource[]>();

  return videos.map(serializeVideo);
};

export const listActiveVideos = async () => fetchActiveVideos();

export const getActiveVideoBySlug = async (slug: string) => {
  const video = await getActiveVideoDocumentBySlug(slug);
  return video ? serializeVideo(video) : null;
};
