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

  // Sign in with Google. Each of these reaches the UI as an `auth_error`
  // query parameter on /login after the backend callback redirects, rather
  // than as a JSON error - the OAuth flow is a chain of browser redirects, so
  // there is no response body to carry it.
  OAUTH_STATE_INVALID: "That sign-in link expired. Please try signing in with Google again.",
  OAUTH_DENIED: "Sign-in with Google was cancelled. You can try again or use your email and password.",
  OAUTH_EXCHANGE_FAILED: "We couldn't complete sign-in with Google. Please try again.",
  OAUTH_INVALID_IDENTITY_TOKEN: "We couldn't verify your Google account. Please try again.",
  OAUTH_EMAIL_UNVERIFIED:
    "Your Google email address isn't verified. Verify it with Google, or sign in with your email and password.",
  EXTERNAL_IDENTITY_CONFLICT: "That Google account is already linked to a different account.",

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
    const known = messageForCode(error.code, overrides);
    if (known) return known;

    // Prefer the backend's own message over inventing one; it is at least
    // specific to what actually failed.
    if (error.message) return error.message;
  }

  // A thrown non-ApiError is almost always a network/CORS failure, since
  // apiRequest normalizes every HTTP error response into an ApiError.
  return "We couldn't reach the server. Check your connection and try again.";
}

/**
 * Copy for a bare error code, with no thrown error to inspect.
 *
 * The Google OAuth callback reports failures by redirecting to
 * /login?auth_error=CODE, so the login page has a code and nothing else. This
 * shares the same table as apiErrorMessage rather than duplicating it, so the
 * wording for a code never diverges between the two paths. Returns undefined
 * for a code the table does not know, letting the caller decide on a fallback.
 */
export function messageForCode(
  code: ApiErrorCode,
  overrides?: Partial<Record<ApiErrorCode, string>>
): string | undefined {
  return overrides?.[code] ?? MESSAGES[code];
}
