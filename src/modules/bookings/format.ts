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
