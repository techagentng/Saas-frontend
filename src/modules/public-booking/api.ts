import { publicApiGet, publicApiPost } from "@/lib/api/public-client";
import type {
  CreatePublicBookingInput,
  CreatePublicBookingResponse,
  PublicAvailability,
  PublicServiceCatalog,
  PublicServiceStaff,
  PublicTenant,
} from "@/modules/public-booking/types";

/**
 * Raw calls against the anonymous public booking endpoints (Scheduling S8).
 * No authentication, no tenant id — the slug from the customer-facing URL is
 * the entire input. Every non-2xx response is already normalized to `ApiError`
 * by `publicApiGet`; callers branch on `error.code`:
 *
 *   - TENANT_NOT_FOUND / TENANT_SLUG_INVALID → slug does not resolve to a
 *     publicly visible tenant (hidden, disabled, still onboarding, reserved,
 *     or simply nonexistent — all indistinguishable by design)
 *   - RESOURCE_NOT_FOUND (services only) → the tenant resolves but is not a
 *     NAIL_TECHNICIAN, so it has no public appointment catalog
 */

export function getPublicTenant(slug: string, signal?: AbortSignal): Promise<PublicTenant> {
  return publicApiGet<PublicTenant>(`/v1/public/tenants/${encodeURIComponent(slug)}`, signal);
}

export function getPublicServiceCatalog(
  slug: string,
  signal?: AbortSignal
): Promise<PublicServiceCatalog> {
  return publicApiGet<PublicServiceCatalog>(
    `/v1/public/tenants/${encodeURIComponent(slug)}/services`,
    signal
  );
}

/**
 * Technicians who can perform one service (Scheduling S9, step 2).
 * `RESOURCE_NOT_FOUND` for a non-nail tenant; `SERVICE_NOT_FOUND` for an
 * archived/missing/cross-tenant service; an empty `staff` array is a success.
 */
export function getPublicServiceStaff(
  slug: string,
  serviceId: string,
  signal?: AbortSignal
): Promise<PublicServiceStaff> {
  return publicApiGet<PublicServiceStaff>(
    `/v1/public/tenants/${encodeURIComponent(slug)}/services/${encodeURIComponent(serviceId)}/staff`,
    signal
  );
}

/**
 * Real slots for one service + technician + tenant-local date (Scheduling S9,
 * step 3) — the S7 engine behind the public gate. The date is `YYYY-MM-DD` in
 * the tenant's own timezone; a client-computed timezone is never sent.
 * `VALIDATION_FAILED` for a technician not assigned the service or a malformed
 * date; an empty `slots` array is a success (a day with no availability).
 */
export function getPublicAvailability(
  slug: string,
  serviceId: string,
  staffId: string,
  date: string,
  signal?: AbortSignal
): Promise<PublicAvailability> {
  return publicApiGet<PublicAvailability>(
    `/v1/public/tenants/${encodeURIComponent(slug)}/availability`,
    signal,
    { service_id: serviceId, staff_id: staffId, date }
  );
}

/**
 * Create a real anonymous booking (Scheduling S10).
 * `POST /api/v1/public/tenants/{slug}/bookings` — `201` with the persisted
 * booking. Errors callers branch on:
 *
 *   - BOOKING_SLOT_UNAVAILABLE (409) → the slot was taken / is no longer
 *     bookable; the customer must pick another time
 *   - VALIDATION_FAILED (400) → the customer details or ids were rejected
 *   - SERVICE_NOT_FOUND / STAFF_NOT_FOUND (404) → the chosen service/tech is
 *     no longer offered
 *   - RESOURCE_NOT_FOUND / TENANT_NOT_FOUND / TENANT_SLUG_INVALID → the
 *     tenant is not a publicly bookable nail business
 */
export function createPublicBooking(
  slug: string,
  input: CreatePublicBookingInput,
  signal?: AbortSignal
): Promise<CreatePublicBookingResponse> {
  return publicApiPost<CreatePublicBookingResponse>(
    `/v1/public/tenants/${encodeURIComponent(slug)}/bookings`,
    input,
    signal
  );
}
