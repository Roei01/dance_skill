"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { api, getApiErrorCode } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { AuthErrorCard } from "@/components/errors/AuthErrorCard";
import { BUSINESS_NAME } from "@/lib/business-info";
import { DEFAULT_VIDEO_ID } from "@/lib/catalog";
import { useRouter } from "next/navigation";

const CLOUDINARY_PLAYER_SRC =
  "https://player.cloudinary.com/embed/?cloud_name=ddcdws24e&public_id=9F67D997-37AB-423E-9BB1-D12FB8D53455_2_hh0lu8";

const MUX_PLAYER_SRC =
  "https://player.mux.com/pRI1RXjQ7NU9JU1j65JfJdPRWcHUzCZnOKwQIxa5WkQ";

const SESSION_IDLE_TIMEOUT_MS = 2 * 60 * 1000;
const HEARTBEAT_THROTTLE_MS = 30_000;

function WatchContent() {
  const { access, clearAuthState } = useAuth();
  const router = useRouter();
  const [authChecking, setAuthChecking] = useState(true);
  const [error, setError] = useState("");
  const [videoReady, setVideoReady] = useState(false);
  const hasLoggedOutRef = useRef(false);
  const lastActivityAtRef = useRef(Date.now());
  const lastHeartbeatAtRef = useRef(Date.now());

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

  useEffect(() => {
    const logoutForInactivity = (message?: string) => {
      if (hasLoggedOutRef.current) {
        return;
      }

      hasLoggedOutRef.current = true;
      clearAuthState();

      void api.post("/auth/logout").catch(() => {
        // Clear local auth state even if the request races with session expiry.
      });

      const search = new URLSearchParams();
      if (message) {
        search.set("message", message);
      }

      router.replace(search.size > 0 ? `/login?${search.toString()}` : "/login");
    };

    const sendHeartbeat = () => {
      lastHeartbeatAtRef.current = Date.now();

      void api.post("/auth/heartbeat").catch((heartbeatError: unknown) => {
        const code = getApiErrorCode(heartbeatError);
        if (code === "AUTH_REQUIRED" || code === "TOKEN_EXPIRED") {
          logoutForInactivity("פג תוקף ההתחברות. יש להתחבר מחדש.");
        }
      });
    };

    const recordActivity = () => {
      lastActivityAtRef.current = Date.now();

      if (Date.now() - lastHeartbeatAtRef.current >= HEARTBEAT_THROTTLE_MS) {
        sendHeartbeat();
      }
    };

    const activityEvents: Array<keyof WindowEventMap> = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "focus",
    ];

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, recordActivity, { passive: true });
    });

    const intervalId = window.setInterval(() => {
      if (Date.now() - lastActivityAtRef.current >= SESSION_IDLE_TIMEOUT_MS) {
        logoutForInactivity("נותקת אוטומטית עקב חוסר פעילות. יש להתחבר מחדש.");
      }
    }, 15_000);

    return () => {
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, recordActivity);
      });
      window.clearInterval(intervalId);
    };
  }, [clearAuthState, router]);

  useEffect(() => {
    const logoutOnExit = () => {
      if (hasLoggedOutRef.current) {
        return;
      }

      hasLoggedOutRef.current = true;

      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          "/api/auth/logout",
          new Blob([], { type: "application/json" }),
        );
        return;
      }

      void fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        keepalive: true,
        headers: {
          "Content-Type": "application/json",
        },
      });
    };

    window.addEventListener("pagehide", logoutOnExit);
    window.addEventListener("beforeunload", logoutOnExit);

    return () => {
      window.removeEventListener("pagehide", logoutOnExit);
      window.removeEventListener("beforeunload", logoutOnExit);
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
          <p className="text-sm font-semibold tracking-[0.16em] text-slate-500">
            {BUSINESS_NAME}
          </p>
          <p className="mt-2 text-base font-medium leading-7 text-slate-600 md:text-lg">
            בואו לרקוד איתי בכל מקום בכל זמן :)
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
            אהבת השם{" "}
          </h1>

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
                    src={MUX_PLAYER_SRC}
                    title="שיעור"
                    allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                    allowFullScreen
                    onLoad={() => setVideoReady(true)}
                  />{" "}
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
