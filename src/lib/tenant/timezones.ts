/**
 * IANA timezone identifiers sourced from the browser's own ICU data via
 * `Intl.supportedValuesOf` — no dependency added for what the platform
 * already ships (a timezone package would be hundreds of KB of duplicated
 * data). These are the exact identifiers the backend validates with
 * time.LoadLocation, so the value sent is always a real zone id and never a
 * display label.
 */
const FALLBACK_TIMEZONES = [
  "Africa/Lagos",
  "Africa/Cairo",
  "Africa/Johannesburg",
  "America/Chicago",
  "America/Los_Angeles",
  "America/New_York",
  "America/Sao_Paulo",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Europe/Berlin",
  "Europe/London",
  "Europe/Madrid",
  "Europe/Paris",
  "UTC",
];

/**
 * Every zone this runtime knows about. Falls back to a small curated list on
 * an engine without `Intl.supportedValuesOf` (older Safari), so the field
 * still works rather than rendering an empty picker.
 */
export function listTimezones(): string[] {
  try {
    const supported = Intl.supportedValuesOf?.("timeZone");
    if (supported && supported.length > 0) return [...supported];
  } catch {
    // Fall through to the curated list below.
  }
  return FALLBACK_TIMEZONES;
}

/**
 * The visitor's own zone, used only to preselect a sensible default the user
 * can change — never silently saved on their behalf without them seeing it
 * on the timezone question.
 */
export function detectTimezone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

/** Mirrors the backend's rule: a real, resolvable zone id — never an empty string. */
export function isValidTimezone(value: string): boolean {
  if (!value.trim()) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

/** "Africa/Lagos" → "Africa / Lagos" for display only; the stored value is untouched. */
export function timezoneLabel(zone: string): string {
  return zone.replace(/_/g, " ").replace("/", " / ");
}
