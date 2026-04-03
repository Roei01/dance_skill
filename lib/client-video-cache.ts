"use client";

import { api } from "@/lib/api-client";
import { type VideoCardRecord, type VideoRecord } from "@/lib/video-types";

let videosCache: VideoRecord[] | null = null;
let videosPromise: Promise<VideoRecord[]> | null = null;
let videoCardsCache: VideoCardRecord[] | null = null;
let videoCardsPromise: Promise<VideoCardRecord[]> | null = null;

const videoBySlugCache = new Map<string, VideoRecord>();
const videoBySlugPromise = new Map<string, Promise<VideoRecord>>();

const toVideoCardRecord = (video: VideoRecord): VideoCardRecord => ({
  id: video.id,
  slug: video.slug,
  title: video.title,
  description: video.description,
  price: video.price,
  level: video.level,
  imageUrl: video.imageUrl,
  isActive: video.isActive,
});

const primeVideoCardCache = (videos: VideoCardRecord[]) => {
  videoCardsCache = videos;
};

const primeFullVideoCache = (videos: VideoRecord[]) => {
  videosCache = videos;
  for (const video of videos) {
    videoBySlugCache.set(video.slug, video);
  }

  primeVideoCardCache(videos.map(toVideoCardRecord));
};

export const getCachedVideoCards = async () => {
  if (videoCardsCache) {
    return videoCardsCache;
  }

  if (videosCache) {
    const cards = videosCache.map(toVideoCardRecord);
    primeVideoCardCache(cards);
    return cards;
  }

  if (!videoCardsPromise) {
    videoCardsPromise = api
      .get<VideoCardRecord[]>("/videos", { params: { view: "card" } })
      .then((response) => {
        primeVideoCardCache(response.data);
        return response.data;
      })
      .finally(() => {
        videoCardsPromise = null;
      });
  }

  return videoCardsPromise;
};

export const getCachedVideos = async () => {
  if (videosCache) {
    return videosCache;
  }

  if (!videosPromise) {
    videosPromise = api
      .get<VideoRecord[]>("/videos")
      .then((response) => {
        primeFullVideoCache(response.data);
        return response.data;
      })
      .finally(() => {
        videosPromise = null;
      });
  }

  return videosPromise;
};

export const getCachedVideoBySlug = async (slug: string) => {
  const cachedVideo = videoBySlugCache.get(slug);
  if (cachedVideo) {
    return cachedVideo;
  }

  const cachedVideos = videosCache?.find((video) => video.slug === slug);
  if (cachedVideos) {
    videoBySlugCache.set(slug, cachedVideos);
    return cachedVideos;
  }

  const existingPromise = videoBySlugPromise.get(slug);
  if (existingPromise) {
    return existingPromise;
  }

  const promise = api.get<VideoRecord>(`/videos/${slug}`).then((response) => {
    videoBySlugCache.set(slug, response.data);
    return response.data;
  }).finally(() => {
    videoBySlugPromise.delete(slug);
  });

  videoBySlugPromise.set(slug, promise);
  return promise;
};

export const clearClientVideoCache = () => {
  videosCache = null;
  videosPromise = null;
  videoCardsCache = null;
  videoCardsPromise = null;
  videoBySlugCache.clear();
  videoBySlugPromise.clear();
};
