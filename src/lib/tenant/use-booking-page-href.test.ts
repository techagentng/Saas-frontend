import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useBookingPageHref } from "@/lib/tenant/use-booking-page-href";
import type { Tenant } from "@/types/tenant";

let currentTenant: Tenant | null = null;

vi.mock("@/providers/tenant-provider", () => ({
  useTenant: () => ({ currentTenant }),
}));

function tenant(slug: string): Tenant {
  return {
    id: "t1",
    name: "Glamour Nails",
    slug,
    status: "ACTIVE",
    description: null,
    contact_email: null,
    contact_phone: null,
    timezone: null,
    business_type: "NAIL_TECHNICIAN",
    onboarding_status: "COMPLETED",
    onboarding_step: null,
    currency: null,
    created_at: "",
    updated_at: "",
  };
}

afterEach(() => {
  vi.unstubAllEnvs();
  currentTenant = null;
});

describe("useBookingPageHref", () => {
  it("builds the absolute URL from NEXT_PUBLIC_APP_URL", () => {
    currentTenant = tenant("glamour-nails");
    const { result } = renderHook(() => useBookingPageHref());

    expect(result.current.absolute).toBe("https://www.iweapps.com/book/glamour-nails");
    expect(result.current.href).toBe("https://www.iweapps.com/book/glamour-nails");
  });

  it("returns nulls when there is no tenant/slug", () => {
    currentTenant = null;
    const { result } = renderHook(() => useBookingPageHref());

    expect(result.current).toEqual({ absolute: null, href: null });
  });

  it("falls back to the relative /book/{slug} path when the env var is unset", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    currentTenant = tenant("glamour-nails");
    const { result } = renderHook(() => useBookingPageHref());

    expect(result.current.absolute).toBeNull();
    expect(result.current.href).toBe("/book/glamour-nails");
  });
});
