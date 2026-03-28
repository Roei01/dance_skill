"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { api, getApiErrorCode } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AuthErrorCard } from "@/components/errors/AuthErrorCard";
import { BUSINESS_NAME } from "@/lib/business-info";

const MUX_PLAYER_SRC =
  "https://player.mux.com/pRI1RXjQ7NU9JU1j65JfJdPRWcHUzCZnOKwQIxa5WkQ";

function WatchContent() {
  const router = useRouter();
  const { clearAuthState, sessionExpiresAt } = useAuth();
  const [videoReady, setVideoReady] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const isEndingSessionRef = useRef(false);
  const hasSentDisconnectRef = useRef(false);

  const redirectToLogin = useCallback(
    (message: string) => {
      clearAuthState();
      router.replace(`/login?message=${encodeURIComponent(message)}`);
    },
    [clearAuthState, router],
  );

  const finishSession = useCallback(
    async (message: string) => {
      if (isEndingSessionRef.current) {
        return;
      }

      isEndingSessionRef.current = true;

      try {
        await api.post("/auth/logout");
      } catch {
        // Clear local auth state even if the request fails.
      }

      redirectToLogin(message);
    },
    [redirectToLogin],
  );

  const handleManualLogout = useCallback(async () => {
    setLoggingOut(true);
    await finishSession("התנתקת מהמערכת. יש להתחבר מחדש.");
  }, [finishSession]);

  useEffect(() => {
    const notifySessionDisconnect = () => {
      if (isEndingSessionRef.current || hasSentDisconnectRef.current) {
        return;
      }

      hasSentDisconnectRef.current = true;

      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/auth/disconnect", new Blob());
        return;
      }

      void fetch("/api/auth/disconnect", {
        method: "POST",
        credentials: "include",
        keepalive: true,
      });
    };

    window.addEventListener("pagehide", notifySessionDisconnect);
    window.addEventListener("beforeunload", notifySessionDisconnect);

    return () => {
      window.removeEventListener("pagehide", notifySessionDisconnect);
      window.removeEventListener("beforeunload", notifySessionDisconnect);
    };
  }, []);

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

  useEffect(() => {
    if (!sessionExpiresAt) {
      return;
    }

    const remainingMs = new Date(sessionExpiresAt).getTime() - Date.now();

    if (remainingMs <= 0) {
      void finishSession("פג תוקף ההתחברות לאחר 3 שעות. יש להתחבר מחדש.");
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void finishSession("פג תוקף ההתחברות לאחר 3 שעות. יש להתחבר מחדש.");
    }, remainingMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [finishSession, sessionExpiresAt]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void api.post("/auth/heartbeat").catch((error: unknown) => {
        const code = getApiErrorCode(error);

        if (code === "TOKEN_EXPIRED" || code === "AUTH_REQUIRED") {
          void finishSession("פג תוקף ההתחברות. יש להתחבר מחדש.");
        }
      });
    }, 60_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [finishSession]);

  const classBreakdown = useMemo(
    () => [
      { time: "18:10", label: "קצב איטי" },
      { time: "19:10", label: "קצב רגיל" },
      { time: "19:55", label: "מלא עם מוזיקה" },
    ],
    [],
  );

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-screen overflow-hidden bg-[linear-gradient(135deg,#f8fbff_0%,#ffffff_45%,#fff5ef_100%)] pt-6 text-slate-900 sm:pt-8"
    >
      <div className="mx-auto max-w-4xl px-4 sm:px-6 ">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="rounded-[2rem] bg-white px-5 py-8 text-center shadow-[0_30px_80px_rgba(15,23,42,0.12)] sm:px-8"
        >
          <div className="text-center">
            <p className="text-sm font-semibold tracking-[0.16em] text-slate-500">
              {BUSINESS_NAME}
            </p>
            <p className="mt-2 text-base font-medium leading-7 text-slate-600 md:text-lg">
              בואו לרקוד איתי בכל מקום בכל זמן :)
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
              אהבת השם
            </h1>
          </div>

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
                src={MUX_PLAYER_SRC}
                title="שיעור"
                allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                allowFullScreen
                onLoad={() => setVideoReady(true)}
              />
            </div>
          </motion.div>

          <div className="mt-6 flex w-full justify-end">
            <div
              dir="rtl"
              className="ml-auto space-y-2 text-right text-lg text-slate-700"
            >
              {classBreakdown.map((section) => (
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
