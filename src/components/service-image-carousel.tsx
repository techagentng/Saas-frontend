"use client";

import { Image as ImageIcon } from "lucide-react";
import NextImage from "next/image";
import { useEffect, useMemo, useState } from "react";

import type { PublicServiceImage } from "@/modules/public-booking/types";

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

function altTextFor(image: PublicServiceImage, serviceName: string): string {
  return image.alt_text?.trim() || `${serviceName} service`;
}

/**
 * The public booking page's service visual — one component for every case
 * the catalogue and the selected/featured service both need:
 *
 *   0 images  → a quiet fallback glyph, no timer
 *   1 image   → static, no timer
 *   2+ images → soft cross-fade, one image visible at a time
 *
 * The container is always the same `fill`-positioned, caller-sized box
 * regardless of branch, so switching between these three cases (or between
 * services with different counts) never shifts layout. Respects
 * `prefers-reduced-motion`: reduced motion renders the first/cover image
 * statically instead of cycling, exactly like the single-image case.
 */
export function ServiceImageCarousel({
  images,
  serviceName,
  className = "",
}: {
  images: PublicServiceImage[];
  serviceName: string;
  className?: string;
}) {
  const sorted = useMemo(
    () =>
      [...images].sort((a, b) => {
        if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
        return a.sort_order - b.sort_order;
      }),
    [images]
  );
  const prefersReducedMotion = usePrefersReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);

  const animate = sorted.length > 1 && !prefersReducedMotion;

  // Resets the active slide whenever the actual image SET changes (a
  // different service, or images added/removed/reordered) — adjusted during
  // render, React's documented pattern for this, rather than in an effect,
  // which would cost an extra render and cannot run before the stale index
  // is briefly used to paint. The signature is real image ids, not just a
  // length, so a like-for-like reorder doesn't unnecessarily restart at 0.
  const signature = sorted.map((image) => image.id).join(",");
  const [renderedSignature, setRenderedSignature] = useState(signature);
  if (signature !== renderedSignature) {
    setRenderedSignature(signature);
    setActiveIndex(0);
  }

  useEffect(() => {
    // No timer at all for 0/1 image, and none under reduced motion — this is
    // not "a timer that happens not to fire," there is no interval object.
    if (!animate) return;
    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % sorted.length);
    }, VISIBLE_MS);
    return () => clearInterval(interval);
  }, [animate, sorted.length]);

  const containerClassName = `relative overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800 ${className}`;

  if (sorted.length === 0) {
    return (
      <div className={containerClassName}>
        <div className="absolute inset-0 flex items-center justify-center text-slate-300 dark:text-slate-600">
          <ImageIcon aria-hidden="true" className="h-1/4 w-1/4 min-h-6 min-w-6" />
        </div>
      </div>
    );
  }

  if (!animate) {
    const cover = sorted[0];
    return (
      <div className={containerClassName}>
        <NextImage
          src={cover.url}
          alt={altTextFor(cover, serviceName)}
          fill
          sizes="(min-width: 1024px) 320px, 45vw"
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div className={containerClassName}>
      {sorted.map((image, index) => (
        <NextImage
          key={image.id}
          src={image.url}
          alt={altTextFor(image, serviceName)}
          fill
          sizes="(min-width: 1024px) 320px, 45vw"
          priority={index === 0}
          className="object-cover"
          style={{
            opacity: index === activeIndex ? 1 : 0,
            transitionProperty: "opacity",
            transitionDuration: `${FADE_MS}ms`,
            transitionTimingFunction: "ease-in-out",
          }}
        />
      ))}
    </div>
  );
}
