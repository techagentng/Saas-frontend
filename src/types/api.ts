/**
 * The error payload itself. Nothing in the app should parse `message` text
 * to make decisions — branch on `code` instead.
 */
export type ApiErrorBody = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
};

/**
 * The real wire shape: the backend nests the payload under `error`
 * (confirmed against internal/errors/http.go's WriteJSON, which encodes
 * `{"error": {"code", "message"}}`). Reading `code`/`message` off the top
 * level silently yielded `undefined` for both, so every branch on
 * `error.code` fell through and users saw raw HTTP status text — "Conflict"
 * instead of "That URL is already taken."
 */
export type ApiErrorEnvelope = {
  error?: Partial<ApiErrorBody>;
} & Partial<ApiErrorBody>;

/**
 * Machine-readable error codes, matching internal/errors/codes.go in the
 * Go monolith exactly (confirmed against source, not guessed). Still not
 * treated as exhaustive at the type level — unrecognized codes flow
 * through as `string` (see ApiErrorCode) so the client never throws on a
 * code this union hasn't caught up with yet.
 */
export type KnownApiErrorCode =
  | "VALIDATION_FAILED"
  | "INVALID_REQUEST"
  | "INVALID_CREDENTIALS"
  | "SESSION_EXPIRED"
  | "SESSION_REVOKED"
  | "PERMISSION_DENIED"
  | "TENANT_ACCESS_DENIED"
  | "RESOURCE_NOT_FOUND"
  | "USER_NOT_FOUND"
  | "TENANT_NOT_FOUND"
  | "TENANT_SLUG_TAKEN"
  | "TENANT_SLUG_INVALID"
  | "USER_ALREADY_EXISTS"
  | "TENANT_MEMBERSHIP_ALREADY_EXISTS"
  | "ROLE_ALREADY_EXISTS"
  | "ROLE_NOT_FOUND"
  | "PERMISSION_NOT_FOUND"
  | "ROLE_ASSIGNMENT_ALREADY_EXISTS"
  | "RATE_LIMITED"
  | "SERVICE_UNAVAILABLE"
  | "INTERNAL_ERROR";

export type ApiErrorCode = KnownApiErrorCode | (string & {});
