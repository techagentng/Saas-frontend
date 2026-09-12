import type { BookingListFilter } from "@/modules/bookings/types";

/**
 * Tenant-scoped query keys for owner booking management (Scheduling S11).
 *
 * Every key carries the tenant id, matching `serviceKeys`/`staffKeys`: a
 * global `["bookings"]` key would let Tenant A's list render while Tenant B
 * is selected. `list` further keys on every filter that changes the actual
 * request (`view`, `staffId`, `serviceId`, `date`), so switching any one of
 * them reads a distinct cache entry rather than showing a stale result for
 * the previous combination.
 *
 * `tenant(id)` is the invalidation handle: TanStack matches by prefix, so
 * invalidating it covers every view/filter combination and every detail
 * query for that one workspace without touching another's cache.
 */
export const bookingKeys = {
  all: ["bookings"] as const,
  tenant: (tenantId: string) => [...bookingKeys.all, "tenant", tenantId] as const,
  list: (tenantId: string, filter: BookingListFilter) =>
    [
      ...bookingKeys.tenant(tenantId),
      "list",
      filter.view,
      filter.staffId ?? null,
      filter.serviceId ?? null,
      filter.date ?? null,
    ] as const,
  detail: (tenantId: string, bookingId: string) =>
    [...bookingKeys.tenant(tenantId), "detail", bookingId] as const,
};
