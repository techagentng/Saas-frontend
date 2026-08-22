import { apiClient } from "@/lib/api/client";
import type { Tenant } from "@/types/tenant";

/**
 * GET /api/v1/tenants does not exist on the backend yet (Phase B non-goal:
 * no F3 calls against endpoints that aren't real). This stub keeps the
 * exact signature the real call will have —
 * `apiClient.get<Tenant[]>("/v1/tenants", { signal })` — so wiring it up
 * later is a one-line change here and requires no changes to
 * useTenantsQuery, TenantProvider, or any consumer.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for signature parity with the future real call
export function listTenants(signal?: AbortSignal): Promise<Tenant[]> {
  return Promise.reject(
    new Error("listTenants() is not implemented: GET /api/v1/tenants does not exist yet.")
  );
}

export type CreateTenantInput = {
  name: string;
  slug: string;
};

/**
 * Feature 2 (tenant creation) is confirmed live on the backend, unlike
 * listTenants() above. Contract assumed as `POST /v1/tenants` returning
 * the created tenant — confirm the exact path/shape against the real F2
 * API and adjust only this function; nothing else depends on the path.
 * `permissions` is normalized to `[]` if the response omits it, since
 * that field is really an F3/session concern.
 */
export async function createTenant(input: CreateTenantInput, signal?: AbortSignal): Promise<Tenant> {
  const created = await apiClient.post<Partial<Tenant> & Pick<Tenant, "id" | "name" | "slug">>(
    "/v1/tenants",
    input,
    { signal }
  );

  return { ...created, permissions: created.permissions ?? [] };
}
