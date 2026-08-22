/**
 * The real session lives in an httpOnly cookie the backend sets and the
 * browser attaches automatically — this app never reads or stores that
 * token. Because the backend is a separate origin, `proxy.ts` (running on
 * the Next.js server) can't see that cookie to redirect optimistically.
 *
 * `SESSION_HINT_COOKIE` is a non-sensitive, readable marker set on the
 * Next.js domain right after a successful login and cleared on logout,
 * purely so proxy can make a fast, optimistic "probably logged in"
 * redirect. It carries no identity or token data. The client-side
 * AuthProvider remains the source of truth: it always verifies the real
 * session with the backend and corrects course (clearing the hint) if the
 * backend disagrees.
 */
export const SESSION_HINT_COOKIE = "bk_session_hint";

const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days, matches typical session lifetime

export function setSessionHint(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_HINT_COOKIE}=1; path=/; max-age=${MAX_AGE_SECONDS}; samesite=lax`;
}

export function clearSessionHint(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_HINT_COOKIE}=; path=/; max-age=0; samesite=lax`;
}
