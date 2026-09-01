import { apiClient } from "@/lib/api/client";
import { getApiBaseUrl } from "@/lib/api/config";
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

/**
 * Absolute URL of the backend's Google sign-in start endpoint
 * (GET /api/v1/auth/google).
 *
 * This is a URL to NAVIGATE to, never one to fetch. OAuth is a chain of
 * top-level redirects - browser to backend, backend to Google, Google back to
 * the backend - and an XHR cannot follow that chain: the cross-origin redirect
 * to accounts.google.com would be blocked, and the HttpOnly session cookie the
 * callback sets would never be stored. Hence an ordinary anchor in the login
 * form rather than a click handler.
 *
 * Nothing secret travels here. The client secret lives only on the backend,
 * and even the client ID stays there - the browser never needs it, because the
 * backend, not this code, composes the Google authorization URL.
 *
 * `returnTo` is a hint, not a guarantee: the backend re-validates it as an
 * internal route and falls back to the normal post-login destination if it is
 * anything else, so a tampered value cannot become an open redirect.
 */
export function googleSignInUrl(returnTo?: string | null): string {
  const url = new URL(`${getApiBaseUrl()}/v1/auth/google`);

  if (returnTo) {
    url.searchParams.set("return_to", returnTo);
  }

  return url.toString();
}
