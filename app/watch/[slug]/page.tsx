"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AuthErrorCard } from "@/components/errors/AuthErrorCard";
import { BUSINESS_NAME } from "@/lib/business-info";
import { type VideoRecord } from "@/lib/video-types";
import { useProtectedSession } from "@/components/watch/useProtectedSession";
import { getCachedVideoBySlug } from "@/lib/client-video-cache";

type WatchVideoPageProps = {
  params: {
    slug: string;
  };
};

function WatchVideoContent({ slug }: { slug: string }) {
  const { access } = useAuth();
  const { loggingOut, handleManualLogout } = useProtectedSession();
  const [video, setVideo] = useState<VideoRecord | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    setVideoLoading(true);

    void getCachedVideoBySlug(slug)
      .then((response) => {
        if (!cancelled) {
          setVideo(response);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setVideo(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setVideoLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const hasAccess = useMemo(() => {
    return access.videos.includes(slug);
  }, [access.videos, slug]);

  if (!hasAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="w-full max-w-xl">
          <AuthErrorCard
            title="אין גישה"
            message="השיעור הזה לא זמין בחשבון שלך."
          />
        </div>
      </div>
    );
  }

  if (videoLoading) {
    return (
      <main className="min-h-screen overflow-hidden bg-[linear-gradient(135deg,#f8fbff_0%,#ffffff_45%,#fff5ef_100%)] pt-6 text-slate-900 sm:pt-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 ">
          <div className="mb-4">
            <div className="h-10 w-36 animate-pulse rounded-full bg-slate-200" />
          </div>
          <div className="rounded-[2rem] bg-white px-5 py-8 shadow-[0_30px_80px_rgba(15,23,42,0.12)] sm:px-8">
            <div className="space-y-3 text-center">
              <div className="mx-auto h-4 w-28 animate-pulse rounded bg-slate-200" />
              <div className="mx-auto h-5 w-36 animate-pulse rounded bg-slate-200" />
              <div className="mx-auto h-10 w-52 animate-pulse rounded bg-slate-200" />
            </div>
            <div className="mt-6 aspect-video animate-pulse rounded-[1.75rem] bg-slate-200" />
            <div className="mt-6 ml-auto max-w-xl space-y-3">
              <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-slate-100" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!video) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="w-full max-w-xl">
          <AuthErrorCard
            title="השיעור לא נמצא"
            message="לא הצלחנו לטעון את פרטי השיעור."
          />
        </div>
      </div>
    );
  }

  const watchDescription = video.watchDescription || video.description;

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-screen overflow-hidden bg-[linear-gradient(135deg,#f8fbff_0%,#ffffff_45%,#fff5ef_100%)] pt-6 text-slate-900 sm:pt-8"
    >
      <div className="mx-auto max-w-4xl px-2 sm:px-6 ">
        <div className="mb-4">
          <Link
            href="/watch"
            className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-white"
          >
            חזרה לספרייה שלי
          </Link>
        </div>
        <div className="rounded-[2rem] bg-white px-4 py-7 text-center shadow-[0_30px_80px_rgba(15,23,42,0.12)] sm:px-8 sm:py-8">
          <div className="text-center">
            <p className="text-sm font-semibold tracking-[0.16em] text-slate-500">
              {BUSINESS_NAME}
            </p>
            <p className="mt-2 text-base font-medium leading-7 text-slate-600 md:text-lg">
              בואו לרקוד איתי בכל מקום בכל זמן :)
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
              {video.title}
            </h1>
            <p className="mt-2 text-base font-medium leading-7 text-slate-600 md:text-lg">
              {video.level}
            </p>
          </div>

          <div className="mt-7 overflow-hidden rounded-[1.9rem] border-[4px] border-slate-300/90 bg-white p-2 shadow-[0_18px_45px_rgba(15,23,42,0.1)] sm:mt-8 sm:p-3">
            <div className="relative aspect-video overflow-hidden rounded-[1.5rem] bg-slate-950">
              {!videoReady ? (
                <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800" />
              ) : null}

              <iframe
                className="absolute inset-0 h-full w-full border-0"
                src={video.videoUrl}
                title={video.title}
                allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                allowFullScreen
                onLoad={() => setVideoReady(true)}
              />
            </div>
          </div>

          {video.classBreakdown.length > 0 ? (
            <div className="mt-6 flex w-full justify-end">
              <div
                dir="rtl"
                className="ml-auto space-y-2 text-right text-lg text-slate-700"
              >
                {video.classBreakdown.map((section) => (
                  <p
                    key={`${section.time}-${section.label}`}
                    className="text-right"
                  >
                    <span className="font-medium tabular-nums text-slate-500">
                      {section.time}
                    </span>{" "}
                    <span>{section.label}</span>
                  </p>
                ))}
              </div>
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
        </div>
      </div>
    </main>
  );
}

export default function WatchVideoPage({ params }: WatchVideoPageProps) {
  return (
    <ProtectedRoute>
      <WatchVideoContent slug={params.slug} />
    </ProtectedRoute>
  );
}
