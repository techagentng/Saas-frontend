import { afterEach, describe, expect, it, vi } from "vitest";

import { getBookingUrl, getPublicAppUrl } from "@/lib/config/public-url";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getPublicAppUrl", () => {
  it("returns the configured origin", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://www.iweapps.com");
    expect(getPublicAppUrl()).toBe("https://www.iweapps.com");
  });

  it("normalizes one or more trailing slashes", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://www.iweapps.com/");
    expect(getPublicAppUrl()).toBe("https://www.iweapps.com");

    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://www.iweapps.com///");
    expect(getPublicAppUrl()).toBe("https://www.iweapps.com");
  });

  it("trims surrounding whitespace", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "  https://www.iweapps.com  ");
    expect(getPublicAppUrl()).toBe("https://www.iweapps.com");
  });

  it("throws a helpful error when unset or blank", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    expect(() => getPublicAppUrl()).toThrow(/NEXT_PUBLIC_APP_URL is not set/);
  });
});

describe("getBookingUrl", () => {
  it("builds a booking URL with exactly one slash before /book", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://www.iweapps.com");
    expect(getBookingUrl("glamour-nails")).toBe("https://www.iweapps.com/book/glamour-nails");
  });

  it("does not produce a double slash when the configured value had a trailing one", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://www.iweapps.com/");
    expect(getBookingUrl("glamour-nails")).toBe("https://www.iweapps.com/book/glamour-nails");
    expect(getBookingUrl("glamour-nails")).not.toContain("//book");
  });

  it("works against a localhost dev origin", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
    expect(getBookingUrl("foo")).toBe("http://localhost:3000/book/foo");
  });
});
