"use client";

import { useQuery } from "@tanstack/react-query";

import { getTenantPermissions } from "@/modules/permissions/api";
import { permissionKeys } from "@/modules/permissions/keys";
import { useAuth } from "@/providers/auth-provider";

/**
 * Fetches the caller's own effective permissions for a tenant. Enabled
 * only once both authentication has resolved and a real tenant id is
 * present — never fires while unauthenticated, with no current tenant, or
 * with an empty/undefined id. Keyed per-tenant (permissionKeys.tenant), so
 * switching tenants queries a distinct cache entry rather than reusing a
 * stale one.
 */
export function useTenantPermissions(tenantId: string | undefined) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: permissionKeys.tenant(tenantId ?? ""),
    queryFn: ({ signal }) => getTenantPermissions(tenantId as string, signal),
    enabled: isAuthenticated && Boolean(tenantId),
  });
}
