import { apiClient } from "@/lib/api/client";
import type { ServiceCategory, ServiceCategoryListFilter } from "@/modules/service-categories/types";

/**
 * Raw calls against the SC1 tenant category endpoints. Every route below is
 * tenant-scoped and sits behind Authentication → Tenant Context →
 * Authorization on the backend, reusing the catalog's own `service.*`
 * permissions rather than a parallel `category.*` family — the UI's own
 * `can(...)` checks only hide controls; the backend remains authoritative.
 */

/** GET /api/v1/tenants/{tenantID}/service-categories — `service.read`. */
export function listServiceCategories(
  tenantId: string,
  filter: ServiceCategoryListFilter,
  signal?: AbortSignal
): Promise<ServiceCategory[]> {
  return apiClient.get<ServiceCategory[]>(`/v1/tenants/${tenantId}/service-categories`, {
    query: { status: filter },
    signal,
  });
}

/** GET /api/v1/tenants/{tenantID}/service-categories/{categoryID} — `service.read`. */
export function getServiceCategory(
  tenantId: string,
  categoryId: string,
  signal?: AbortSignal
): Promise<ServiceCategory> {
  return apiClient.get<ServiceCategory>(
    `/v1/tenants/${tenantId}/service-categories/${categoryId}`,
    { signal }
  );
}

/** Exactly the fields the backend's decode target accepts. `sort_order` nil defaults to 0 server-side. */
export type CreateServiceCategoryInput = {
  name: string;
  sort_order?: number;
};

/** POST /api/v1/tenants/{tenantID}/service-categories — `service.create`. Returns 201 (ACTIVE). */
export function createServiceCategory(
  tenantId: string,
  input: CreateServiceCategoryInput,
  signal?: AbortSignal
): Promise<ServiceCategory> {
  return apiClient.post<ServiceCategory>(`/v1/tenants/${tenantId}/service-categories`, input, {
    signal,
  });
}

export type UpdateServiceCategoryInput = Partial<{
  name: string;
  sort_order: number;
}>;

/** PATCH /api/v1/tenants/{tenantID}/service-categories/{categoryID} — `service.update`. */
export function updateServiceCategory(
  tenantId: string,
  categoryId: string,
  input: UpdateServiceCategoryInput,
  signal?: AbortSignal
): Promise<ServiceCategory> {
  return apiClient.patch<ServiceCategory>(
    `/v1/tenants/${tenantId}/service-categories/${categoryId}`,
    input,
    { signal }
  );
}

/**
 * POST /api/v1/tenants/{tenantID}/service-categories/{categoryID}/archive — `service.archive`.
 *
 * No request body. Idempotent — archiving an already-archived category returns
 * it unchanged without a write. Never touches the services filed under it:
 * they keep their `category_id` and stay individually bookable.
 */
export function archiveServiceCategory(
  tenantId: string,
  categoryId: string,
  signal?: AbortSignal
): Promise<ServiceCategory> {
  return apiClient.post<ServiceCategory>(
    `/v1/tenants/${tenantId}/service-categories/${categoryId}/archive`,
    undefined,
    { signal }
  );
}
