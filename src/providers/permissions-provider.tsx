"use client";

import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";

import { useTenantPermissions } from "@/modules/permissions/queries";
import { useTenant } from "@/providers/tenant-provider";
import type { Permission } from "@/types/permission";

const PermissionsContext = createContext<Set<Permission> | null>(null);

/**
 * Sources capabilities from the backend's effective-permissions endpoint
 * (GET /v1/tenants/{id}/permissions — Frontend Epic 01 F11), scoped to
 * `currentTenant` (F7). UX layer only — never replaces backend
 * authorization, which re-checks every request regardless of what this
 * reports.
 *
 * Fails closed by construction: the exposed set is empty — never a
 * previous tenant's data — whenever there's no current tenant, the query
 * hasn't resolved yet, or it resolved to an error (e.g. 403
 * TENANT_ACCESS_DENIED). Switching `currentTenant` changes the query key
 * (permissionKeys.tenant), so React Query treats it as a distinct cache
 * entry rather than reusing Tenant A's cached result while Tenant B's
 * loads.
 *
 * Scope: these are TENANT-scoped capabilities. They say nothing about
 * PLATFORM-level (SUPER_ADMIN) capabilities — `/admin` (F17) does not use
 * this provider for access control; `Can`/`useCan`/`can` should not be
 * reused there to mean "is platform admin."
 */
export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { currentTenant } = useTenant();
  const permissionsQuery = useTenantPermissions(currentTenant?.id);

  const permissions = useMemo(
    () => new Set(permissionsQuery.isSuccess ? permissionsQuery.data : []),
    [permissionsQuery.isSuccess, permissionsQuery.data]
  );

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
