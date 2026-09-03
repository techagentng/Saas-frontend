"use client";

import { getBookingUrl } from "@/lib/config/public-url";
import { useTenant } from "@/providers/tenant-provider";

/**
 * The selected workspace's public booking-page link, for owner-facing
 * "view / share your booking page" surfaces (the dashboard header button, the
 * booking-link card).
 *
 * `absolute` is built from `NEXT_PUBLIC_APP_URL` via `getBookingUrl` — never
 * from `window.location` — so a link an owner copies always points at the
 * production domain even when previewing from a Render/localhost URL. It is
 * `null` when there is no slug yet, or the env var is unset.
 *
 * `href` is always something openable: the absolute URL when available, else
 * the relative `/book/{slug}` path (which still works in-app). `null` only
 * when there is no tenant/slug at all.
 */
export function useBookingPageHref(): { absolute: string | null; href: string | null } {
  const { currentTenant } = useTenant();
  const slug = currentTenant?.slug;

  if (!slug) return { absolute: null, href: null };

  let absolute: string | null;
  try {
    absolute = getBookingUrl(slug);
  } catch {
    absolute = null;
  }

  return { absolute, href: absolute ?? `/book/${slug}` };
}
