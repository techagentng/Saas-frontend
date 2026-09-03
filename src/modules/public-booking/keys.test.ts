import { describe, expect, it } from "vitest";

import { serviceKeys } from "@/modules/services/keys";
import { publicBookingKeys } from "@/modules/public-booking/keys";

const SLUG = "glamour-nails";
const TENANT_ID = "11111111-1111-4111-8111-111111111111";

describe("publicBookingKeys", () => {
  it("keys by slug, matching the S8 spec exactly", () => {
    expect(publicBookingKeys.tenant(SLUG)).toEqual(["public-tenant", SLUG]);
    expect(publicBookingKeys.services(SLUG)).toEqual(["public-services", SLUG]);
  });

  it("is disjoint from the authenticated dashboard's tenant/service keys", () => {
    expect(publicBookingKeys.tenant(SLUG)).not.toEqual(["tenant", TENANT_ID]);
    expect(publicBookingKeys.services(SLUG)).not.toEqual(serviceKeys.list(TENANT_ID, "ACTIVE"));

    // No shared prefix: prefix-based cache invalidation on one side can never
    // reach the other.
    expect(publicBookingKeys.services(SLUG)[0]).not.toBe(serviceKeys.all[0]);
    expect(publicBookingKeys.tenant(SLUG)[0]).toBe("public-tenant");
  });

  it("gives two slugs distinct keys", () => {
    expect(publicBookingKeys.tenant("salon-a")).not.toEqual(publicBookingKeys.tenant("salon-b"));
    expect(publicBookingKeys.services("salon-a")).not.toEqual(publicBookingKeys.services("salon-b"));
  });

  it("shares the slug between tenant and services keys so the two pages hit one cache entry", () => {
    expect(publicBookingKeys.tenant(SLUG)[1]).toBe(publicBookingKeys.services(SLUG)[1]);
  });
});

describe("publicBookingKeys — S9 availability", () => {
  it("keys technician discovery by slug + service", () => {
    expect(publicBookingKeys.serviceStaff(SLUG, "svc1")).toEqual([
      "public-service-staff",
      SLUG,
      "svc1",
    ]);
  });

  it("keys availability by every discriminating input", () => {
    expect(publicBookingKeys.availability(SLUG, "svc1", "staff1", "2026-09-07")).toEqual([
      "public-availability",
      SLUG,
      "svc1",
      "staff1",
      "2026-09-07",
    ]);
  });

  it("gives a different availability key when any of service, staff or date changes", () => {
    const base = publicBookingKeys.availability(SLUG, "svc1", "staff1", "2026-09-07");
    expect(base).not.toEqual(publicBookingKeys.availability(SLUG, "svc2", "staff1", "2026-09-07"));
    expect(base).not.toEqual(publicBookingKeys.availability(SLUG, "svc1", "staff2", "2026-09-07"));
    expect(base).not.toEqual(publicBookingKeys.availability(SLUG, "svc1", "staff1", "2026-09-08"));
  });

  it("stays disjoint from the dashboard's availability data (which is tenant-id scoped)", () => {
    expect(publicBookingKeys.availability(SLUG, "svc1", "staff1", "2026-09-07")[0]).toBe(
      "public-availability"
    );
  });

  it("availabilityForSlug is the exact prefix of every per-day key (S10 invalidation handle)", () => {
    const prefix = publicBookingKeys.availabilityForSlug(SLUG);
    expect(prefix).toEqual(["public-availability", SLUG]);

    const full = publicBookingKeys.availability(SLUG, "svc1", "staff1", "2026-09-07");
    expect(full.slice(0, prefix.length)).toEqual([...prefix]);
    // A different business is not caught by this prefix.
    expect(publicBookingKeys.availability("other-salon", "svc1", "staff1", "2026-09-07").slice(0, 2)).not.toEqual([
      ...prefix,
    ]);
  });
});
