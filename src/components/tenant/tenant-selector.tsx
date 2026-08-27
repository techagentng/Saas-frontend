"use client";

import { useRouter } from "next/navigation";
import type { ChangeEvent } from "react";

import { useTenant } from "@/providers/tenant-provider";
import type { Tenant } from "@/types/tenant";

/** F4 — Setup-incomplete is the mandatory presentational addition; business_type is not shown (kept minimal). */
function tenantOptionLabel(tenant: Tenant): string {
  return tenant.onboarding_status === "COMPLETED" ? tenant.name : `${tenant.name} — Setup incomplete`;
}

/**
 * Reads/writes TenantProvider directly — switching tenants only updates
 * local selection state; the backend re-verifies membership on every
 * request, so this is never treated as an authorization decision.
 *
 * F4: selecting an incomplete tenant routes into its resume onboarding
 * page rather than leaving it sitting on a normal dashboard; selecting a
 * completed one routes to /dashboard — so the user is never left stranded
 * on a route belonging to whichever tenant was previously selected.
 */
export function TenantSelector() {
  const { availableTenants, currentTenant, setCurrentTenant, isTenantLoading } = useTenant();
  const router = useRouter();

  if (isTenantLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="h-9 w-36 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800"
      >
        <span className="sr-only">Loading workspaces…</span>
      </div>
    );
  }

  if (availableTenants.length === 0) {
    return <span className="text-sm text-slate-400 dark:text-slate-600">No workspace</span>;
  }

  if (availableTenants.length === 1) {
    return (
      <span className="hidden text-sm font-medium text-slate-700 sm:inline dark:text-slate-300">
        {tenantOptionLabel(availableTenants[0])}
      </span>
    );
  }

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const tenant = availableTenants.find((candidate) => candidate.id === event.target.value);
    if (!tenant) return;

    setCurrentTenant(tenant);
    router.push(tenant.onboarding_status === "COMPLETED" ? "/dashboard" : `/onboarding/${tenant.id}`);
  }

  return (
    <label className="flex items-center gap-2">
      <span className="sr-only">Current workspace</span>
      <select
        value={currentTenant?.id ?? ""}
        onChange={handleChange}
        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600"
      >
        {!currentTenant && (
          <option value="" disabled>
            Select workspace
          </option>
        )}
        {availableTenants.map((tenant) => (
          <option key={tenant.id} value={tenant.id}>
            {tenantOptionLabel(tenant)}
          </option>
        ))}
      </select>
    </label>
  );
}
