import { apiClient } from "@/lib/api/client";
import type { StaffWorkingHours, WorkingHourInterval } from "@/modules/working-hours/types";

/**
 * Raw calls against the Scheduling S5 working-hours endpoints. Tenant-scoped
 * and sitting behind Authentication → Tenant Context → Authorization on the
 * backend, matching every other staff sub-resource; the permission named in
 * each comment is enforced there, and the UI's own `useCan(...)` checks only
 * hide controls.
 */

/** GET /api/v1/tenants/{tenantID}/staff/{staffID}/working-hours — `staff.read`. */
export function getStaffWorkingHours(
  tenantId: string,
  staffId: string,
  signal?: AbortSignal
): Promise<StaffWorkingHours> {
  return apiClient.get<StaffWorkingHours>(
    `/v1/tenants/${tenantId}/staff/${staffId}/working-hours`,
    { signal }
  );
}

/**
 * PUT /api/v1/tenants/{tenantID}/staff/{staffID}/working-hours — `staff.update`.
 *
 * The body is the complete weekly schedule, not a delta — mirroring
 * `replaceStaffCapabilities`. An empty array is a legitimate "not working
 * any day" state, not an omission; there is no field for it to be missing
 * from, since this function's parameter is always a real array.
 */
export function replaceStaffWorkingHours(
  tenantId: string,
  staffId: string,
  intervals: WorkingHourInterval[],
  signal?: AbortSignal
): Promise<StaffWorkingHours> {
  return apiClient.put<StaffWorkingHours>(
    `/v1/tenants/${tenantId}/staff/${staffId}/working-hours`,
    { intervals },
    { signal }
  );
}
