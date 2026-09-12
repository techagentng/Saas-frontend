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
