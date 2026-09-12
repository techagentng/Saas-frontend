import { describe, expect, it } from "vitest";

import { bookingKeys } from "./keys";

const TENANT_A = "11111111-1111-4111-8111-111111111111";
const TENANT_B = "22222222-2222-4222-8222-222222222222";

describe("bookingKeys — tenant scoping", () => {
  it("every key carries the tenant id, and different tenants never collide", () => {
    const listA = bookingKeys.list(TENANT_A, { view: "UPCOMING" });
    const listB = bookingKeys.list(TENANT_B, { view: "UPCOMING" });
    expect(listA).not.toEqual(listB);
    expect(listA).toContain(TENANT_A);
    expect(listB).toContain(TENANT_B);
  });

  it("tenant(id) prefixes list and detail, so a prefix invalidation covers both", () => {
    const tenant = bookingKeys.tenant(TENANT_A);
    const list = bookingKeys.list(TENANT_A, { view: "UPCOMING" });
    const detail = bookingKeys.detail(TENANT_A, "booking-1");

    expect(list.slice(0, tenant.length)).toEqual(tenant);
    expect(detail.slice(0, tenant.length)).toEqual(tenant);
  });
});

describe("bookingKeys.list — every filter that changes the request changes the key", () => {
  it("distinguishes by view", () => {
    const upcoming = bookingKeys.list(TENANT_A, { view: "UPCOMING" });
    const past = bookingKeys.list(TENANT_A, { view: "PAST" });
    const cancelled = bookingKeys.list(TENANT_A, { view: "CANCELLED" });
    const all = bookingKeys.list(TENANT_A, { view: "ALL" });

    const keys = [upcoming, past, cancelled, all].map((k) => JSON.stringify(k));
    expect(new Set(keys).size).toBe(4);
  });

  it("distinguishes by staffId", () => {
    const none = bookingKeys.list(TENANT_A, { view: "UPCOMING" });
    const withStaff = bookingKeys.list(TENANT_A, { view: "UPCOMING", staffId: "staff-1" });
    expect(none).not.toEqual(withStaff);
  });

  it("distinguishes by serviceId", () => {
    const none = bookingKeys.list(TENANT_A, { view: "UPCOMING" });
    const withService = bookingKeys.list(TENANT_A, { view: "UPCOMING", serviceId: "svc-1" });
    expect(none).not.toEqual(withService);
  });

  it("distinguishes by date", () => {
    const none = bookingKeys.list(TENANT_A, { view: "UPCOMING" });
    const withDate = bookingKeys.list(TENANT_A, { view: "UPCOMING", date: "2026-09-12" });
    expect(none).not.toEqual(withDate);
  });

  it("distinguishes a combined filter from any single one of its parts", () => {
    const combined = bookingKeys.list(TENANT_A, {
      view: "UPCOMING",
      staffId: "staff-1",
      serviceId: "svc-1",
      date: "2026-09-12",
    });
    const staffOnly = bookingKeys.list(TENANT_A, { view: "UPCOMING", staffId: "staff-1" });
    const serviceOnly = bookingKeys.list(TENANT_A, { view: "UPCOMING", serviceId: "svc-1" });
    const dateOnly = bookingKeys.list(TENANT_A, { view: "UPCOMING", date: "2026-09-12" });

    expect(combined).not.toEqual(staffOnly);
    expect(combined).not.toEqual(serviceOnly);
    expect(combined).not.toEqual(dateOnly);
  });

  it("treats an omitted filter the same as an explicit null/undefined (no leaked undefined vs null distinction)", () => {
    const omitted = bookingKeys.list(TENANT_A, { view: "UPCOMING" });
    const explicitNull = bookingKeys.list(TENANT_A, {
      view: "UPCOMING",
      staffId: null,
      serviceId: null,
      date: null,
    });
    expect(omitted).toEqual(explicitNull);
  });
});

describe("bookingKeys.detail", () => {
  it("distinguishes by booking id", () => {
    const a = bookingKeys.detail(TENANT_A, "booking-1");
    const b = bookingKeys.detail(TENANT_A, "booking-2");
    expect(a).not.toEqual(b);
  });
});
