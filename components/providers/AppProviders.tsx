"use client";

import type { ReactNode } from "react";
import { NetworkErrorBanner } from "@/components/errors/NetworkErrorBanner";
import { AuthProvider } from "@/context/AuthContext";

export const AppProviders = ({ children }: { children: ReactNode }) => {
  return (
    <AuthProvider>
      <NetworkErrorBanner />
      {children}
    </AuthProvider>
  );
};
