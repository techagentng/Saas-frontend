"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import type { ReactNode } from "react";

import { useAuth } from "@/providers/auth-provider";

/**
 * Client-side gate for the (dashboard)/(platform) route groups. Auth is a
 * Bearer access token held only in memory (lib/auth/token-store.ts) — there
 * is no cookie or other server-readable artifact, so no Next.js middleware
 * can make this decision; this component is the sole and authoritative
 * check. `isAuthenticated`/`isLoading` are resolved synchronously (no
 * session endpoint to await), so this never flashes protected content
 * before redirecting.
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
