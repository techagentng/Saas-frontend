import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PublicServiceImage } from "@/modules/public-booking/types";

import { ServiceImageCarousel } from "./service-image-carousel";

function image(id: string, overrides: Partial<PublicServiceImage> = {}): PublicServiceImage {
  return {
    id,
    url: `https://cdn.example.test/${id}.jpg`,
    alt_text: null,
    sort_order: 0,
    is_primary: false,
    ...overrides,
  };
}

/** Controls `window.matchMedia("(prefers-reduced-motion: reduce)")` per test. */
function stubReducedMotion(matches: boolean) {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  window.matchMedia = vi.fn().mockReturnValue({
    matches,
    media: "(prefers-reduced-motion: reduce)",
    addEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) =>
      listeners.add(listener),
    removeEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) =>
      listeners.delete(listener),
  });
}

beforeEach(() => {
  stubReducedMotion(false);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("ServiceImageCarousel — 0 images", () => {
  it("renders a fallback with no <img> and starts no timer", () => {
    vi.useFakeTimers();
    render(<ServiceImageCarousel images={[]} serviceName="Gel Manicure" />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();

    // If a timer were running, advancing it would not matter since there are
    // no images to cycle through, but this also proves nothing throws.
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});

describe("ServiceImageCarousel — 1 image", () => {
  it("renders it statically, with the service-name fallback alt text", () => {
    render(
      <ServiceImageCarousel images={[image("a")]} serviceName="Gel Manicure" />
    );

    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("alt", "Gel Manicure service");
  });

  it("prefers the image's own alt text when present", () => {
    render(
      <ServiceImageCarousel
        images={[image("a", { alt_text: "Freshly painted nails" })]}
        serviceName="Gel Manicure"
      />
    );

    expect(screen.getByRole("img")).toHaveAttribute("alt", "Freshly painted nails");
  });
});

describe("ServiceImageCarousel — 2+ images", () => {
  it("renders every image and cross-fades the active one over time", () => {
    vi.useFakeTimers();
    render(
      <ServiceImageCarousel
        images={[image("a"), image("b"), image("c")]}
        serviceName="Gel Manicure"
      />
    );

    const imgs = screen.getAllByRole("img");
    expect(imgs).toHaveLength(3);
    expect(imgs[0]).toHaveStyle({ opacity: "1" });
    expect(imgs[1]).toHaveStyle({ opacity: "0" });

    act(() => {
      vi.advanceTimersByTime(4500);
    });
    expect(imgs[1]).toHaveStyle({ opacity: "1" });
    expect(imgs[0]).toHaveStyle({ opacity: "0" });
  });

  it("shows the primary image first regardless of sort_order", () => {
    render(
      <ServiceImageCarousel
        images={[
          image("a", { sort_order: 0, is_primary: false }),
          image("b", { sort_order: 1, is_primary: true }),
        ]}
        serviceName="Gel Manicure"
      />
    );

    const imgs = screen.getAllByRole("img");
    expect(imgs[0]).toHaveAttribute("src", expect.stringContaining("b"));
  });
});

describe("ServiceImageCarousel — prefers-reduced-motion", () => {
  it("renders the first image statically and starts no cycling timer", () => {
    stubReducedMotion(true);
    vi.useFakeTimers();

    render(
      <ServiceImageCarousel
        images={[image("a"), image("b")]}
        serviceName="Gel Manicure"
      />
    );

    // Reduced motion collapses the 2+ case to the same static rendering as
    // the 1-image case: exactly one <img>, not one per source image.
    const imgs = screen.getAllByRole("img");
    expect(imgs).toHaveLength(1);
    expect(imgs[0]).toHaveAttribute("src", expect.stringContaining("a"));

    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(screen.getAllByRole("img")).toHaveLength(1);
  });
});
