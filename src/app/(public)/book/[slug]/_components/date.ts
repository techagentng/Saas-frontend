/**
 * The visitor's local calendar date as `YYYY-MM-DD`.
 *
 * Used only as the `min` on the date picker — a soft, client-side guard
 * against obviously-past selection. It is NOT authoritative: the backend
 * re-validates every date against the tenant's own timezone and returns an
 * empty slot list for a past date regardless, so a one-day skew at a
 * midnight boundary is harmless. The frontend never computes a timezone
 * offset for the availability request itself.
 */
export function todayLocalISODate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * "Saturday, 5 September 2026" from a `YYYY-MM-DD` string, parsed as a plain
 * civil date — no timezone arithmetic, so it renders the same day everywhere.
 */
export function formatCivilDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
