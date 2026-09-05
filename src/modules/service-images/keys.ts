/**
 * Tenant- AND service-scoped query keys for the service-image gallery.
 *
 * `service(tenantId, serviceId)` is the invalidation handle every mutation
 * below uses: TanStack Query prefix-matches it, so one service's upload/
 * delete/reorder/set-cover never disturbs another service's — or another
 * tenant's — cached gallery. `tenant(tenantId)` exists one level up purely so
 * a tenant switch (or a future "clear everything for this workspace" need)
 * has a single prefix to reach every service's images at once.
 */
export const serviceImageKeys = {
  all: ["service-images"] as const,
  tenant: (tenantId: string) => [...serviceImageKeys.all, "tenant", tenantId] as const,
  service: (tenantId: string, serviceId: string) =>
    [...serviceImageKeys.tenant(tenantId), "service", serviceId] as const,
  list: (tenantId: string, serviceId: string) =>
    [...serviceImageKeys.service(tenantId, serviceId), "list"] as const,
};
