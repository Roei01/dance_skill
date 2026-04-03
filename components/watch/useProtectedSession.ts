"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getApiErrorCode } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";

export const useProtectedSession = () => {
  const router = useRouter();
  const { clearAuthState, sessionExpiresAt } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const isEndingSessionRef = useRef(false);
  const hasSentDisconnectRef = useRef(false);

  const redirectToLogin = useCallback(
    (message: string) => {
      clearAuthState();
      router.replace(`/login?message=${encodeURIComponent(message)}`);
    },
    [clearAuthState, router]
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
    [redirectToLogin]
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

  return {
    loggingOut,
    handleManualLogout,
  };
};
