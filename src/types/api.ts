/**
 * Structured error shape the backend is expected to return for non-2xx
 * JSON responses: `{ code, message, details? }`. Adapt this once the real
 * backend contract is confirmed; nothing in the app should parse
 * `message` text to make decisions — branch on `code` instead.
 */
export type ApiErrorBody = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
};

/**
 * Known machine-readable error codes. This union is intentionally not
 * exhaustive — unrecognized codes still flow through as `string` so the
 * client never throws on an unmapped code from the backend.
 */
export type KnownApiErrorCode =
  | "INVALID_CREDENTIALS"
  | "UNAUTHENTICATED"
  | "TENANT_NOT_FOUND"
  | "TENANT_SLUG_TAKEN"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "INTERNAL_ERROR";

export type ApiErrorCode = KnownApiErrorCode | (string & {});
