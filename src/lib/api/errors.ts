import type { ApiErrorBody, ApiErrorCode, ApiErrorEnvelope } from "@/types/api";

/**
 * Normalized error thrown by the API client for every failed request.
 * Callers branch on `code`/`status`, never on `message` text.
 */
export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly details?: Record<string, unknown>;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.name = "ApiError";
    this.status = status;
    this.code = body.code;
    this.details = body.details;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/** Fallback codes used only when the backend response carries no code of its own. */
export function fallbackErrorCode(status: number): ApiErrorCode {
  if (status === 400) return "INVALID_REQUEST";
  if (status === 401) return "UNAUTHENTICATED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status === 409) return "CONFLICT";
  if (status === 422) return "VALIDATION_FAILED";
  if (status === 429) return "RATE_LIMITED";
  if (status >= 500) return "INTERNAL_ERROR";
  return "UNKNOWN_ERROR";
}

/**
 * Parses a failed Response into a structured ApiError, tolerating non-JSON
 * or malformed bodies.
 *
 * The payload is read from `body.error` first — that is the backend's actual
 * envelope (internal/errors/http.go) — and only then from the top level, so
 * a differently-shaped or hand-rolled error response still parses. Reading
 * the top level alone was the bug behind users seeing HTTP status text like
 * "Conflict" instead of the real message.
 */
export async function toApiError(response: Response): Promise<ApiError> {
  let envelope: ApiErrorEnvelope | undefined;

  try {
    envelope = await response.json();
  } catch {
    envelope = undefined;
  }

  const payload: Partial<ApiErrorBody> | undefined =
    envelope && typeof envelope.error === "object" && envelope.error !== null
      ? envelope.error
      : envelope;

  const code = typeof payload?.code === "string" ? payload.code : fallbackErrorCode(response.status);
  const message =
    typeof payload?.message === "string" && payload.message.length > 0
      ? payload.message
      : response.statusText || "Request failed";

  return new ApiError(response.status, {
    code,
    message,
    details: payload?.details,
  });
}
