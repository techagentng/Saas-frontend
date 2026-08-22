import { apiClient } from "@/lib/api/client";
import type { AuthUser, LoginCredentials } from "@/types/auth";

/**
 * Assumed backend contract for Phase A infra (no real backend to confirm
 * against yet): POST /auth/login sets the session cookie and returns the
 * user; GET /auth/me returns the current session's user or 401; POST
 * /auth/logout clears the session cookie. Adjust paths/shapes once the
 * actual backend contract is available.
 */
export function login(credentials: LoginCredentials, signal?: AbortSignal): Promise<AuthUser> {
  return apiClient.post<AuthUser>("/auth/login", credentials, { signal });
}

export function logout(signal?: AbortSignal): Promise<void> {
  return apiClient.post<void>("/auth/logout", undefined, { signal });
}

export function getCurrentUser(signal?: AbortSignal): Promise<AuthUser> {
  return apiClient.get<AuthUser>("/auth/me", { signal });
}
