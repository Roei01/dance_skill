import mongoose from "mongoose";
import { Video, type IVideo } from "../../models/Video";
import { type VideoRecord } from "../../lib/video-types";
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

const serializeVideo = (video: IVideo): VideoRecord => ({
  id: String(video._id),
  slug: video.slug,
  title: video.title,
  description: video.description,
  watchDescription: video.watchDescription || video.description,
  classBreakdown: Array.isArray(video.classBreakdown) ? video.classBreakdown : [],
  price: video.price,
  level: video.level,
  videoUrl: video.videoUrl,
  previewUrl: video.previewUrl,
  imageUrl: video.imageUrl || DEFAULT_VIDEO_IMAGE_URL,
  isActive: video.isActive,
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

  if (nonDefaultLegacyValues.length > 0) {
    const legacyVideos = await Video.find({
      $or: [
        { slug: { $in: nonDefaultLegacyValues } },
        { videoId: { $in: nonDefaultLegacyValues } },
      ],
    }).select({ slug: 1, videoId: 1 });

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

      if (nonDefaultLegacyValues.includes(rawVideoId)) {
        orderedSlugs.set(index, legacyMap.get(rawVideoId) ?? rawVideoId);
      }
    }
  }

  if (objectIds.length > 0) {
    const videos = await Video.find({
      _id: { $in: asUniqueLookupValues(objectIds) },
    }).select({ slug: 1 });

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
  await Video.findOneAndUpdate(
    { slug: DEFAULT_VIDEO_SLUG },
    { $setOnInsert: DEFAULT_VIDEO_SEED },
    { upsert: true, new: true },
  );

  await Video.findOneAndUpdate(
    {
      slug: DEFAULT_VIDEO_SLUG,
      $or: [{ imageUrl: { $exists: false } }, { imageUrl: "" }],
    },
    { $set: { imageUrl: DEFAULT_VIDEO_IMAGE_URL } },
  );

  await Video.findOneAndUpdate(
    {
      slug: DEFAULT_VIDEO_SLUG,
      $or: [{ videoId: { $exists: false } }, { videoId: "" }],
    },
    { $set: { videoId: DEFAULT_VIDEO_ID } },
  );

  await Video.findOneAndUpdate(
    {
      slug: DEFAULT_VIDEO_SLUG,
      $or: [{ watchDescription: { $exists: false } }, { watchDescription: "" }],
    },
    { $set: { watchDescription: DEFAULT_VIDEO_DESCRIPTION } },
  );

  await Video.findOneAndUpdate(
    {
      slug: DEFAULT_VIDEO_SLUG,
      $or: [{ classBreakdown: { $exists: false } }, { classBreakdown: { $size: 0 } }],
    },
    { $set: { classBreakdown: DEFAULT_VIDEO_SEED.classBreakdown } },
  );
};

export const getActiveVideoDocumentBySlug = async (slug: string) => {
  await ensureDefaultVideoExists();
  return Video.findOne({ slug, isActive: true });
};

export const listActiveVideos = async () => {
  await ensureDefaultVideoExists();

  const videos = await Video.find({ isActive: true }).sort({ createdAt: 1 });
  return videos.map(serializeVideo);
};

export const getActiveVideoBySlug = async (slug: string) => {
  const video = await getActiveVideoDocumentBySlug(slug);
  return video ? serializeVideo(video) : null;
};
