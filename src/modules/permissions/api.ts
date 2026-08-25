import { apiClient } from "@/lib/api/client";
import type { Permission } from "@/types/permission";

type EffectivePermissionsResponse = {
  permissions: Permission[];
};

/**
 * GET /api/v1/tenants/{tenantID}/permissions — the caller's own effective,
 * already-deduplicated permission set for that tenant, resolved
 * server-side (Go monolith Epic 1 F5/F6). An empty array is a valid
 * response for a real member with no granted permissions, not an error.
 */
export async function getTenantPermissions(tenantId: string, signal?: AbortSignal): Promise<Permission[]> {
  const response = await apiClient.get<EffectivePermissionsResponse>(
    `/v1/tenants/${tenantId}/permissions`,
    { signal }
  );
  return response.permissions;
}
