"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import type { ReactNode } from "react";

import { useAuth } from "@/providers/auth-provider";

/**
 * Client-side gate for the (dashboard)/(platform) route groups. The
 * backend session cookie lives on a separate origin, so it isn't visible
 * to `proxy.ts` for a server-side redirect (see lib/auth/session-hint.ts)
 * — this component is the authoritative check, and withholds `children`
 * until it resolves so protected content never flashes before redirect.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const redirectParam = encodeURIComponent(pathname);
      router.replace(`/login?redirect=${redirectParam}`);
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex flex-1 items-center justify-center py-32" role="status" aria-live="polite">
        <span className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</span>
      </div>
    );
  }

  return <>{children}</>;
}
