"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
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
 * There is no session/"current user" endpoint on the backend (confirmed: no
 * such route is registered), and tokens are memory-only by design (see
 * lib/auth/token-store.ts), so auth state is derived synchronously from
 * whether a token is currently held — there is no async "resolve the
 * session on boot" step the way a cookie-backed session would need. `user`
 * is only ever known immediately after a successful login() and is cleared
 * whenever tokens disappear for any reason (explicit logout, or the
 * apiClient's background refresh failing and force-clearing tokens).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const tokens = useTokens();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Masked (not reset via an effect) so tokens disappearing for any reason —
  // explicit logout, or the apiClient's background refresh force-clearing
  // them — instantly stops exposing a stale user, with no extra render.
  const effectiveUser = tokens ? user : null;

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoggingIn(true);
    try {
      const result = await authApi.login(credentials);
      setTokens({ accessToken: result.access_token, refreshToken: result.refresh_token });
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
      setTokens({ accessToken: result.access_token, refreshToken: result.refresh_token });
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
      clearTokens();
      setUser(null);
    }
  }, []);

  const refresh = useCallback(async () => {
    const refreshedToken = await refreshAccessToken();
    if (!refreshedToken) {
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: effectiveUser,
      isAuthenticated: Boolean(tokens),
      isLoading: isLoggingIn,
      login,
      register,
      logout,
      refresh,
    }),
    [effectiveUser, tokens, isLoggingIn, login, register, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function  useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
