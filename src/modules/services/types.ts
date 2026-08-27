/**
 * Frontend contract for the Scheduling S1 service catalog, mirroring the
 * backend's `PublicService` DTO field for field
 * (`internal/scheduling/handler/service_handler.go`).
 *
 * Two fields are absent from that DTO on purpose, and are therefore absent
 * here rather than invented: `tenant_id` (already the caller's own tenant,
 * named in the route) and `currency` (a property of the tenant, which the
 * client already holds — repeating it per row would be duplicated state that
 * could appear to disagree with its source).
 */

/**
 * ARCHIVED rather than the DISABLED used by tenants/users/memberships: in the
 * backend's vocabulary DISABLED means "an actor is barred from acting", and a
 * catalog entry is not an actor. Constrained by the `services_status_valid`
 * CHECK, so these two values are exhaustive.
 */
export type ServiceStatus = "ACTIVE" | "ARCHIVED";

export type Service = {
  id: string;
  name: string;
  /** Null when never supplied; an empty string is a distinct, legitimate state ("no description"). */
  description: string | null;
  duration_minutes: number;
  /** Integer minor units. Never converted to a float — see `lib/money/money.ts`. */
  price_minor: number;
  status: ServiceStatus;
  created_at: string;
  updated_at: string;
};

/**
 * The `?status=` values `CatalogService.ParseStatusFilter` accepts. An omitted
 * parameter means ACTIVE; an unrecognized one is rejected with
 * VALIDATION_FAILED rather than silently defaulting, so this union must stay
 * exact.
 */
export type ServiceListFilter = "ACTIVE" | "ARCHIVED" | "ALL";
