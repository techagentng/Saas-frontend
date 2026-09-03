import type { PublicService } from "@/modules/public-booking/types";

/**
 * Grouping the public catalogue by category.
 *
 * The backend `PublicService` DTO has **no category field today** (verified
 * against `internal/scheduling/handler/public_service_handler.go` — it exposes
 * `id, name, description, duration_minutes, price_minor` only).
 *
 * This module is category-READY, not category-inventing:
 *   - it does NOT infer categories from service names
 *   - it does NOT hardcode production services into categories
 *   - it does NOT fabricate a category field
 *
 * Today it returns a single **"All Services"** group over the real data. The
 * moment the backend adds a `category` to that DTO (and to `PublicService`
 * here), `hasRealCategories` flips true and this starts producing real groups
 * — `ServiceCategoryTabs` and `ServiceCatalogue` need no change.
 *
 * Required backend follow-up: a tenant-managed `service.category` (see the
 * completion notes).
 */

export type ServiceCategory = {
  /** Stable, URL-safe id. `"all"` for the fallback group. */
  id: string;
  label: string;
  services: PublicService[];
};

export const ALL_SERVICES_CATEGORY_ID = "all";

/** The shape `PublicService` will take once the backend adds categories. */
type MaybeCategorised = PublicService & { category?: string | null };

export function groupServicesByCategory(services: PublicService[]): ServiceCategory[] {
  const list = services as MaybeCategorised[];
  const hasRealCategories = list.some(
    (service) => typeof service.category === "string" && service.category.trim() !== ""
  );

  if (!hasRealCategories) {
    return [{ id: ALL_SERVICES_CATEGORY_ID, label: "All Services", services }];
  }

  const order: string[] = [];
  const grouped = new Map<string, PublicService[]>();
  for (const service of list) {
    const label = service.category?.trim() || "Other";
    if (!grouped.has(label)) {
      grouped.set(label, []);
      order.push(label);
    }
    grouped.get(label)!.push(service);
  }
  return order.map((label) => ({ id: slugify(label), label, services: grouped.get(label)! }));
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "category"
  );
}
