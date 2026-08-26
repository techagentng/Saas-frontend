"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { refreshAccessToken } from "@/lib/api/client";
import { clearTokens, setTokens, useTokens } from "@/lib/auth/token-store";
import * as authApi from "@/modules/auth/api";
import type { AuthState, AuthUser, LoginCredentials } from "@/types/auth";

type AuthContextValue = AuthState & {
  login: (credentials: LoginCredentials) => Promise<AuthUser | null>;
  /** Registers a new account, then immediately logs in with the same credentials — POST /v1/users returns no tokens on its own. */
  register: (credentials: LoginCredentials) => Promise<AuthUser | null>;
  logout: () => Promise<void>;
  /** Proactively refreshes the access token. Clears auth state if the refresh credential is no longer valid. */
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Auth state is an in-memory access token (lib/auth/token-store.ts) plus the
 * user it belongs to. Persistence across reloads comes from the backend's
 * HttpOnly `bk_refresh` cookie, which this code can never read — on startup
 * we simply ask the server to trade it for a fresh access token.
 *
 * `isLoading` therefore means something real now: it is `true` from first
 * paint until that startup exchange settles. Route guards MUST wait on it —
 * redirecting while it is still `true` would bounce a legitimately signed-in
 * user to /login on every reload, which is the exact defect this replaces.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const tokens = useTokens();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Masked (not reset via an effect) so tokens disappearing for any reason —
  // explicit logout, or the apiClient's background refresh force-clearing
  // them — instantly stops exposing a stale user, with no extra render.
  const effectiveUser = tokens ? user : null;

  // Startup session restoration. Runs exactly once per mount: if a valid
  // refresh cookie exists the session is rebuilt silently; if not, we settle
  // into a clean unauthenticated state. Either way `isRestoring` flips false
  // only once the answer is known, never before.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const restored = await refreshAccessToken();
        if (!cancelled && restored?.user) {
          setUser(restored.user);
        }
      } finally {
        if (!cancelled) setIsRestoring(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoggingIn(true);
    try {
      const result = await authApi.login(credentials);
      setTokens({ accessToken: result.access_token });
      setUser(result.user ?? null);
      return result.user ?? null;
    } finally {
      setIsLoggingIn(false);
    }
  }, []);

  const register = useCallback(async (credentials: LoginCredentials) => {
    setIsLoggingIn(true);
    try {
      await authApi.register(credentials);
      const result = await authApi.login(credentials);
      setTokens({ accessToken: result.access_token });
      setUser(result.user ?? null);
      return result.user ?? null;
    } finally {
      setIsLoggingIn(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      // Local state is cleared even if the network call failed: the user
      // asked to be signed out, so this device stops acting authenticated
      // regardless. The server-side revocation and cookie expiry are what
      // make it durable across a reload.
      clearTokens();
      setUser(null);
    }
  }, []);

  const refresh = useCallback(async () => {
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      setUser(null);
    } else if (refreshed.user) {
      setUser(refreshed.user);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: effectiveUser,
      isAuthenticated: Boolean(tokens),
      isLoading: isRestoring || isLoggingIn,
      login,
      register,
      logout,
      refresh,
    }),
    [effectiveUser, tokens, isRestoring, isLoggingIn, login, register, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
