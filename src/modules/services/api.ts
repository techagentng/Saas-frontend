import { apiClient } from "@/lib/api/client";
import type { Service, ServiceListFilter } from "@/modules/services/types";

/**
 * Raw calls against the Scheduling S1 catalog endpoints. Every route below is
 * tenant-scoped and sits behind Authentication → Tenant Context →
 * Authorization on the backend; the permission named in each comment is
 * enforced there, and the UI's own `can(...)` checks only hide controls.
 */

/**
 * GET /api/v1/tenants/{tenantID}/services — `service.read`.
 *
 * The `status` parameter is always sent explicitly rather than relying on the
 * backend's ACTIVE default, so the cache key and the request agree on exactly
 * which catalog was fetched.
 */
export function listServices(
  tenantId: string,
  filter: ServiceListFilter,
  signal?: AbortSignal
): Promise<Service[]> {
  return apiClient.get<Service[]>(`/v1/tenants/${tenantId}/services`, {
    query: { status: filter },
    signal,
  });
}

/** GET /api/v1/tenants/{tenantID}/services/{serviceID} — `service.read`. */
export function getService(
  tenantId: string,
  serviceId: string,
  signal?: AbortSignal
): Promise<Service> {
  return apiClient.get<Service>(`/v1/tenants/${tenantId}/services/${serviceId}`, { signal });
}

/**
 * Exactly the four fields the backend's decode target accepts. `status`,
 * `currency`, `tenant_id`, `id` and the timestamps are all server-owned — the
 * handler has no field to decode them into, so sending them would be silently
 * discarded, and shaping the type this way keeps that boundary visible here too.
 */
export type CreateServiceInput = {
  name: string;
  description: string | null;
  duration_minutes: number;
  price_minor: number;
  /** Omitted or null files the service as uncategorised. Must name an ACTIVE category belonging to this tenant. */
  category_id?: string | null;
};

/** POST /api/v1/tenants/{tenantID}/services — `service.create`. Returns 201 with the created service (ACTIVE). */
export function createService(
  tenantId: string,
  input: CreateServiceInput,
  signal?: AbortSignal
): Promise<Service> {
  return apiClient.post<Service>(`/v1/tenants/${tenantId}/services`, input, { signal });
}

/**
 * Partial update: only the keys present are changed, matching the backend's
 * pointer-field decode target. The editable set is exactly the catalog data a
 * client owns — status is owned by the archive endpoint, currency is
 * tenant-level and write-once.
 */
export type UpdateServiceInput = Partial<{
  name: string;
  description: string | null;
  duration_minutes: number;
  price_minor: number;
  /**
   * Tri-state, matching the backend's own decode target: omit the key to
   * leave the assignment unchanged, send `null` to clear it to uncategorised,
   * or send a category id to (re)assign it.
   */
  category_id: string | null;
}>;

/** PATCH /api/v1/tenants/{tenantID}/services/{serviceID} — `service.update`. */
export function updateService(
  tenantId: string,
  serviceId: string,
  input: UpdateServiceInput,
  signal?: AbortSignal
): Promise<Service> {
  return apiClient.patch<Service>(`/v1/tenants/${tenantId}/services/${serviceId}`, input, {
    signal,
  });
}

/**
 * POST /api/v1/tenants/{tenantID}/services/{serviceID}/archive — `service.archive`.
 *
 * No request body: archiving is a server-decided state transition, never a
 * client-supplied status value. Idempotent — archiving an already-archived
 * service returns it unchanged without a write.
 */
export function archiveService(
  tenantId: string,
  serviceId: string,
  signal?: AbortSignal
): Promise<Service> {
  return apiClient.post<Service>(
    `/v1/tenants/${tenantId}/services/${serviceId}/archive`,
    undefined,
    { signal }
  );
}
