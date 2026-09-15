import { isValidTimezone } from "@/lib/tenant/timezones";

/**
 * Formats a UTC instant (an RFC3339 string like `TenantBooking.start`) as
 * tenant-local wall-clock date/time — the tenant's own authoritative
 * timezone, per Scheduling S11's own contract, NEVER the viewer's device
 * timezone. A tenant with no timezone configured is a real, if rare, state
 * (S1 permits it); rather than silently falling back to the browser's zone —
 * which could show an owner a different time than their own customers saw —
 * this falls back to UTC and says so explicitly.
 */
export function formatBookingInstant(
  iso: string,
  timezone: string | null | undefined
): { date: string; time: string; zone: string } {
  const zone = timezone && isValidTimezone(timezone) ? timezone : "UTC";
  const instant = new Date(iso);

  const date = instant.toLocaleDateString("en-US", {
    timeZone: zone,
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const time = instant.toLocaleTimeString("en-US", {
    timeZone: zone,
    hour: "numeric",
    minute: "2-digit",
  });

  return { date, time, zone };
}

/**
 * Renders a UTC instant as tenant-local machine-readable `date`/`time`
 * strings — `YYYY-MM-DD` and `HH:MM` (24-hour) — suitable as `<input
 * type="date">`/`<input type="time">` values, or as the `date`/`start`
 * fields of a `RescheduleBookingInput`. Distinct from `formatBookingInstant`
 * above, which renders locale-formatted DISPLAY strings ("Sep 12, 2026",
 * "10:00 AM") that native date/time inputs cannot accept as `value`.
 *
 * Used to pre-fill the reschedule dialog's inputs with the booking's OWN
 * current date/start, expressed in the same tenant timezone the backend will
 * interpret the edited values in — never the viewer's device timezone.
 */
export function toTenantLocalDateAndTime(
  iso: string,
  timezone: string | null | undefined
): { date: string; time: string } {
  const zone = timezone && isValidTimezone(timezone) ? timezone : "UTC";
  const instant = new Date(iso);

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);

  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? "";

  return {
    date: `${part("year")}-${part("month")}-${part("day")}`,
    time: `${part("hour")}:${part("minute")}`,
  };
}

/**
 * Whether a booking's appointment window has already ended (Scheduling
 * S13-BE's own eligibility rule for Complete/No-show: "current tenant-local
 * time >= booking.end"). No timezone conversion is needed here — `end` and
 * "now" are both absolute instants, and comparing instants is
 * timezone-independent by construction (the backend's own doc comment on
 * `transitionToTerminal` makes the identical point). Timezone only matters
 * for how a time is *displayed*, not for this comparison.
 *
 * This is a UX-only hint for which lifecycle actions to show — the backend
 * remains the final authority and re-validates independently on every
 * request (it compares against ITS OWN clock, which may differ slightly from
 * a skewed device clock; see `RescheduleBookingDialog`'s equivalent note on
 * never trusting the frontend to compute a real scheduling fact).
 */
export function hasBookingEnded(endIso: string, now: Date = new Date()): boolean {
  return now.getTime() >= new Date(endIso).getTime();
}
