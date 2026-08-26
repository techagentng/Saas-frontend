import { apiClient } from "@/lib/api/client";
import type { BusinessType, Tenant } from "@/types/tenant";

export function listTenants(signal?: AbortSignal): Promise<Tenant[]> {
  return apiClient.get<Tenant[]>("/v1/tenants", { signal });
}

export function getTenant(tenantId: string, signal?: AbortSignal): Promise<Tenant> {
  return apiClient.get<Tenant>(`/v1/tenants/${tenantId}`, { signal });
}

/**
 * `business_type` is required by the backend as of Vertical Onboarding F1 —
 * confirmed live (missing/empty rejected with VALIDATION_FAILED). Only these
 * three fields are ever sent: onboarding_status/onboarding_step/status/
 * owner/role are all backend-owned and have no place in this request shape.
 */
export type CreateTenantInput = {
  name: string;
  slug: string;
  business_type: BusinessType;
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
