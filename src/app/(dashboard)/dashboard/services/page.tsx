"use client";

import { CURRENCY_NAMES, isSupportedCurrency } from "@/lib/money/currency";
import { isSchedulingBusinessType } from "@/lib/tenant/scheduling";
import { useCan } from "@/providers/permissions-provider";
import { useTenant } from "@/providers/tenant-provider";

import { CurrencySetup } from "./_components/currency-setup";
import { ServiceCatalog } from "./_components/service-catalog";

/**
 * The service catalog for the selected workspace.
 *
 * Lives inside the existing `(dashboard)` route group, so it inherits
 * ProtectedRoute → TenantGate → DashboardShell unchanged — there is no second
 * shell, no second provider tree, and no route-level auth logic of its own.
 *
 * Three gates, checked in order, each with its own honest message rather than
 * a redirect that would leave the user wondering what happened:
 *   no tenant resolved yet   → wait
 *   wrong vertical           → this workspace does not use a service catalog
 *   no `service.read`        → no access
 * All three are UX only. The backend authorizes every request regardless.
 */
export default function ServicesPage() {
  const { currentTenant, isTenantLoading } = useTenant();
  const canReadServices = useCan("service.read");

  if (isTenantLoading || !currentTenant) {
    return (
      <div role="status" aria-live="polite" className="py-16 text-center">
        <span className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</span>
      </div>
    );
  }

  if (!isSchedulingBusinessType(currentTenant.business_type)) {
    return (
      <Shell>
        <p className="max-w-prose text-sm text-zinc-600 dark:text-zinc-400">
          This workspace doesn&apos;t use a bookable service catalog. Services are available for
          appointment-based businesses.
        </p>
      </Shell>
    );
  }

  if (!canReadServices) {
    return (
      <Shell>
        <p className="max-w-prose text-sm text-zinc-600 dark:text-zinc-400">
          You don&apos;t have permission to view services in this workspace.
        </p>
      </Shell>
    );
  }

  const { currency } = currentTenant;

  return (
    <Shell
      subtitle={
        currency
          ? `The treatments and services customers can book. Priced in ${currency}${
              isSupportedCurrency(currency) ? ` — ${CURRENCY_NAMES[currency]}` : ""
            }.`
          : "The treatments and services customers can book."
      }
    >
      {currency ? (
        <ServiceCatalog tenantId={currentTenant.id} currency={currency} />
      ) : (
        <CurrencySetup tenantId={currentTenant.id} />
      )}
    </Shell>
  );
}

function Shell({ subtitle, children }: { subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="flex w-full max-w-3xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Services</h1>
        {subtitle && <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{subtitle}</p>}
      </header>
      {children}
    </div>
  );
}
