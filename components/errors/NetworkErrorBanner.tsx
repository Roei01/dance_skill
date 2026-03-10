"use client";

import { useNetworkStatus } from "@/hooks/useNetworkStatus";

export const NetworkErrorBanner = () => {
  const { showBanner } = useNetworkStatus();

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 top-0 z-[100] border-b border-amber-200 bg-amber-50/95 px-4 py-3 text-center text-sm font-semibold text-amber-700 backdrop-blur">
      Connection problem. Please check your internet connection.
    </div>
  );
};
