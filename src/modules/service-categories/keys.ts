import type { ServiceCategoryListFilter } from "@/modules/service-categories/types";

/**
 * Tenant-scoped query keys for the SC1 category surface, following the exact
 * shape `serviceKeys` uses and for the identical reason: a global
 * `["service-categories"]` key would let Tenant A's categories render while
 * Tenant B is selected. `tenant(id)` is the invalidation handle TanStack
 * Query prefix-matches against, covering every list filter and detail query
 * for one workspace without touching another's cache.
 */
export const serviceCategoryKeys = {
  all: ["service-categories"] as const,
  tenant: (tenantId: string) => [...serviceCategoryKeys.all, "tenant", tenantId] as const,
  list: (tenantId: string, filter: ServiceCategoryListFilter) =>
    [...serviceCategoryKeys.tenant(tenantId), "list", filter] as const,
  detail: (tenantId: string, categoryId: string) =>
    [...serviceCategoryKeys.tenant(tenantId), "detail", categoryId] as const,
};
