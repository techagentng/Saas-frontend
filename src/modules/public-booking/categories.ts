import type { PublicService } from "@/modules/public-booking/types";

/**
 * Grouping the public catalogue by category.
 *
 * The backend `PublicService` DTO now carries a real `category: string | null`
 * (Scheduling SC1, `internal/scheduling/handler/public_service_handler.go`) —
 * the tenant's own `ServiceCategory.Name`, or null for an uncategorised
 * service. This module is category-READY, not category-inventing:
 *   - it does NOT infer categories from service names
 *   - it does NOT hardcode production services into categories
 *   - it groups strictly by the field the backend actually sent
 *
 * A catalogue with no real category on any service (a pre-SC1 tenant, or one
 * that never organized its services) still falls back to a single
 * **"All Services"** group, so `ServiceCategoryTabs` and `ServiceCatalogue`
 * render sensibly either way with no branching in either component.
 */

export type ServiceCategory = {
  /** Stable, URL-safe id. `"all"` for the fallback group. */
  id: string;
  label: string;
  services: PublicService[];
};

export const ALL_SERVICES_CATEGORY_ID = "all";

export function groupServicesByCategory(services: PublicService[]): ServiceCategory[] {
  const hasRealCategories = services.some(
    (service) => typeof service.category === "string" && service.category.trim() !== ""
  );

  if (!hasRealCategories) {
    return [{ id: ALL_SERVICES_CATEGORY_ID, label: "All Services", services }];
  }

  const order: string[] = [];
  const grouped = new Map<string, PublicService[]>();
  for (const service of services) {
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
