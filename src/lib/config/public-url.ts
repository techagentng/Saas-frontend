/**
 * The canonical public origin for customer-facing links — booking pages and
 * anything else shared outside the dashboard.
 *
 * Read from `NEXT_PUBLIC_APP_URL`, never derived from `window.location`: the
 * app is also reachable through a Render URL (and, in dev, localhost), but a
 * link an owner copies to give to customers must always point at the
 * configured production domain. Same "required env, fail loudly if missing"
 * contract as `getApiBaseUrl` in `lib/api/config.ts`.
 */
export function getPublicAppUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL;

  if (!raw || raw.trim() === "") {
    throw new Error(
      "NEXT_PUBLIC_APP_URL is not set. Copy .env.example to .env.local and set it to the canonical public origin (e.g. https://www.iweapps.com)."
    );
  }

  // Trim whitespace and strip any number of trailing slashes so callers can
  // append "/book/foo" without producing "https://host//book/foo".
  return raw.trim().replace(/\/+$/, "");
}

/**
 * The public booking-page URL for a tenant slug, e.g.
 * `https://www.iweapps.com/book/glamour-nails`. The slug is a validated
 * canonical identifier on the backend (lowercase, hyphenated), so it is
 * appended as-is.
 */
export function getBookingUrl(slug: string): string {
  return `${getPublicAppUrl()}/book/${slug}`;
}
