import { getApiBaseUrl } from "@/lib/api/config";
import { toApiError } from "@/lib/api/errors";
import { clearTokens, getTokens, setTokens } from "@/lib/auth/token-store";

export type ApiRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** JSON-serializable request body. Omit for GET/DELETE requests without a payload. */
  body?: unknown;
  /** Query params appended to the URL; `undefined`/`null` values are skipped. */
  query?: Record<string, string | number | boolean | undefined | null>;
  headers?: HeadersInit;
  signal?: AbortSignal;
};

function buildUrl(path: string, query?: ApiRequestOptions["query"]): string {
  const url = new URL(`${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}

/**
 * Login never carries a token to attach in the first place, but is excluded
 * anyway for clarity: it must never trigger a refresh-and-retry cycle, even
 * in the edge case of calling login() again while a stale token is still
 * held in memory. /auth/refresh itself is not listed here — it's called
 * directly via performFetch (see refreshAccessToken), never through
 * apiRequest, so it structurally cannot re-enter this retry path.
 */
const NO_RETRY_PATHS = new Set(["/v1/auth/login"]);

async function performFetch(
  path: string,
  options: ApiRequestOptions,
  accessToken: string | null
): Promise<Response> {
  const { method = "GET", body, query, headers, signal } = options;

  return fetch(buildUrl(path, query), {
    method,
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });
}

type RefreshResponseBody = { access_token: string; refresh_token: string };

// Shared across all callers so concurrent 401s trigger exactly one refresh
// call — the backend rotates the refresh token on every use (confirmed in
// source), so two concurrent refresh attempts would have the second one
// fail with SESSION_REVOKED against the now-already-rotated-out token.
let refreshInFlight: Promise<string | null> | null = null;

/**
 * Attempts to exchange the current refresh token for a new access token.
 * Exported so AuthProvider.refresh() shares this exact single-flight
 * implementation rather than duplicating the HTTP call.
 */
export async function refreshAccessToken(): Promise<string | null> {
  const current = getTokens();
  if (!current) return null;

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const response = await performFetch(
          "/v1/auth/refresh",
          { method: "POST", body: { refresh_token: current.refreshToken } },
          null
        );

        if (!response.ok) {
          clearTokens();
          return null;
        }

        const result = (await response.json()) as RefreshResponseBody;
        setTokens({ accessToken: result.access_token, refreshToken: result.refresh_token });
        return result.access_token;
      } catch {
        clearTokens();
        return null;
      } finally {
        refreshInFlight = null;
      }
    })();
  }

  return refreshInFlight;
}

/**
 * Centralized JSON request helper. Attaches `Authorization: Bearer` when an
 * access token is currently held (harmless to attach on a public route —
 * it's simply ignored — and required on a protected one); on a 401 from a
 * request that had a token attached, refreshes once and retries the
 * original request once. If that retry also fails, or refresh itself
 * fails, the failure propagates as a normal ApiError — never an infinite
 * loop. Every non-2xx response is normalized into an `ApiError` (see
 * lib/api/errors.ts) so callers never parse status/message text themselves.
 */
export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const initialToken = getTokens()?.accessToken ?? null;
  let response = await performFetch(path, options, initialToken);

  if (response.status === 401 && initialToken && !NO_RETRY_PATHS.has(path)) {
    const refreshedToken = await refreshAccessToken();
    if (refreshedToken) {
      response = await performFetch(path, options, refreshedToken);
    }
  }

  if (!response.ok) {
    throw await toApiError(response);
  }

  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const apiClient = {
  get: <T>(path: string, options?: Omit<ApiRequestOptions, "method" | "body">) =>
    apiRequest<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, "method" | "body">) =>
    apiRequest<T>(path, { ...options, method: "POST", body }),
  put: <T>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, "method" | "body">) =>
    apiRequest<T>(path, { ...options, method: "PUT", body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, "method" | "body">) =>
    apiRequest<T>(path, { ...options, method: "PATCH", body }),
  delete: <T>(path: string, options?: Omit<ApiRequestOptions, "method" | "body">) =>
    apiRequest<T>(path, { ...options, method: "DELETE" }),
};
