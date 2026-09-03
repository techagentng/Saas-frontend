/**
 * Query keys for the anonymous public booking surface (Scheduling S8).
 *
 * Deliberately keyed by SLUG, and deliberately disjoint from the
 * authenticated dashboard's tenant-id-scoped keys:
 *
 *   public:    ["public-tenant", slug]     ["public-services", slug]
 *   dashboard: ["tenant", tenantId]        ["services", "tenant", tenantId, ...]
 *
 * A customer never has a tenant id and an owner's dashboard never has a
 * public slug in its cache path, so the two data sets can never collide or
 * leak into one another's views — the same isolation rule `serviceKeys`
 * documents, applied across the public/private boundary.
 *
 * Both public keys share the slug, so the booking page and its "next step"
 * page read one cached catalog rather than fetching it twice.
 */
export const publicBookingKeys = {
  tenant: (slug: string) => ["public-tenant", slug] as const,
  services: (slug: string) => ["public-services", slug] as const,
  /** Technicians capable of one service (S9 step 2). */
  serviceStaff: (slug: string, serviceId: string) =>
    ["public-service-staff", slug, serviceId] as const,
  /**
   * Real slots for one service + technician + date (S9 step 3). Every
   * discriminating input is in the key, so changing the date or technician
   * reads a distinct cache entry and the query only fires once all are set.
   */
  availability: (slug: string, serviceId: string, staffId: string, date: string) =>
    ["public-availability", slug, serviceId, staffId, date] as const,
  /**
   * Prefix for every availability query of one business. After an S10 booking
   * succeeds (or loses a race) this is the invalidation handle: the booked
   * interval can shorten the slot list for any service that technician performs
   * that day, so one prefix invalidation covers them all — TanStack matches by
   * prefix.
   */
  availabilityForSlug: (slug: string) => ["public-availability", slug] as const,
};
