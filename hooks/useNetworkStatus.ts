"use client";

import { useEffect, useState } from "react";

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [hasRecentApiFailure, setHasRecentApiFailure] = useState(false);

  useEffect(() => {
    setIsOnline(window.navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setHasRecentApiFailure(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    const handleApiFailure = () => {
      setHasRecentApiFailure(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("app:network-error", handleApiFailure);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("app:network-error", handleApiFailure);
    };
  }, []);

  return {
    isOnline,
    hasRecentApiFailure,
    showBanner: !isOnline || hasRecentApiFailure,
  };
};
