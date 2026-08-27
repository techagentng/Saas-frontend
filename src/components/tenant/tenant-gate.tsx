"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { ReactNode } from "react";

import { useTenant } from "@/providers/tenant-provider";

/**
 * Guards tenant-scoped routes (e.g. the dashboard). Onboarding state is a
 * property of the *tenant*, never the user (Vertical Onboarding F4) —
 * every branch below reads only `availableTenants`/`currentTenant`, never
 * anything user- or session-scoped. Withholds `children` while resolving,
 * same flash-avoidance pattern as ProtectedRoute.
 *
 * Decision table (see VERTICAL-ONBOARDING-DASHBOARD-IMPLEMENTATION-PLAN.md §9):
 *   loading                                    → wait, render nothing yet
 *   0 accessible tenants                       → /onboarding (today's create-tenant entry)
 *   currentTenant === null (ambiguous, 2+)      → render children; DashboardShell's
 *                                                 TenantSelector prompts an explicit pick —
 *                                                 this component never guesses
 *   currentTenant.onboarding_status !== COMPLETED → /onboarding/{currentTenant.id} (resume)
 *   currentTenant.onboarding_status === COMPLETED → render children (normal dashboard)
 *
 * A completed tenant is never hijacked by an incomplete one that happens to
 * exist elsewhere for the same user — this only ever looks at the single
 * already-resolved `currentTenant`, never scans for "any incomplete tenant."
 */
export function TenantGate({ children }: { children: ReactNode }) {
  const { availableTenants, currentTenant, isTenantLoading } = useTenant();
  const router = useRouter();

  const hasNoTenants = !isTenantLoading && availableTenants.length === 0;
  const needsResume =
    !isTenantLoading && currentTenant !== null && currentTenant.onboarding_status !== "COMPLETED";

  useEffect(() => {
    if (hasNoTenants) {
      router.replace("/onboarding");
    } else if (needsResume && currentTenant) {
      router.replace(`/onboarding/${currentTenant.id}`);
    }
  }, [hasNoTenants, needsResume, currentTenant, router]);

  if (isTenantLoading || hasNoTenants || needsResume) {
    return (
      <div className="flex flex-1 items-center justify-center py-32" role="status" aria-live="polite">
        <span className="text-sm text-slate-500 dark:text-slate-400">Loading…</span>
      </div>
    );
  }

  return <>{children}</>;
}
