import { apiClient } from "@/lib/api/client";
import type { AuthenticationResult, AuthUser, LoginCredentials } from "@/types/auth";

/**
 * `internal/identity/service.LoginInput` carries no `json` tags, so
 * encoding/json's default case-insensitive field matching accepts either
 * casing on decode — confirmed live against the running backend. Lowercase
 * is what the backend team's own API doc specifies, so that's canonical.
 */
type LoginRequestBody = { email: string; password: string };

/** POST /api/v1/auth/login — sets no cookie; the caller stores the returned tokens (see providers/auth-provider.tsx). */
export function login(credentials: LoginCredentials, signal?: AbortSignal): Promise<AuthenticationResult> {
  const body: LoginRequestBody = { email: credentials.email, password: credentials.password };
  return apiClient.post<AuthenticationResult>("/v1/auth/login", body, { signal });
}

/** POST /api/v1/auth/logout — revokes the session server-side; requires the Authorization header the central client already attaches. */
export function logout(signal?: AbortSignal): Promise<void> {
  return apiClient.post<void>("/v1/auth/logout", undefined, { signal });
}

/**
 * POST /api/v1/users — public registration. Returns the created user only;
 * no tokens. Callers must immediately follow with login() using the same
 * credentials (see providers/auth-provider.tsx's `register`).
 */
export function register(credentials: LoginCredentials, signal?: AbortSignal): Promise<AuthUser> {
  const body: LoginRequestBody = { email: credentials.email, password: credentials.password };
  return apiClient.post<AuthUser>("/v1/users", body, { signal });
}
