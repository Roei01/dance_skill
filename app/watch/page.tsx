"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { api, getApiErrorCode } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { AuthErrorCard } from "@/components/errors/AuthErrorCard";
import { BUSINESS_NAME } from "@/lib/business-info";
import { DEFAULT_VIDEO_ID } from "@/lib/catalog";

const CLOUDINARY_PLAYER_SRC =
  "https://player.cloudinary.com/embed/?cloud_name=ddcdws24e&public_id=9F67D997-37AB-423E-9BB1-D12FB8D53455_2_hh0lu8";

function WatchContent() {
  const { access } = useAuth();
  const [authChecking, setAuthChecking] = useState(true);
  const [error, setError] = useState("");
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        await api.get(`/video/access/${DEFAULT_VIDEO_ID}`);
      } catch (error: unknown) {
        const code = getApiErrorCode(error);

        if (code === "PURCHASE_REQUIRED") {
          setError("הגישה נדחתה. כדי לצפות בשיעור צריך להשלים רכישה.");
        } else if (code === "TOKEN_EXPIRED") {
          setError("פג תוקף ההתחברות. יש להתחבר מחדש.");
        } else {
          setError("הגישה נדחתה. כדי לצפות בשיעור צריך להשלים רכישה.");
        }
      } finally {
        setAuthChecking(false);
      }
    };

    if (!access.defaultVideo) {
      setAuthChecking(false);
      return;
    }

    void checkAccess();
  }, [access.defaultVideo]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if ((event.ctrlKey || event.metaKey) && (key === "s" || key === "p")) {
        event.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const classBreakdown = useMemo(
    () => [
      { time: "18:10", label: "קצב איטי" },
      { time: "19:10", label: "קצב רגיל" },
      { time: "19:55", label: "מלא עם מוזיקה" },
    ],
    [],
  );

  if (authChecking) {
    return <LoadingSpinner fullScreen label="בודקים את הגישה שלך לשיעור..." />;
  }

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-screen overflow-hidden bg-[linear-gradient(135deg,#f8fbff_0%,#ffffff_45%,#fff5ef_100%)] text-slate-900"
    >
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="rounded-[2rem] bg-white px-5 py-8 text-center shadow-[0_30px_80px_rgba(15,23,42,0.12)] sm:px-8"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
            {BUSINESS_NAME}
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
            שיעור מלא לצפייה
          </h1>
          <p className="mt-2 text-base font-medium leading-7 text-slate-600 md:text-lg">
            בואו לרקוד איתי בכל מקום בכל זמן :)
          </p>

          {error ? (
            <div className="mt-8">
              <AuthErrorCard title="אין גישה" message={error} />
            </div>
          ) : (
            <>
              <motion.div
                initial={{ scale: 0.98, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="mt-6 overflow-hidden rounded-[1.75rem] border-[5px] border-slate-500 bg-white p-2 shadow-inner"
              >
                <div className="relative aspect-video overflow-hidden rounded-[1.35rem] bg-slate-950">
                  {!videoReady ? (
                    <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800" />
                  ) : null}
                  <iframe
                    className="absolute inset-0 h-full w-full border-0"
                    src={CLOUDINARY_PLAYER_SRC}
                    title="שיעור אהבת השם"
                    allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                    allowFullScreen
                    onLoad={() => setVideoReady(true)}
                  />
                </div>
              </motion.div>

              <div className="mt-6 flex justify-end">
                <div className="space-y-2 text-right text-lg text-slate-700">
                  {classBreakdown.map((section) => (
                    <div
                      key={`${section.time}-${section.label}`}
                      className="flex items-center justify-end gap-2"
                    >
                      <span>{section.label}</span>
                      <span className="font-medium text-slate-500">
                        {section.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </main>
  );
}

export default function Watch() {
  const { access } = useAuth();

  return (
    <ProtectedRoute>
      {access.defaultVideo ? (
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
