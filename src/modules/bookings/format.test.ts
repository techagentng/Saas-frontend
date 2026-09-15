import { describe, expect, it } from "vitest";

import { formatBookingInstant, hasBookingEnded, toTenantLocalDateAndTime } from "./format";

describe("toTenantLocalDateAndTime — tenant timezone is authoritative", () => {
  it("renders a UTC instant in the tenant's own zone, not UTC", () => {
    // 09:00 UTC is 10:00 in Africa/Lagos (UTC+1, no DST).
    const result = toTenantLocalDateAndTime("2026-09-15T09:00:00Z", "Africa/Lagos");
    expect(result).toEqual({ date: "2026-09-15", time: "10:00" });
  });

  it("crosses a calendar day boundary correctly for a negative-offset zone", () => {
    // 02:00 UTC on the 16th is 21:00 on the 15th in America/New_York (UTC-5, EST in September... actually EDT UTC-4).
    const result = toTenantLocalDateAndTime("2026-09-16T02:00:00Z", "America/New_York");
    expect(result.date).toBe("2026-09-15");
    expect(result.time).toBe("22:00");
  });

  it("falls back to UTC — never the browser's zone — when the tenant has no configured timezone", () => {
    const result = toTenantLocalDateAndTime("2026-09-15T09:00:00Z", null);
    expect(result).toEqual({ date: "2026-09-15", time: "09:00" });
  });

  it("falls back to UTC for an invalid/unloadable timezone string", () => {
    const result = toTenantLocalDateAndTime("2026-09-15T09:00:00Z", "Not/AZone");
    expect(result).toEqual({ date: "2026-09-15", time: "09:00" });
  });

  it("zero-pads single-digit month/day/hour/minute", () => {
    const result = toTenantLocalDateAndTime("2026-01-05T08:05:00Z", "UTC");
    expect(result).toEqual({ date: "2026-01-05", time: "08:05" });
  });

  it("round-trips with formatBookingInstant's own zone resolution (same fallback rule)", () => {
    const machine = toTenantLocalDateAndTime("2026-09-15T09:00:00Z", "Africa/Lagos");
    const display = formatBookingInstant("2026-09-15T09:00:00Z", "Africa/Lagos");
    // "10:00" (machine, 24h) corresponds to "10:00 AM" (display, 12h).
    expect(machine.time).toBe("10:00");
    expect(display.time).toMatch(/^10:00\s?AM$/i);
  });
});

describe("hasBookingEnded — Scheduling S13-BE eligibility rule", () => {
  it("is false while the appointment is still in the future", () => {
    const now = new Date("2026-09-13T12:00:00Z");
    expect(hasBookingEnded("2099-01-01T09:00:00Z", now)).toBe(false);
  });

  it("is true once the appointment's end has passed", () => {
    const now = new Date("2026-09-13T12:00:00Z");
    expect(hasBookingEnded("2020-01-01T09:00:00Z", now)).toBe(true);
  });

  it("is true at the exact instant of end (>=, not >)", () => {
    const end = "2026-09-13T09:45:00Z";
    expect(hasBookingEnded(end, new Date(end))).toBe(true);
  });

  it("is false one millisecond before end", () => {
    const end = new Date("2026-09-13T09:45:00.000Z");
    const justBefore = new Date(end.getTime() - 1);
    expect(hasBookingEnded(end.toISOString(), justBefore)).toBe(false);
  });

  it("is timezone-independent — comparing instants, never reinterpreting either side in a zone", () => {
    // 2026-09-13T09:45:00Z is 10:45 in Africa/Lagos and 05:45 in
    // America/New_York, but the comparison is instant-vs-instant, so the
    // same real-world "now" gives the same answer regardless.
    const end = "2026-09-13T09:45:00Z";
    const now = new Date("2026-09-13T09:45:00Z");
    expect(hasBookingEnded(end, now)).toBe(true);
  });

  it("defaults to the real current time when no reference is given", () => {
    expect(hasBookingEnded("2020-01-01T00:00:00Z")).toBe(true);
    expect(hasBookingEnded("2099-01-01T00:00:00Z")).toBe(false);
  });
});
