"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AuthErrorCard } from "@/components/errors/AuthErrorCard";
import { BUSINESS_NAME } from "@/lib/business-info";
import { type VideoRecord } from "@/lib/video-types";
import { useProtectedSession } from "@/components/watch/useProtectedSession";
import { getCachedVideos } from "@/lib/client-video-cache";

function WatchContent() {
  const { access } = useAuth();
  const { loggingOut, handleManualLogout } = useProtectedSession();
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [videosLoading, setVideosLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    setVideosLoading(true);

    void getCachedVideos()
      .then((response) => {
        if (!cancelled) {
          setVideos(response);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setVideos([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setVideosLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const ownedVideos = useMemo(() => {
    const owned = new Set(access.videos);
    const orderIndex = new Map(
      access.videoOrder.map((slug, index) => [slug, index] as const),
    );

    return videos
      .filter((video) => owned.has(video.slug))
      .sort((a, b) => {
        const aOrder = orderIndex.get(a.slug) ?? Number.MAX_SAFE_INTEGER;
        const bOrder = orderIndex.get(b.slug) ?? Number.MAX_SAFE_INTEGER;
        return aOrder - bOrder;
      });
  }, [access.videoOrder, access.videos, videos]);

  useEffect(() => {
    if (activeFilter === "all") {
      return;
    }

    if (!ownedVideos.some((video) => video.slug === activeFilter)) {
      setActiveFilter("all");
    }
  }, [activeFilter, ownedVideos]);

  const filteredVideos = useMemo(() => {
    if (activeFilter === "all") {
      return ownedVideos;
    }

    return ownedVideos.filter((video) => video.slug === activeFilter);
  }, [activeFilter, ownedVideos]);

  const activeFilterLabel = useMemo(() => {
    if (activeFilter === "all") {
      return "כל השיעורים";
    }

    return (
      ownedVideos.find((video) => video.slug === activeFilter)?.title ??
      "כל השיעורים"
    );
  }, [activeFilter, ownedVideos]);

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-screen overflow-hidden bg-[linear-gradient(135deg,#f8fbff_0%,#ffffff_45%,#fff5ef_100%)] pt-6 text-slate-900 sm:pt-8"
    >
      <div className="mx-auto max-w-4xl px-2 sm:px-6 ">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="rounded-[2rem] bg-white px-5 py-8 shadow-[0_30px_80px_rgba(15,23,42,0.12)] sm:px-8"
        >
          <div className="text-center">
            <p className="text-sm font-semibold tracking-[0.16em] text-slate-500">
              {BUSINESS_NAME}
            </p>
            <p className="mt-2 text-base font-medium leading-7 text-slate-600 md:text-lg">
              כאן מחכים לך כל השיעורים שכבר רכשת.
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
              השיעורים שלי
            </h1>
          </div>

          {!videosLoading && ownedVideos.length > 0 ? (
            <div className="mt-5 rounded-[1.25rem] border border-slate-200/80 bg-slate-50/70 p-2 shadow-sm">
              <button
                type="button"
                onClick={() => setFiltersOpen((current) => !current)}
                className="flex w-full items-center justify-between rounded-[1rem] bg-white px-3 py-2.5 text-right transition hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white shadow-sm">
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className="text-[11px] font-bold tracking-[0.12em] text-slate-500">
                      סינון שיעורים
                    </p>
                    <p className="text-sm font-semibold text-slate-900">
                      {activeFilterLabel}
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full border border-slate-200 p-1.5 text-slate-500 transition ${
                    filtersOpen ? "rotate-180 bg-slate-100" : "bg-white"
                  }`}
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </span>
              </button>

              {filtersOpen ? (
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveFilter("all");
                      setFiltersOpen(false);
                    }}
                    className={`w-full rounded-[0.95rem] border px-3 py-2.5 text-sm font-semibold transition ${
                      activeFilter === "all"
                        ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    כל השיעורים
                  </button>
                  {ownedVideos.map((video) => (
                    <button
                      key={video.slug}
                      type="button"
                      onClick={() => {
                        setActiveFilter(video.slug);
                        setFiltersOpen(false);
                      }}
                      className={`w-full rounded-[0.95rem] border px-3 py-2.5 text-sm font-semibold transition ${
                        activeFilter === video.slug
                          ? "border-slate-600 bg-slate-600 text-white shadow-sm"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-100"
                      }`}
                    >
                      {video.title}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {videosLoading ? (
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {Array.from({ length: Math.max(access.videos.length, 1) }).map(
                (_, index) => (
                  <div
                    key={index}
                    className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-50 shadow-sm"
                  >
                    <div className="aspect-[16/10] animate-pulse bg-slate-200" />
                    <div className="space-y-3 px-5 py-4">
                      <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                      <div className="h-7 w-40 animate-pulse rounded bg-slate-200" />
                      <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                      <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
                    </div>
                  </div>
                ),
              )}
            </div>
          ) : (
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {filteredVideos.map((video) => (
                <Link
                  key={video.id}
                  href={`/watch/${video.slug}`}
                  className="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-50 text-right shadow-sm transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
                >
                  <div className="overflow-hidden rounded-b-[1.3rem] rounded-t-[1.4rem] bg-[linear-gradient(180deg,#f7f9fc_0%,#eef4ff_70%)] p-3">
                    <div className="aspect-[4/5] relative overflow-hidden rounded-[1.2rem]">
                      {/* רקע מטושטש */}
                      <video
                        className="absolute inset-0 w-full h-full object-cover blur-xl scale-110"
                        src={video.previewUrl}
                        muted
                        autoPlay
                        loop
                      />

                      {/* וידאו אמיתי */}
                      <video
                        className="relative w-full h-full object-contain"
                        src={video.previewUrl}
                        muted
                        autoPlay
                        loop
                      />
                    </div>{" "}
                  </div>
                  <div className="space-y-2 px-5 py-4">
                    <p className="text-sm font-semibold tracking-[0.16em] text-slate-500">
                      {video.level}
                    </p>
                    <h2 className="text-2xl font-black tracking-tight text-slate-900">
                      {video.title}
                    </h2>
                    <p className="text-sm leading-6 text-slate-600">
                      {video.description}
                    </p>
                    <p className="font-display text-sm font-bold uppercase tracking-[0.14em] text-emerald-600">
                      זמין לצפייה
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {!videosLoading && !filteredVideos.length ? (
            <div className="mt-8 rounded-[1.75rem] border border-slate-200 bg-slate-50 px-6 py-8 text-center">
              <p className="text-lg font-semibold text-slate-700">
                לא נמצאו שיעורים עבור הסינון שבחרת.
              </p>
            </div>
          ) : null}

          <div dir="ltr" className="mt-8 flex justify-start">
            <button
              type="button"
              onClick={() => void handleManualLogout()}
              disabled={loggingOut}
              className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(5,150,105,0.22)] transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loggingOut ? "מתנתק" : "התנתקות"}
            </button>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

export default function Watch() {
  const { access } = useAuth();

  return (
    <ProtectedRoute>
      {access.videos.length > 0 ? (
        <WatchContent />
      ) : (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
          <div className="w-full max-w-xl">
            <AuthErrorCard
              title="אין גישה"
              message="כדי לצפות בשיעור הזה צריך להשלים רכישה."
            />
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
