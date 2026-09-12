import Image from "next/image";

import type { PublicTenant } from "@/modules/public-booking/types";

import { resolveBookingImage, type BookingVisualPanelImage } from "./booking-images";

/**
 * The editorial image panel — the RIGHT ~40% on desktop, a shorter hero above
 * the content on mobile.
 *
 * Without a `previewImage`, it's purely decorative (`alt=""`): the booking
 * functionality carries all the information, and the product-owned default
 * asset (see `booking-images.ts`) is served as-is via `unoptimized` because
 * it's an SVG. When the caller passes a real customer-uploaded service photo
 * as `previewImage` — the chosen service on later steps, or the row the
 * customer is looking at on the catalogue — that photo takes over instead,
 * with genuine alt text since it's now content. Either way, no booking
 * control is ever placed over the image, and `object-cover` keeps its aspect
 * ratio while filling whatever the layout gives it.
 */
export function BookingVisualPanel({
  tenant,
  previewImage = null,
  className = "",
}: {
  tenant: Pick<PublicTenant, "slug"> | null | undefined;
  previewImage?: BookingVisualPanelImage | null;
  className?: string;
}) {
  const fallback = resolveBookingImage(tenant);
  const image = previewImage ?? fallback;

  return (
    // The caller's `className` carries the layout role — including `md:sticky`,
    // which `next/image`'s `fill` rejects as a parent `position`. So the sticky
    // box is the OUTER element, and a plain `relative` box directly wraps the
    // fill image.
    <div aria-hidden={previewImage ? undefined : "true"} className={className}>
      <div className="relative h-full w-full overflow-hidden rounded-3xl bg-[#EBD9D3] ring-1 ring-black/5 dark:ring-white/10">
        <Image
          // Force a remount on swap — a real photo and the decorative default
          // have different `unoptimized`/alt semantics, and different real
          // photos should hard-cut rather than momentarily show a stale one.
          key={image.src}
          src={image.src}
          alt={previewImage ? previewImage.alt : ""}
          fill
          priority
          unoptimized={!previewImage}
          sizes="(min-width: 1024px) 40vw, 100vw"
          className="object-cover"
        />
        {/* A whisper-soft scrim so the panel recedes behind the booking column
            and reads consistently in both themes. */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-white/5 dark:from-black/30 dark:to-black/5" />
      </div>
    </div>
  );
}
