"use client";

import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";

import { useTenant } from "@/providers/tenant-provider";
import type { Permission } from "@/types/permission";

const PermissionsContext = createContext<Set<Permission> | null>(null);

/**
 * Sources capabilities from the current tenant membership
 * (Tenant.permissions). This is a UX layer only — it may hide or disable
 * controls, but it never replaces backend authorization, which re-checks
 * every request regardless of what this reports.
 *
 * Scope: these are TENANT-scoped capabilities tied to `currentTenant`
 * (F7) — they say nothing about PLATFORM-level (SUPER_ADMIN) capabilities.
 * `/admin` (F17) does not use this provider for access control; `Can`/
 * `useCan`/`can` should not be reused there to mean "is platform admin."
 */
export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { currentTenant } = useTenant();

  const permissions = useMemo(() => new Set(currentTenant?.permissions ?? []), [currentTenant]);

  return <PermissionsContext.Provider value={permissions}>{children}</PermissionsContext.Provider>;
}

/** Raw permission set, for bulk checks (e.g. filtering a nav list) where calling useCan() per item isn't valid. */
export function usePermissions(): Set<Permission> {
  const context = useContext(PermissionsContext);

  if (!context) {
    throw new Error("usePermissions must be used within a PermissionsProvider");
  }

  return context;
}

/** Pure capability check against an already-read permission set — usable outside a hook (e.g. array filters). */
export function can(permissions: Set<Permission>, permission: Permission): boolean {
  return permissions.has(permission);
}

/** Hook form of the capability check, e.g. `if (useCan("staff.create")) ...`. */
export function useCan(permission: Permission): boolean {
  return can(usePermissions(), permission);
}
