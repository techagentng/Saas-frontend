import { describe, expect, it } from "vitest";

import { isSchedulingBusinessType } from "@/lib/tenant/scheduling";

describe("isSchedulingBusinessType", () => {
  it("accepts the verticals that use the appointment-scheduling booking model", () => {
    expect(isSchedulingBusinessType("NAIL_TECHNICIAN")).toBe(true);
  });

  it("rejects verticals whose bookable unit is not a duration on a calendar", () => {
    // Restaurant books party size against floor capacity, hotel books
    // room-night inventory, transport books a seat on a fixed departure. None
    // of them belong to the scheduling module.
    expect(isSchedulingBusinessType("RESTAURANT")).toBe(false);
    expect(isSchedulingBusinessType("HOTEL")).toBe(false);
    expect(isSchedulingBusinessType("TRANSPORT")).toBe(false);
  });

  it("fails closed for a legacy tenant with no business type", () => {
    expect(isSchedulingBusinessType(null)).toBe(false);
    expect(isSchedulingBusinessType(undefined)).toBe(false);
  });
});
