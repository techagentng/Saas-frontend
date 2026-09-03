import Image from "next/image";

import type { PublicTenant } from "@/modules/public-booking/types";

import { resolveBookingImage } from "./booking-images";

/**
 * The editorial image panel — the RIGHT ~40% on desktop, a shorter hero above
 * the content on mobile.
 *
 * It is purely decorative (`alt=""`): the booking functionality carries all
 * the information, and no booking control is ever placed over the image. The
 * asset is product-owned (see `booking-images.ts`), served as-is via
 * `unoptimized` because it's an SVG, and `object-cover` keeps its aspect
 * ratio while filling whatever the layout gives it.
 */
export function BookingVisualPanel({
  tenant,
  className = "",
}: {
  tenant: Pick<PublicTenant, "slug"> | null | undefined;
  className?: string;
}) {
  const image = resolveBookingImage(tenant);

  return (
    <div
      aria-hidden="true"
      className={`relative overflow-hidden rounded-3xl bg-[#EBD9D3] ring-1 ring-black/5 dark:ring-white/10 ${className}`}
    >
      <Image
        src={image.src}
        alt=""
        fill
        priority
        unoptimized
        sizes="(min-width: 1024px) 40vw, 100vw"
        className="object-cover"
      />
      {/* A whisper-soft scrim so the panel recedes behind the booking column
          and reads consistently in both themes. */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-white/5 dark:from-black/30 dark:to-black/5" />
    </div>
  );
}
