import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { SESSION_HINT_COOKIE } from "@/lib/auth/session-hint";

const PROTECTED_PREFIXES = ["/dashboard", "/admin", "/onboarding"];
const AUTH_ROUTES = ["/login"];

/**
 * Optimistic-only check: the real session cookie is httpOnly and scoped to
 * the backend's origin, so it never reaches this server-side proxy (see
 * lib/auth/session-hint.ts for why). This only short-circuits the obvious
 * cases and unauthenticated/expired sessions still get caught by
 * ProtectedRoute (components/auth/protected-route.tsx) client-side, which
 * is backed by the real session check against the backend.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSessionHint = request.cookies.has(SESSION_HINT_COOKIE);

  const isProtectedRoute = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  if (isProtectedRoute && !hasSessionHint) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && hasSessionHint) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/onboarding/:path*", "/login"],
};
