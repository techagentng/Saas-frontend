"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useMemo } from "react";
import type { ReactNode } from "react";

import { clearSessionHint, setSessionHint } from "@/lib/auth/session-hint";
import * as authApi from "@/modules/auth/api";
import type { AuthState, AuthUser, LoginCredentials } from "@/types/auth";

const SESSION_QUERY_KEY = ["auth", "session"] as const;

type AuthContextValue = AuthState & {
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  logout: () => Promise<void>;
  /** Re-fetches the session from the backend, e.g. after an external 401. */
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const sessionQuery = useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: ({ signal }) => authApi.getCurrentUser(signal),
    // A 401 here just means "not logged in" — not worth retrying or surfacing as an error.
    retry: false,
    staleTime: 60 * 1000,
  });

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => authApi.login(credentials),
    onSuccess: (user) => {
      setSessionHint();
      queryClient.setQueryData(SESSION_QUERY_KEY, user);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      clearSessionHint();
      queryClient.setQueryData(SESSION_QUERY_KEY, null);
    },
  });

  const refresh = useCallback(async () => {
    await sessionQuery.refetch();
  }, [sessionQuery]);

  const user = sessionQuery.data ?? null;

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading: sessionQuery.isLoading,
      login: (credentials) => loginMutation.mutateAsync(credentials),
      logout: () => logoutMutation.mutateAsync(),
      refresh,
    }),
    [user, sessionQuery.isLoading, loginMutation, logoutMutation, refresh]
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
