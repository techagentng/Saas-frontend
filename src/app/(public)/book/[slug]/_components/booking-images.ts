import type { PublicTenant } from "@/modules/public-booking/types";

/**
 * The single seam for the public booking page's editorial imagery.
 *
 * There is no tenant branding/gallery backend yet, so the images below are
 * PRODUCT-owned editorial visuals — abstract, not photographs of any real
 * salon's work, and deliberately not presented as belonging to the tenant
 * (the panel is decorative, `alt=""`, and carries no caption).
 *
 * When a tenant gallery/branding endpoint lands, this is the ONE place to
 * change: `resolveBookingImage` picks the tenant's own image and falls back
 * to a default. No component that renders the panel needs to change.
 */
export type BookingImage = {
  /** Path under `/public`. Served as-is (see `BookingVisualPanel` — `unoptimized`). */
  src: string;
  /** Intrinsic dimensions, for `next/image` aspect-ratio math. */
  width: number;
  height: number;
};

/** Product-owned defaults. A small set so the panel isn't identical everywhere. */
const DEFAULT_BOOKING_IMAGES: readonly BookingImage[] = [
  { src: "/book/editorial-nails.svg", width: 1200, height: 1600 },
  { src: "/book/editorial-nails-2.svg", width: 1200, height: 1600 },
];

/**
 * Stable per-slug pick from the default set — the same slug always gets the
 * same image, but two different businesses don't look identical. A tiny
 * deterministic string hash, not randomness, so SSR and client agree.
 */
function pickIndex(seed: string, length: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % length;
}

export function resolveBookingImage(tenant: Pick<PublicTenant, "slug"> | null | undefined): BookingImage {
  // TODO(booking-gallery): when a tenant gallery/branding endpoint exists,
  // return `tenant.gallery[0]` here and fall through to the default below.
  const seed = tenant?.slug ?? "";
  return DEFAULT_BOOKING_IMAGES[pickIndex(seed, DEFAULT_BOOKING_IMAGES.length)];
}
