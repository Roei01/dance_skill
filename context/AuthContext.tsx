"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { api, getApiErrorCode } from "@/lib/api-client";

export type AuthUser = {
  id: string;
  username: string;
  email: string;
};

export type AuthAccess = {
  defaultVideo: boolean;
  videos: string[];
};

type AuthContextValue = {
  user: AuthUser | null;
  access: AuthAccess;
  loading: boolean;
  errorCode?: string;
  refreshAuth: () => Promise<void>;
  setAuthState: (value: { user: AuthUser; access: AuthAccess }) => void;
  clearAuthState: () => void;
};

const defaultAccess: AuthAccess = {
  defaultVideo: false,
  videos: [],
};
const publicPathnames = new Set([
  "/",
  "/modern-dance",
  "/terms",
  "/accessibility",
  "/success",
  "/cancel",
  "/checkout",
  "/login",
]);

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [access, setAccess] = useState<AuthAccess>(defaultAccess);
  const [loading, setLoading] = useState(true);
  const [errorCode, setErrorCode] = useState<string | undefined>();

  const refreshAuth = useCallback(async () => {
    setLoading(true);

    try {
      const response = await api.get("/auth/me");
      setUser(response.data.user);
      setAccess(response.data.access ?? defaultAccess);
      setErrorCode(undefined);
    } catch (error) {
      setUser(null);
      setAccess(defaultAccess);
      setErrorCode(getApiErrorCode(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (pathname && publicPathnames.has(pathname)) {
      setUser(null);
      setAccess(defaultAccess);
      setErrorCode(undefined);
      setLoading(false);
      return;
    }

    void refreshAuth();
  }, [pathname, refreshAuth]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      access,
      loading,
      errorCode,
      refreshAuth,
      setAuthState: ({ user: nextUser, access: nextAccess }) => {
        setUser(nextUser);
        setAccess(nextAccess);
        setErrorCode(undefined);
      },
      clearAuthState: () => {
        setUser(null);
        setAccess(defaultAccess);
      },
    }),
    [access, errorCode, loading, refreshAuth, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
