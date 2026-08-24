import { apiClient } from "@/lib/api/client";
import type { Tenant } from "@/types/tenant";

type TenantResponse = Omit<Tenant, "permissions"> & Partial<Pick<Tenant, "permissions">>;

/**
 * `permissions` isn't part of the confirmed backend tenant contract (see
 * Frontend Epic 01 audit, F11) — normalized to `[]` here so every tenant
 * the frontend sees always has a well-formed `Tenant`, regardless of
 * whether/when the backend starts including it.
 */
function normalizeTenant(raw: TenantResponse): Tenant {
  return { ...raw, permissions: raw.permissions ?? [] };
}

export async function listTenants(signal?: AbortSignal): Promise<Tenant[]> {
  const tenants = await apiClient.get<TenantResponse[]>("/v1/tenants", { signal });
  return tenants.map(normalizeTenant);
}

export async function getTenant(tenantId: string, signal?: AbortSignal): Promise<Tenant> {
  const tenant = await apiClient.get<TenantResponse>(`/v1/tenants/${tenantId}`, { signal });
  return normalizeTenant(tenant);
}

export type CreateTenantInput = {
  name: string;
  slug: string;
};

export async function createTenant(input: CreateTenantInput, signal?: AbortSignal): Promise<Tenant> {
  const created = await apiClient.post<TenantResponse>("/v1/tenants", input, { signal });
  return normalizeTenant(created);
}

/**
 * Only the fields the backend accepts as editable business-profile data.
 * `id`, `slug`, `status`, `created_at`, `updated_at`, and `permissions`
 * are backend-owned and never sent here — slug in particular is immutable
 * through this endpoint.
 */
export type UpdateTenantProfileInput = Partial<{
  name: string;
  description: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  timezone: string;
}>;

export async function updateTenantProfile(
  tenantId: string,
  input: UpdateTenantProfileInput,
  signal?: AbortSignal
): Promise<Tenant> {
  const updated = await apiClient.patch<TenantResponse>(`/v1/tenants/${tenantId}`, input, { signal });
  return normalizeTenant(updated);
}
