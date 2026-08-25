import { apiClient } from "@/lib/api/client";
import type { Tenant } from "@/types/tenant";

export function listTenants(signal?: AbortSignal): Promise<Tenant[]> {
  return apiClient.get<Tenant[]>("/v1/tenants", { signal });
}

export function getTenant(tenantId: string, signal?: AbortSignal): Promise<Tenant> {
  return apiClient.get<Tenant>(`/v1/tenants/${tenantId}`, { signal });
}

export type CreateTenantInput = {
  name: string;
  slug: string;
};

export function createTenant(input: CreateTenantInput, signal?: AbortSignal): Promise<Tenant> {
  return apiClient.post<Tenant>("/v1/tenants", input, { signal });
}

/**
 * Only the fields the backend accepts as editable business-profile data.
 * `id`, `slug`, `status`, `created_at`, `updated_at` are backend-owned and
 * never sent here — slug in particular is immutable through this endpoint.
 */
export type UpdateTenantProfileInput = Partial<{
  name: string;
  description: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  timezone: string;
}>;

export function updateTenantProfile(
  tenantId: string,
  input: UpdateTenantProfileInput,
  signal?: AbortSignal
): Promise<Tenant> {
  return apiClient.patch<Tenant>(`/v1/tenants/${tenantId}`, input, { signal });
}
