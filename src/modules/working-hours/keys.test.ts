import { describe, expect, it } from "vitest";

import { workingHoursKeys } from "@/modules/working-hours/keys";

const TENANT_A = "11111111-1111-4111-8111-111111111111";
const TENANT_B = "22222222-2222-4222-8222-222222222222";
const STAFF_ID = "33333333-3333-4333-8333-333333333333";

describe("workingHoursKeys", () => {
  it("gives two tenants distinct detail keys, even for the same staff id", () => {
    // The failure this prevents: one shared cache entry, so Tenant A's
    // schedule renders while Tenant B is selected.
    expect(workingHoursKeys.detail(TENANT_A, STAFF_ID)).not.toEqual(
      workingHoursKeys.detail(TENANT_B, STAFF_ID)
    );
  });

  it("carries the tenant id in every key it produces", () => {
    expect(workingHoursKeys.tenant(TENANT_A)).toContain(TENANT_A);
    expect(workingHoursKeys.detail(TENANT_A, STAFF_ID)).toContain(TENANT_A);
  });

  it("prefixes the detail key with that tenant's handle, so invalidation is scoped", () => {
    const handle = workingHoursKeys.tenant(TENANT_A);

    expect(workingHoursKeys.detail(TENANT_A, STAFF_ID).slice(0, handle.length)).toEqual([
      ...handle,
    ]);
    expect(workingHoursKeys.detail(TENANT_B, STAFF_ID).slice(0, handle.length)).not.toEqual([
      ...handle,
    ]);
  });

  it("never produces a globally-shared key below the root", () => {
    expect(workingHoursKeys.all).toEqual(["staff-working-hours"]);
    expect(workingHoursKeys.tenant(TENANT_A)).not.toEqual(workingHoursKeys.all);
  });
});
