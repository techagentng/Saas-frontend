"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { ReactNode } from "react";

import { useTenant } from "@/providers/tenant-provider";

/**
 * Guards tenant-scoped routes (e.g. the dashboard): redirects to
 * onboarding once tenant data has loaded and the user has none. Withholds
 * `children` while that resolves, same flash-avoidance pattern as
 * ProtectedRoute.
 *
 * Until F3 (GET /v1/tenants) is wired up, `availableTenants` always
 * resolves to `[]` (see modules/tenant/api.ts), so this currently sends
 * every authenticated user to onboarding. That's expected today, not a
 * bug — it stops firing for anyone with at least one real tenant the
 * moment F3 lands, with no changes needed here.
 */
export function TenantGate({ children }: { children: ReactNode }) {
  const { availableTenants, isTenantLoading } = useTenant();
  const router = useRouter();
  const hasNoTenants = availableTenants.length === 0;

  useEffect(() => {
    if (!isTenantLoading && hasNoTenants) {
      router.replace("/onboarding");
    }
  }, [isTenantLoading, hasNoTenants, router]);

  if (isTenantLoading || hasNoTenants) {
    return (
      <div className="flex flex-1 items-center justify-center py-32" role="status" aria-live="polite">
        <span className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</span>
      </div>
    );
  }

  return <>{children}</>;
}
