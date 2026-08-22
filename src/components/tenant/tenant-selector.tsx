"use client";

import type { ChangeEvent } from "react";

import { useTenant } from "@/providers/tenant-provider";

/**
 * Reads/writes TenantProvider directly — switching tenants only updates
 * local selection state; the backend re-verifies membership on every
 * request, so this is never treated as an authorization decision.
 */
export function TenantSelector() {
  const { availableTenants, currentTenant, setCurrentTenant, isTenantLoading } = useTenant();

  if (isTenantLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="h-8 w-36 animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-900"
      >
        <span className="sr-only">Loading workspaces…</span>
      </div>
    );
  }

  if (availableTenants.length === 0) {
    return <span className="text-sm text-zinc-400 dark:text-zinc-600">No workspace</span>;
  }

  if (availableTenants.length === 1) {
    return (
      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {availableTenants[0].name}
      </span>
    );
  }

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const tenant = availableTenants.find((candidate) => candidate.id === event.target.value);
    setCurrentTenant(tenant ?? null);
  }

  return (
    <label className="flex items-center gap-2">
      <span className="sr-only">Current workspace</span>
      <select
        value={currentTenant?.id ?? ""}
        onChange={handleChange}
        className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
      >
        {!currentTenant && (
          <option value="" disabled>
            Select workspace
          </option>
        )}
        {availableTenants.map((tenant) => (
          <option key={tenant.id} value={tenant.id}>
            {tenant.name}
          </option>
        ))}
      </select>
    </label>
  );
}
