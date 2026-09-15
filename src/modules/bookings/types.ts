/**
 * Frontend contract for the Scheduling S11 owner booking-management surface,
 * mirroring the backend's DTOs field for field
 * (`internal/scheduling/handler/booking_management_handler.go`).
 *
 * Deliberately absent, because the backend never returns them from these
 * endpoints: `price`/`currency` (this DTO carries neither — the receipt
 * endpoint (S12) independently re-resolves the service's CURRENT price
 * server-side for its own purposes, but that is a different response, and
 * inventing a price here would be exactly the "duplicate backend
 * transformation" this contract warns against), tenant id, raw
 * `updated_at`, and any auth/session/audit data.
 */

/** The `{id, name}` shape of a service or technician on a booking. */
export type BookingParty = {
  id: string;
  name: string;
};

/**
 * Constrained to the four values `model.BookingStatus` allows
 * (`internal/scheduling/model/booking.go`). A booking row is never deleted —
 * a status transition only changes this field.
 *
 * CANCELLED, COMPLETED and NO_SHOW (the latter two Scheduling S13-BE) are all
 * terminal: the backend's own domain rule permits only CONFIRMED -> CANCELLED,
 * CONFIRMED -> COMPLETED, and CONFIRMED -> NO_SHOW. There is no
 * COMPLETED <-> NO_SHOW transition, and none of the three terminal statuses
 * reverses to CONFIRMED.
 */
export type BookingStatus = "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW";

/**
 * One dashboard list row (`TenantBooking`). `start`/`end`/`created_at` are
 * absolute RFC3339 UTC instants — the backend's storage and API convention —
 * so the dashboard must format them in the tenant's own timezone, never the
 * viewer's device timezone (this DTO carries no timezone of its own; use the
 * active tenant's `timezone`, which is the same fact the backend used to
 * resolve `view`/`date` for this exact list).
 */
export type TenantBooking = {
  id: string;
  reference: string;
  status: BookingStatus;
  service: BookingParty;
  staff: BookingParty;
  customer_name: string;
  /** Null when the customer never gave one — Scheduling S10 makes both optional. */
  customer_phone: string | null;
  customer_email: string | null;
  start: string;
  end: string;
  duration_minutes: number;
  created_at: string;
};

/**
 * One booking's detail (`TenantBookingDetail`) — every `TenantBooking` field
 * plus the tenant's own IANA timezone, so the detail view is self-contained
 * and does not need the tenant context to render correctly.
 */
export type TenantBookingDetail = TenantBooking & {
  timezone: string;
};

/**
 * The `?view=` values `ParseBookingView` accepts. A closed vocabulary — the
 * dashboard does not offer arbitrary status/date queries, and an
 * unrecognized value is rejected by the backend rather than silently
 * defaulted.
 */
export type BookingView = "UPCOMING" | "PAST" | "CANCELLED" | "ALL";

/**
 * The list query, matching `service.BookingListFilter` field for field.
 * `staffId`/`serviceId`/`date` are optional exact filters; `date` is a
 * calendar date in `YYYY-MM-DD` form, interpreted by the backend in the
 * TENANT's own timezone — the frontend never computes or sends an offset.
 */
export type BookingListFilter = {
  view: BookingView;
  staffId?: string | null;
  serviceId?: string | null;
  date?: string | null;
};

/**
 * The reschedule request body (Scheduling S12-BE), matching
 * `rescheduleRequest` field for field
 * (`internal/scheduling/handler/booking_management_handler.go`). Both values
 * are interpreted by the backend in the TENANT's own timezone — never a
 * caller-supplied offset. Deliberately absent: end, duration, service id,
 * staff id, customer, price — the backend derives or leaves every one of
 * those unchanged, and has no field to decode them into.
 */
export type RescheduleBookingInput = {
  /** Calendar date, `YYYY-MM-DD`. */
  date: string;
  /** Wall-clock start time, `HH:MM` (24-hour) — matches `<input type="time">`'s native value format exactly. */
  start: string;
};
