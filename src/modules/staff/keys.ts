import type { StaffListFilter } from "@/modules/staff/types";

/**
 * Tenant-scoped query keys for the staff roster, structured identically to
 * `serviceKeys` and for the same reason: a global `["staff"]` key would let
 * Tenant A's roster render while Tenant B is selected — one cache entry
 * shared by two workspaces.
 *
 * `tenant(id)` is the invalidation handle: TanStack Query matches by prefix,
 * so invalidating it covers every list filter, every detail query, and every
 * capability query for that one workspace without touching another's cache.
 */
export const staffKeys = {
  all: ["staff"] as const,
  tenant: (tenantId: string) => [...staffKeys.all, "tenant", tenantId] as const,
  list: (tenantId: string, filter: StaffListFilter) =>
    [...staffKeys.tenant(tenantId), "list", filter] as const,
  detail: (tenantId: string, staffId: string) =>
    [...staffKeys.tenant(tenantId), "detail", staffId] as const,
  capabilities: (tenantId: string, staffId: string) =>
    [...staffKeys.tenant(tenantId), "capabilities", staffId] as const,
};
