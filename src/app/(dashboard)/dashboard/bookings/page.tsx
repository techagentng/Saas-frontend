"use client";

import { isSchedulingBusinessType } from "@/lib/tenant/scheduling";
import { useVerticalExperience } from "@/lib/vertical/use-vertical-experience";
import { useCan } from "@/providers/permissions-provider";
import { useTenant } from "@/providers/tenant-provider";

import { BookingList } from "./_components/booking-list";

/**
 * The owner booking-management page for the selected workspace (Scheduling
 * S11).
 *
 * Lives inside the existing `(dashboard)` route group, so it inherits
 * ProtectedRoute → TenantGate → DashboardShell unchanged — there is no second
 * shell, no second provider tree, and no route-level auth logic of its own.
 * Structured identically to `dashboard/services/page.tsx`: three gates,
 * checked in order, each with its own honest message rather than a redirect:
 *   no tenant resolved yet   → wait
 *   wrong vertical           → this workspace does not use bookings
 *   no `booking.read`        → no access
 * All three are UX only. The backend authorizes every request regardless.
 *
 * The heading and subtitle follow the tenant's vertical terminology
 * ("Appointments"/"technicians" for nail, generic terms elsewhere) via
 * `useVerticalExperience` — never hardcoded, matching `TeamPage`'s own
 * `vertical.team.plural` heading.
 */
export default function BookingsPage() {
  const { currentTenant, isTenantLoading } = useTenant();
  const canReadBookings = useCan("booking.read");
  const vertical = useVerticalExperience();
  const heading = vertical.terminology.bookings;

  if (isTenantLoading || !currentTenant) {
    return (
      <div role="status" aria-live="polite" className="py-16 text-center">
        <span className="text-sm text-slate-500 dark:text-slate-400">Loading…</span>
      </div>
    );
  }

  if (!isSchedulingBusinessType(currentTenant.business_type)) {
    return (
      <Shell heading={heading}>
        <p className="max-w-prose text-sm text-slate-600 dark:text-slate-400">
          This workspace doesn&apos;t use appointment bookings. Bookings are available for
          appointment-based businesses.
        </p>
      </Shell>
    );
  }

  if (!canReadBookings) {
    return (
      <Shell heading={heading}>
        <p className="max-w-prose text-sm text-slate-600 dark:text-slate-400">
          You don&apos;t have permission to view {heading.toLowerCase()} in this workspace.
        </p>
      </Shell>
    );
  }

  return (
    <Shell
      heading={heading}
      subtitle={`See who's booked in, filter by date or ${vertical.team.singular.toLowerCase()}, and cancel when needed.`}
    >
      {/* Forces a full remount — and therefore a full filter-state reset —
          the instant the workspace changes, exactly like
          `AddServiceBuilder`'s own `key={tenantId}`. See `BookingList`'s own
          doc comment. */}
      <BookingList key={currentTenant.id} tenantId={currentTenant.id} timezone={currentTenant.timezone} />
    </Shell>
  );
}

function Shell({
  heading,
  subtitle,
  children,
}: {
  heading: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-full max-w-4xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">{heading}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>}
      </header>
      {children}
    </div>
  );
}
