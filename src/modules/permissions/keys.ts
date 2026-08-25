/**
 * Tenant-scoped query keys for effective permissions. `tenant(id)` must
 * always include the tenant id — a single global `["permissions"]` key
 * would let Tenant A's cached permissions leak into Tenant B's UI when the
 * user switches workspaces, since both would share one cache entry.
 */
export const permissionKeys = {
  all: ["permissions"] as const,
  tenant: (tenantId: string) => [...permissionKeys.all, "tenant", tenantId] as const,
};
