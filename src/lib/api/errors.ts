import type { ApiErrorBody, ApiErrorCode } from "@/types/api";

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

/** Fallback codes used when the backend response doesn't match the structured error shape. */
export function fallbackErrorCode(status: number): ApiErrorCode {
  if (status === 401) return "UNAUTHENTICATED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status >= 500) return "INTERNAL_ERROR";
  return "UNKNOWN_ERROR";
}

/** Parses a failed Response into a structured ApiError, tolerating non-JSON or malformed bodies. */
export async function toApiError(response: Response): Promise<ApiError> {
  let body: Partial<ApiErrorBody> | undefined;

  try {
    body = await response.json();
  } catch {
    body = undefined;
  }

  const code = typeof body?.code === "string" ? body.code : fallbackErrorCode(response.status);
  const message =
    typeof body?.message === "string" && body.message.length > 0
      ? body.message
      : response.statusText || "Request failed";

  return new ApiError(response.status, {
    code,
    message,
    details: body?.details,
  });
}
