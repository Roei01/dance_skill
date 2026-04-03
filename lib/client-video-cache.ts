"use client";

import { api } from "@/lib/api-client";
import { type VideoCardRecord, type VideoRecord } from "@/lib/video-types";

let videosPromise: Promise<VideoRecord[]> | null = null;
let videoCardsPromise: Promise<VideoCardRecord[]> | null = null;
const videoBySlugPromise = new Map<string, Promise<VideoRecord>>();

export const getCachedVideoCards = async () => {
  if (!videoCardsPromise) {
    videoCardsPromise = api
      .get<VideoCardRecord[]>("/videos", { params: { view: "card" } })
      .then((response) => response.data)
      .finally(() => {
        videoCardsPromise = null;
      });
  }

  return videoCardsPromise;
};

export const getCachedVideos = async () => {
  if (!videosPromise) {
    videosPromise = api
      .get<VideoRecord[]>("/videos")
      .then((response) => response.data)
      .finally(() => {
        videosPromise = null;
      });
  }

  return videosPromise;
};

export const getCachedVideoBySlug = async (slug: string) => {
  const existingPromise = videoBySlugPromise.get(slug);
  if (existingPromise) {
    return existingPromise;
  }

  const promise = api
    .get<VideoRecord>(`/videos/${slug}`)
    .then((response) => response.data)
    .finally(() => {
      videoBySlugPromise.delete(slug);
    });

  videoBySlugPromise.set(slug, promise);
  return promise;
};

export const clearClientVideoCache = () => {
  videosPromise = null;
  videoCardsPromise = null;
  videoBySlugPromise.clear();
};
