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
const VIDEO_LIST_CACHE_TTL_MS = 60_000;
let videoCardsCache:
  | { value: VideoCardRecord[]; expiresAt: number }
  | null = null;
let videosCache:
  | { value: VideoRecord[]; expiresAt: number }
  | null = null;

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

const toObjectId = (value: unknown) => {
  if (value instanceof mongoose.Types.ObjectId) {
    return value;
  }

  if (typeof value === "string" && mongoose.Types.ObjectId.isValid(value)) {
    return new mongoose.Types.ObjectId(value);
  }

  return null;
};

export const resolveOwnedVideoSlug = async (
  videoId: PurchaseVideoReference | null | undefined,
) => {
  const [slug] = await resolveOwnedVideoSlugs(videoId ? [videoId] : []);
  return slug ?? null;
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
  const objectIds: mongoose.Types.ObjectId[] = [];
  const legacyValues: string[] = [];

  for (const { videoId: rawVideoId } of orderedEntries) {
    if (!rawVideoId) {
      continue;
    }

    if (rawVideoId instanceof mongoose.Types.ObjectId) {
      objectIds.push(rawVideoId);
      continue;
    }

    if (typeof rawVideoId === "string") {
      const objectId = toObjectId(rawVideoId);
      if (objectId && rawVideoId !== DEFAULT_VIDEO_ID && rawVideoId !== DEFAULT_VIDEO_SLUG) {
        objectIds.push(objectId);
        continue;
      }

      legacyValues.push(rawVideoId);
    }
  }

  const orderedSlugs = new Map<number, string>();

  const nonDefaultLegacyValues = legacyValues.filter(
    (value) => value !== DEFAULT_VIDEO_ID && value !== DEFAULT_VIDEO_SLUG,
  );
  const legacySet = new Set(nonDefaultLegacyValues);

  if (nonDefaultLegacyValues.length > 0) {
    const legacyVideos = await Video.find({
      $or: [
        { slug: { $in: nonDefaultLegacyValues } },
        { videoId: { $in: nonDefaultLegacyValues } },
      ],
    })
      .select({ slug: 1, videoId: 1 })
      .lean<Array<Pick<VideoSource, "slug" | "videoId">>>();

    const legacyMap = new Map<string, string>();
    for (const video of legacyVideos) {
      legacyMap.set(video.slug, video.slug);
      if (video.videoId) {
        legacyMap.set(video.videoId, video.slug);
      }
    }

    for (const { videoId: rawVideoId, index } of orderedEntries) {
      if (typeof rawVideoId !== "string") {
        continue;
      }

      if (rawVideoId === DEFAULT_VIDEO_ID || rawVideoId === DEFAULT_VIDEO_SLUG) {
        orderedSlugs.set(index, DEFAULT_VIDEO_SLUG);
        continue;
      }

      if (legacySet.has(rawVideoId)) {
        orderedSlugs.set(index, legacyMap.get(rawVideoId) ?? rawVideoId);
      }
    }
  }

  if (objectIds.length > 0) {
    const videos = await Video.find({
      _id: { $in: asUniqueLookupValues(objectIds) },
    })
      .select({ slug: 1 })
      .lean<Array<Pick<VideoSource, "_id" | "slug">>>();

    const objectIdToSlug = new Map<string, string>();
    for (const video of videos) {
      objectIdToSlug.set(String(video._id), video.slug);
    }

    for (const { videoId: rawVideoId, index } of orderedEntries) {
      const objectId =
        rawVideoId instanceof mongoose.Types.ObjectId
          ? rawVideoId
          : typeof rawVideoId === "string"
            ? toObjectId(rawVideoId)
            : null;

      if (!objectId) {
        continue;
      }

      const slug = objectIdToSlug.get(String(objectId));
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

const getCachedValue = <T>(
  cacheEntry: { value: T; expiresAt: number } | null,
) => {
  if (!cacheEntry) {
    return null;
  }

  if (cacheEntry.expiresAt <= Date.now()) {
    return null;
  }

  return cacheEntry.value;
};

const fetchActiveVideoCards = async () => {
  await ensureDefaultVideoExists();

  const videos = await Video.find({ isActive: true })
    .select(CARD_VIDEO_PROJECTION)
    .sort({ createdAt: -1 })
    .lean<VideoSource[]>();

  return videos.map(serializeVideoCard);
};

export const listActiveVideoCards = async () => {
  const cachedValue = getCachedValue(videoCardsCache);
  if (cachedValue) {
    return cachedValue;
  }

  const value = await fetchActiveVideoCards();
  videoCardsCache = {
    value,
    expiresAt: Date.now() + VIDEO_LIST_CACHE_TTL_MS,
  };
  return value;
};

const fetchActiveVideos = async () => {
  await ensureDefaultVideoExists();

  const videos = await Video.find({ isActive: true })
    .select(FULL_VIDEO_PROJECTION)
    .sort({ createdAt: 1 })
    .lean<VideoSource[]>();

  return videos.map(serializeVideo);
};

export const listActiveVideos = async () => {
  const cachedValue = getCachedValue(videosCache);
  if (cachedValue) {
    return cachedValue;
  }

  const value = await fetchActiveVideos();
  videosCache = {
    value,
    expiresAt: Date.now() + VIDEO_LIST_CACHE_TTL_MS,
  };
  return value;
};

export const getActiveVideoBySlug = async (slug: string) => {
  const video = await getActiveVideoDocumentBySlug(slug);
  return video ? serializeVideo(video) : null;
};
