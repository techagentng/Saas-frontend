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
  // Scheduling S8/S9/S10 public booking surface (internal/errors/codes.go).
  | "SERVICE_NOT_FOUND"
  | "STAFF_NOT_FOUND"
  | "BOOKING_SLOT_UNAVAILABLE"
  | "TENANT_SLUG_TAKEN"
  | "TENANT_SLUG_INVALID"
  | "USER_ALREADY_EXISTS"
  | "TENANT_MEMBERSHIP_ALREADY_EXISTS"
  | "ROLE_ALREADY_EXISTS"
  | "ROLE_NOT_FOUND"
  | "PERMISSION_NOT_FOUND"
  | "ROLE_ASSIGNMENT_ALREADY_EXISTS"
  | "OAUTH_STATE_INVALID"
  | "OAUTH_DENIED"
  | "OAUTH_EXCHANGE_FAILED"
  | "OAUTH_INVALID_IDENTITY_TOKEN"
  | "OAUTH_EMAIL_UNVERIFIED"
  | "EXTERNAL_IDENTITY_CONFLICT"
  | "RATE_LIMITED"
  | "SERVICE_UNAVAILABLE"
  | "INTERNAL_ERROR";

export type ApiErrorCode = KnownApiErrorCode | (string & {});
