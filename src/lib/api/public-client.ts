import { getApiBaseUrl } from "@/lib/api/config";
import { toApiError } from "@/lib/api/errors";

/**
 * Anonymous GET against the backend's public API surface
 * (`/api/v1/public/...`).
 *
 * Deliberately separate from `lib/api/client.ts`'s `apiClient`: that helper
 * reads the in-memory access token, attaches `Authorization`, and on a 401
 * runs a refresh-and-retry cycle against the auth cookie. A customer booking
 * page must never depend on auth bootstrap — and must not be perturbed if an
 * owner happens to be signed in with an expired token in the same browser —
 * so this path touches no token and never retries.
 *
 * It still shares the two things that matter for consistency: the same base
 * URL (`getApiBaseUrl`) and the same `ApiError` normalization (`toApiError`),
 * so callers branch on `error.code` exactly as everywhere else in the app.
 * No credentials are sent: these routes are fully anonymous and set no cookie.
 */
export async function publicApiGet<T>(
  path: string,
  signal?: AbortSignal,
  query?: Record<string, string | undefined>
): Promise<T> {
  const url = new URL(`${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== "") url.searchParams.set(key, value);
    }
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: { Accept: "application/json" },
    signal,
  });

  if (!response.ok) {
    throw await toApiError(response);
  }

  return (await response.json()) as T;
}

/**
 * Anonymous POST against the public API surface (Scheduling S10 booking
 * creation). Same no-token / no-retry / same-`ApiError` contract as
 * `publicApiGet`. `body` is JSON-serialized; a customer's PII in that body is
 * sent over HTTPS to the backend and never persisted client-side.
 */
export async function publicApiPost<T>(
  path: string,
  body: unknown,
  signal?: AbortSignal
): Promise<T> {
  const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    throw await toApiError(response);
  }

  return (await response.json()) as T;
}
