import type { ServiceListFilter } from "@/modules/services/types";

/**
 * Tenant-scoped query keys for the service catalog.
 *
 * Every key below carries the tenant id. A global `["services"]` key would let
 * Tenant A's catalog render while Tenant B is selected — one cache entry shared
 * by two workspaces — which is the same failure `permissionKeys.tenant` exists
 * to prevent. Switching workspaces therefore reads a distinct entry rather than
 * a stale one, and there is no code path that produces an unscoped key.
 *
 * `tenant(id)` is the invalidation handle: TanStack Query matches by prefix, so
 * invalidating it covers every list filter and every detail query for that one
 * workspace without touching another's cache.
 */
export const serviceKeys = {
  all: ["services"] as const,
  tenant: (tenantId: string) => [...serviceKeys.all, "tenant", tenantId] as const,
  list: (tenantId: string, filter: ServiceListFilter) =>
    [...serviceKeys.tenant(tenantId), "list", filter] as const,
  detail: (tenantId: string, serviceId: string) =>
    [...serviceKeys.tenant(tenantId), "detail", serviceId] as const,
};
