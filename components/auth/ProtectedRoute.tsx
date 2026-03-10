"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import type { ReactNode } from "react";

const mapErrorCodeToMessage = (code?: string) => {
  switch (code) {
    case "TOKEN_EXPIRED":
      return "Your session expired. Please login again.";
    case "IP_MISMATCH":
      return "This account can only be accessed from the original device.";
    default:
      return "Please login to continue.";
  }
};

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const { user, loading, errorCode } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(
        `/login?message=${encodeURIComponent(mapErrorCodeToMessage(errorCode))}`
      );
    }
  }, [errorCode, loading, router, user]);

  if (loading || !user) {
    return <LoadingSpinner fullScreen label="Checking your access..." />;
  }

  return <>{children}</>;
};
