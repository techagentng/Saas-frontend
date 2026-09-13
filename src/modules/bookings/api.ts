import { apiClient } from "@/lib/api/client";
import type {
  BookingListFilter,
  RescheduleBookingInput,
  TenantBooking,
  TenantBookingDetail,
} from "@/modules/bookings/types";

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

/**
 * POST /api/v1/tenants/{tenantID}/bookings/{bookingID}/reschedule — `booking.update`.
 *
 * Body: `{date, start}`, both interpreted by the backend in the TENANT's own
 * timezone (never the caller's/browser's). The backend re-validates the new
 * time through the real S7 availability engine — with this booking's own
 * current interval excluded so it never conflicts with itself — so this
 * function never computes or previews availability itself; a request either
 * succeeds (new booking-detail DTO) or fails with a real error (most notably
 * `BOOKING_SLOT_UNAVAILABLE`, a 409, if the slot is no longer free).
 * Rescheduling to the booking's own current slot is a no-op success, per the
 * backend's own idempotency convention.
 */
export function rescheduleBooking(
  tenantId: string,
  bookingId: string,
  input: RescheduleBookingInput,
  signal?: AbortSignal
): Promise<TenantBookingDetail> {
  return apiClient.post<TenantBookingDetail>(
    `/v1/tenants/${tenantId}/bookings/${bookingId}/reschedule`,
    input,
    { signal }
  );
}
