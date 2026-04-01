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
import { clearClientVideoCache } from "@/lib/client-video-cache";

export type AuthUser = {
  id: string;
  username: string;
  email: string;
};

export type AuthAccess = {
  defaultVideo: boolean;
  videos: string[];
  videoOrder: string[];
};

type AuthContextValue = {
  user: AuthUser | null;
  access: AuthAccess;
  sessionExpiresAt: string | null;
  loading: boolean;
  errorCode?: string;
  refreshAuth: () => Promise<void>;
  setAuthState: (value: {
    user: AuthUser;
    access: AuthAccess;
    sessionExpiresAt?: string | null;
  }) => void;
  clearAuthState: () => void;
};

const defaultAccess: AuthAccess = {
  defaultVideo: false,
  videos: [],
  videoOrder: [],
};

const normalizeAccess = (access?: Partial<AuthAccess> | null): AuthAccess => ({
  defaultVideo: Boolean(access?.defaultVideo),
  videos: Array.isArray(access?.videos) ? access.videos : [],
  videoOrder: Array.isArray(access?.videoOrder)
    ? access.videoOrder
    : Array.isArray(access?.videos)
      ? access.videos
      : [],
});
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

const isPublicPathname = (pathname: string) => {
  if (publicPathnames.has(pathname)) {
    return true;
  }

  return pathname.startsWith("/video/");
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthSnapshot = {
  user: AuthUser | null;
  access: AuthAccess;
  sessionExpiresAt: string | null;
  errorCode?: string;
};

let authRequestPromise: Promise<void> | null = null;
let authSnapshot: AuthSnapshot | null = null;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [access, setAccess] = useState<AuthAccess>(defaultAccess);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorCode, setErrorCode] = useState<string | undefined>();

  const refreshAuth = useCallback(async () => {
    if (authRequestPromise) {
      await authRequestPromise;
      return;
    }

    setLoading(true);

    authRequestPromise = (async () => {
      try {
        const response = await api.get("/auth/me");
        const nextSnapshot: AuthSnapshot = {
          user: response.data.user,
          access: normalizeAccess(response.data.access),
          sessionExpiresAt: response.data.sessionExpiresAt ?? null,
          errorCode: undefined,
        };

        authSnapshot = nextSnapshot;
        setUser(nextSnapshot.user);
        setAccess(nextSnapshot.access);
        setSessionExpiresAt(nextSnapshot.sessionExpiresAt);
        setErrorCode(undefined);
      } catch (error) {
        const nextSnapshot: AuthSnapshot = {
          user: null,
          access: defaultAccess,
          sessionExpiresAt: null,
          errorCode: getApiErrorCode(error),
        };

        authSnapshot = nextSnapshot;
        setUser(null);
        setAccess(defaultAccess);
        setSessionExpiresAt(null);
        setErrorCode(nextSnapshot.errorCode);
      } finally {
        setLoading(false);
      }
    })();

    try {
      await authRequestPromise;
    } finally {
      authRequestPromise = null;
    }
  }, []);

  useEffect(() => {
    if (pathname && isPublicPathname(pathname)) {
      authSnapshot = null;
      setUser(null);
      setAccess(defaultAccess);
      setSessionExpiresAt(null);
      setErrorCode(undefined);
      setLoading(false);
      return;
    }

    if (authSnapshot && authSnapshot.user) {
      setUser(authSnapshot.user);
      setAccess(authSnapshot.access);
      setSessionExpiresAt(authSnapshot.sessionExpiresAt);
      setErrorCode(authSnapshot.errorCode);
      setLoading(false);
      return;
    }

    void refreshAuth();
  }, [pathname, refreshAuth]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      access,
      sessionExpiresAt,
      loading,
      errorCode,
      refreshAuth,
      setAuthState: ({
        user: nextUser,
        access: nextAccess,
        sessionExpiresAt: nextSessionExpiresAt,
      }) => {
        authSnapshot = {
          user: nextUser,
          access: normalizeAccess(nextAccess),
          sessionExpiresAt: nextSessionExpiresAt ?? null,
          errorCode: undefined,
        };
        setUser(nextUser);
        setAccess(normalizeAccess(nextAccess));
        setSessionExpiresAt(nextSessionExpiresAt ?? null);
        setErrorCode(undefined);
      },
      clearAuthState: () => {
        authSnapshot = null;
        clearClientVideoCache();
        setUser(null);
        setAccess(defaultAccess);
        setSessionExpiresAt(null);
      },
    }),
    [access, errorCode, loading, refreshAuth, sessionExpiresAt, user],
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
