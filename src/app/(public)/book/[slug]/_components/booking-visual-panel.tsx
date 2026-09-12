"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import type { PublicTenant } from "@/modules/public-booking/types";

import { resolveBookingImage, type BookingVisualPanelImage } from "./booking-images";

const VISIBLE_MS = 4500;
const FADE_MS = 700;

function initialPrefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function usePrefersReducedMotion(): boolean {
  const [prefers, setPrefers] = useState(initialPrefersReducedMotion);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = (event: MediaQueryListEvent) => setPrefers(event.matches);
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  return prefers;
}

/**
 * The editorial image panel — the RIGHT ~40% on desktop, a shorter hero above
 * the content on mobile.
 *
 * With no real photos it shows the decorative product-owned default (see
 * `booking-images.ts`) — `alt=""`, `unoptimized` since it's an SVG. Given
 * real customer-uploaded service photos via `images`, it becomes a soft
 * cross-fading slideshow of them instead: the catalogue step feeds it one
 * photo per service (an ambient tour of the whole menu), and the
 * technician/time and review steps feed it just the chosen service's own
 * photos. Either way, no booking control is ever placed over the image, and
 * `object-cover` keeps aspect ratio while filling whatever the layout gives
 * it. Respects `prefers-reduced-motion`: reduced motion shows the first
 * photo statically instead of cycling.
 */
export function BookingVisualPanel({
  tenant,
  images = [],
  className = "",
}: {
  tenant: Pick<PublicTenant, "slug"> | null | undefined;
  images?: BookingVisualPanelImage[];
  className?: string;
}) {
  const fallback = resolveBookingImage(tenant);
  const hasRealImages = images.length > 0;
  const slides = hasRealImages ? images : [{ src: fallback.src, alt: "" }];

  const prefersReducedMotion = usePrefersReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const animate = slides.length > 1 && !prefersReducedMotion;

  // Resets to the first slide whenever the actual image SET changes (a
  // different catalogue snapshot, or the customer moving between steps) —
  // adjusted during render, React's documented pattern for this, rather than
  // in an effect, which would cost an extra render and cannot run before the
  // stale index is briefly used to paint.
  const signature = slides.map((slide) => slide.src).join("|");
  const [renderedSignature, setRenderedSignature] = useState(signature);
  if (signature !== renderedSignature) {
    setRenderedSignature(signature);
    setActiveIndex(0);
  }

  useEffect(() => {
    // No timer at all for a single slide, and none under reduced motion.
    if (!animate) return;
    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, VISIBLE_MS);
    return () => clearInterval(interval);
  }, [animate, slides.length]);

  return (
    // The caller's `className` carries the layout role — including `md:sticky`,
    // which `next/image`'s `fill` rejects as a parent `position`. So the sticky
    // box is the OUTER element, and a plain `relative` box directly wraps the
    // fill images.
    <div aria-hidden={hasRealImages ? undefined : "true"} className={className}>
      <div className="relative h-full w-full overflow-hidden rounded-3xl bg-[#EBD9D3] ring-1 ring-black/5 dark:ring-white/10">
        {slides.map((slide, index) => (
          <Image
            key={slide.src}
            src={slide.src}
            alt={hasRealImages ? slide.alt : ""}
            fill
            priority={index === 0}
            unoptimized={!hasRealImages}
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="object-cover"
            style={
              slides.length > 1
                ? {
                    opacity: index === activeIndex ? 1 : 0,
                    transitionProperty: "opacity",
                    transitionDuration: `${FADE_MS}ms`,
                    transitionTimingFunction: "ease-in-out",
                  }
                : undefined
            }
          />
        ))}
        {/* A whisper-soft scrim so the panel recedes behind the booking column
            and reads consistently in both themes. */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-white/5 dark:from-black/30 dark:to-black/5" />
      </div>
    </div>
  );
}
