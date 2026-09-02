/**
 * Tenant-scoped query keys for staff working hours, structured identically
 * to `staffKeys` and for the same reason: a key that omitted the tenant id
 * would let Tenant A's schedule render while Tenant B is selected — one
 * cache entry shared by two workspaces.
 */
export const workingHoursKeys = {
  all: ["staff-working-hours"] as const,
  tenant: (tenantId: string) => [...workingHoursKeys.all, "tenant", tenantId] as const,
  detail: (tenantId: string, staffId: string) =>
    [...workingHoursKeys.tenant(tenantId), "staff", staffId] as const,
};
