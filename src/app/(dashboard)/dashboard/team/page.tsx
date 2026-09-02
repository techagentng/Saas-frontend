"use client";

import { useCan } from "@/providers/permissions-provider";
import { useTenant } from "@/providers/tenant-provider";

import { TeamRoster } from "./_components/team-roster";

/**
 * The staff roster for the selected workspace (Scheduling S3 — S4 UI).
 *
 * Lives inside the existing `(dashboard)` route group, so it inherits
 * ProtectedRoute → TenantGate → DashboardShell unchanged — there is no second
 * shell, no second provider tree, and no route-level auth logic of its own.
 * Structured identically to `dashboard/services/page.tsx`.
 *
 * Unlike Services, there is no vertical gate here: a staff roster is not
 * scoped to a business type on the backend (see `dashboard-nav.ts`), so every
 * workspace reaches this page once it has `staff.read` — only two gates,
 * checked in order, each with its own honest message:
 *   no tenant resolved yet   → wait
 *   no `staff.read`          → no access
 * Both are UX only. The backend authorizes every request regardless.
 */
export default function TeamPage() {
  const { currentTenant, isTenantLoading } = useTenant();
  const canReadStaff = useCan("staff.read");

  if (isTenantLoading || !currentTenant) {
    return (
      <div role="status" aria-live="polite" className="py-16 text-center">
        <span className="text-sm text-slate-500 dark:text-slate-400">Loading…</span>
      </div>
    );
  }

  if (!canReadStaff) {
    return (
      <Shell>
        <p className="max-w-prose text-sm text-slate-600 dark:text-slate-400">
          You don&apos;t have permission to view the team in this workspace.
        </p>
      </Shell>
    );
  }

  return (
    <Shell>
      <TeamRoster tenantId={currentTenant.id} />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full max-w-3xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Team</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Manage the people who provide services for your business.
        </p>
      </header>
      {children}
    </div>
  );
}
