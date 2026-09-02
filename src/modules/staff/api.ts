import { apiClient } from "@/lib/api/client";
import type {
  StaffCapabilities,
  StaffListFilter,
  StaffProfile,
} from "@/modules/staff/types";

/**
 * Raw calls against the Scheduling S3 staff roster endpoints. Every route
 * below is tenant-scoped and sits behind Authentication → Tenant Context →
 * Authorization on the backend; the permission named in each comment is
 * enforced there, and the UI's own `useCan(...)` checks only hide controls.
 */

/**
 * GET /api/v1/tenants/{tenantID}/staff — `staff.read`.
 *
 * `status` is always sent explicitly rather than relying on the backend's
 * ACTIVE default, so the cache key and the request agree on exactly which
 * roster was fetched — the same reasoning `listServices` uses.
 */
export function listStaff(
  tenantId: string,
  filter: StaffListFilter,
  signal?: AbortSignal
): Promise<StaffProfile[]> {
  return apiClient.get<StaffProfile[]>(`/v1/tenants/${tenantId}/staff`, {
    query: { status: filter },
    signal,
  });
}

/** GET /api/v1/tenants/{tenantID}/staff/{staffID} — `staff.read`. */
export function getStaff(
  tenantId: string,
  staffId: string,
  signal?: AbortSignal
): Promise<StaffProfile> {
  return apiClient.get<StaffProfile>(`/v1/tenants/${tenantId}/staff/${staffId}`, { signal });
}

/**
 * Exactly the four fields the backend's decode target accepts. `status`,
 * `tenant_id`, `id`, and the timestamps are server-owned — sending them
 * would be silently discarded, matching the boundary `CreateServiceInput`
 * documents for the catalog.
 */
export type CreateStaffInput = {
  display_name: string;
  bio?: string | null;
  /** An existing user id with an ACTIVE membership in this tenant. Omit for a non-login worker. */
  user_id?: string | null;
  /** Omit to default to `true` server-side. */
  is_bookable?: boolean;
};

/** POST /api/v1/tenants/{tenantID}/staff — `staff.create`. Returns 201 with the created profile (ACTIVE). */
export function createStaff(
  tenantId: string,
  input: CreateStaffInput,
  signal?: AbortSignal
): Promise<StaffProfile> {
  return apiClient.post<StaffProfile>(`/v1/tenants/${tenantId}/staff`, input, { signal });
}

/**
 * Partial update: only the keys present are changed. There is no `user_id`
 * field — re-pointing a profile at a different person is not an edit, per
 * the backend's own `UpdateStaffInput` — and no `status`, which belongs to
 * the archive endpoint.
 */
export type UpdateStaffInput = Partial<{
  display_name: string;
  bio: string | null;
  is_bookable: boolean;
}>;

/** PATCH /api/v1/tenants/{tenantID}/staff/{staffID} — `staff.update`. */
export function updateStaff(
  tenantId: string,
  staffId: string,
  input: UpdateStaffInput,
  signal?: AbortSignal
): Promise<StaffProfile> {
  return apiClient.patch<StaffProfile>(`/v1/tenants/${tenantId}/staff/${staffId}`, input, {
    signal,
  });
}

/**
 * POST /api/v1/tenants/{tenantID}/staff/{staffID}/archive — `staff.archive`.
 *
 * No request body: archiving is a server-decided state transition. Idempotent
 * — archiving an already-archived profile returns it unchanged.
 */
export function archiveStaff(
  tenantId: string,
  staffId: string,
  signal?: AbortSignal
): Promise<StaffProfile> {
  return apiClient.post<StaffProfile>(`/v1/tenants/${tenantId}/staff/${staffId}/archive`, undefined, {
    signal,
  });
}

/** GET /api/v1/tenants/{tenantID}/staff/{staffID}/services — `staff.read`. */
export function listStaffCapabilities(
  tenantId: string,
  staffId: string,
  signal?: AbortSignal
): Promise<StaffCapabilities> {
  return apiClient.get<StaffCapabilities>(
    `/v1/tenants/${tenantId}/staff/${staffId}/services`,
    { signal }
  );
}

/**
 * PUT /api/v1/tenants/{tenantID}/staff/{staffID}/services — `staff.update`.
 *
 * The body is the complete capability set, not a delta: whatever is sent
 * becomes the set. An empty array is a legitimate "performs nothing" state,
 * not an omission.
 */
export function replaceStaffCapabilities(
  tenantId: string,
  staffId: string,
  serviceIds: string[],
  signal?: AbortSignal
): Promise<StaffCapabilities> {
  return apiClient.put<StaffCapabilities>(
    `/v1/tenants/${tenantId}/staff/${staffId}/services`,
    { service_ids: serviceIds },
    { signal }
  );
}
