import { apiClient } from "@/lib/api/client";
import type { BookingListFilter, TenantBooking, TenantBookingDetail } from "@/modules/bookings/types";

/**
 * Raw calls against the Scheduling S11 owner booking-management endpoints.
 * Every route below is tenant-scoped and sits behind Authentication → Tenant
 * Context → Authorization on the backend; the permission named in each
 * comment is enforced there, and the UI's own `useCan(...)` checks only hide
 * controls.
 */

/**
 * GET /api/v1/tenants/{tenantID}/bookings — `booking.read`.
 *
 * `view` is always sent explicitly (never omitted to rely on the backend's
 * UPCOMING default) so the cache key and the request agree on exactly which
 * view was fetched, matching `listServices`' own reasoning for its `status`
 * parameter. `staff_id`/`service_id`/`date` are only sent when set — an
 * absent filter is a real "no filter" state, not an empty string.
 */
export function listBookings(
  tenantId: string,
  filter: BookingListFilter,
  signal?: AbortSignal
): Promise<TenantBooking[]> {
  return apiClient.get<TenantBooking[]>(`/v1/tenants/${tenantId}/bookings`, {
    query: {
      view: filter.view,
      staff_id: filter.staffId || undefined,
      service_id: filter.serviceId || undefined,
      date: filter.date || undefined,
    },
    signal,
  });
}

/** GET /api/v1/tenants/{tenantID}/bookings/{bookingID} — `booking.read`. */
export function getBooking(
  tenantId: string,
  bookingId: string,
  signal?: AbortSignal
): Promise<TenantBookingDetail> {
  return apiClient.get<TenantBookingDetail>(`/v1/tenants/${tenantId}/bookings/${bookingId}`, {
    signal,
  });
}

/**
 * POST /api/v1/tenants/{tenantID}/bookings/{bookingID}/cancel — `booking.update`.
 *
 * No request body: cancellation is a server-decided state transition
 * (CONFIRMED → CANCELLED), never a client-supplied status value — the same
 * shape `archiveService`/`archiveStaff` already use. Idempotent: cancelling
 * an already-CANCELLED booking returns it unchanged, with no error.
 */
export function cancelBooking(
  tenantId: string,
  bookingId: string,
  signal?: AbortSignal
): Promise<TenantBookingDetail> {
  return apiClient.post<TenantBookingDetail>(
    `/v1/tenants/${tenantId}/bookings/${bookingId}/cancel`,
    undefined,
    { signal }
  );
}
