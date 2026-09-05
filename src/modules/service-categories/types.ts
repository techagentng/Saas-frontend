/**
 * Frontend contract for the Scheduling SC1 tenant category surface, mirroring
 * the backend's `PublicServiceCategory` DTO field for field
 * (`internal/scheduling/handler/service_category_handler.go`).
 *
 * `tenant_id` is absent for the same reason it's absent from `Service`:
 * already the caller's own tenant, named in the route.
 */

/**
 * ACTIVE/ARCHIVED, the identical vocabulary `ServiceStatus` uses — a category
 * is a catalog entry, not an actor, so archiving hides it from grouping and
 * the public catalog without touching the services filed under it.
 */
export type ServiceCategoryStatus = "ACTIVE" | "ARCHIVED";

export type ServiceCategory = {
  id: string;
  name: string;
  /** Owner's display order. Ties break on name, mirroring the backend's own sort. */
  sort_order: number;
  status: ServiceCategoryStatus;
  created_at: string;
  updated_at: string;
};

/**
 * The `?status=` values `CategoryService.ParseCategoryStatusFilter` accepts,
 * identical to `ServiceListFilter`'s vocabulary. An omitted parameter means
 * ACTIVE; an unrecognized one is rejected with VALIDATION_FAILED.
 */
export type ServiceCategoryListFilter = "ACTIVE" | "ARCHIVED" | "ALL";
