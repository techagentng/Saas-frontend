import { isApiError } from "@/lib/api/errors";
import type { ApiErrorCode } from "@/types/api";

/**
 * Human copy for every backend error code the UI can realistically surface,
 * keyed by the stable `code` — never by parsing `message` text.
 *
 * These exist because the backend's own messages are written for API
 * consumers, not end users: they are terse ("The request failed validation.")
 * and identical across genuinely different causes. Anything not listed here
 * falls back to the backend's message, which is still far better than the
 * HTTP status text the client used to show.
 */
const MESSAGES: Partial<Record<ApiErrorCode, string>> = {
  // Identity / session
  INVALID_CREDENTIALS: "Incorrect email or password.",
  SESSION_EXPIRED: "Your session has expired. Please sign in again.",
  SESSION_REVOKED: "You've been signed out. Please sign in again.",
  UNAUTHENTICATED: "Please sign in to continue.",
  USER_ALREADY_EXISTS: "An account with this email already exists.",
  USER_NOT_FOUND: "We couldn't find that account.",

  // Authorization
  PERMISSION_DENIED: "You don't have permission to do that.",
  FORBIDDEN: "You don't have permission to do that.",
  TENANT_ACCESS_DENIED: "You don't have access to this workspace.",

  // Tenant identity
  TENANT_NOT_FOUND: "We couldn't find that workspace.",
  TENANT_SLUG_TAKEN: "That URL is already taken. Try a different one.",
  TENANT_SLUG_INVALID:
    "That URL isn't valid. Use lowercase letters, numbers, and hyphens only — and avoid reserved words like “admin” or “book”.",
  TENANT_MEMBERSHIP_ALREADY_EXISTS: "That person is already a member of this workspace.",

  // Roles
  ROLE_NOT_FOUND: "That role no longer exists.",
  ROLE_ALREADY_EXISTS: "That role already exists.",
  ROLE_ASSIGNMENT_ALREADY_EXISTS: "That role is already assigned.",
  PERMISSION_NOT_FOUND: "That permission no longer exists.",

  // Request shape
  INVALID_REQUEST: "Something in that request wasn't right. Please check and try again.",
  CONFLICT: "That conflicts with something that already exists.",
  NOT_FOUND: "We couldn't find what you were looking for.",

  // Infrastructure
  RATE_LIMITED: "Too many attempts. Please wait a moment and try again.",
  SERVICE_UNAVAILABLE: "The service is temporarily unavailable. Please try again shortly.",
  INTERNAL_ERROR: "Something went wrong on our end. Please try again.",
};

/**
 * Turns any thrown value into user-facing copy.
 *
 * `overrides` lets a screen give better, context-specific wording for a code
 * whose generic message is too vague there — most importantly
 * VALIDATION_FAILED, which the backend returns identically for every
 * rejected field, so only the calling screen knows which fields were even
 * submitted.
 */
export function apiErrorMessage(
  error: unknown,
  overrides?: Partial<Record<ApiErrorCode, string>>
): string {
  if (isApiError(error)) {
    const override = overrides?.[error.code];
    if (override) return override;

    const known = MESSAGES[error.code];
    if (known) return known;

    // Prefer the backend's own message over inventing one; it is at least
    // specific to what actually failed.
    if (error.message) return error.message;
  }

  // A thrown non-ApiError is almost always a network/CORS failure, since
  // apiRequest normalizes every HTTP error response into an ApiError.
  return "We couldn't reach the server. Check your connection and try again.";
}
