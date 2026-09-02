import { describe, expect, it } from "vitest";

import { staffKeys } from "@/modules/staff/keys";

const TENANT_A = "11111111-1111-4111-8111-111111111111";
const TENANT_B = "22222222-2222-4222-8222-222222222222";
const STAFF_ID = "33333333-3333-4333-8333-333333333333";

describe("staffKeys", () => {
  it("gives two tenants distinct list keys", () => {
    // The failure this prevents: one shared cache entry, so Tenant A's
    // roster renders while Tenant B is selected.
    expect(staffKeys.list(TENANT_A, "ALL")).not.toEqual(staffKeys.list(TENANT_B, "ALL"));
  });

  it("gives two tenants distinct detail keys, even for the same staff id", () => {
    expect(staffKeys.detail(TENANT_A, STAFF_ID)).not.toEqual(staffKeys.detail(TENANT_B, STAFF_ID));
  });

  it("gives two tenants distinct capability keys, even for the same staff id", () => {
    expect(staffKeys.capabilities(TENANT_A, STAFF_ID)).not.toEqual(
      staffKeys.capabilities(TENANT_B, STAFF_ID)
    );
  });

  it("carries the tenant id in every key it produces", () => {
    expect(staffKeys.tenant(TENANT_A)).toContain(TENANT_A);
    expect(staffKeys.list(TENANT_A, "ACTIVE")).toContain(TENANT_A);
    expect(staffKeys.detail(TENANT_A, STAFF_ID)).toContain(TENANT_A);
    expect(staffKeys.capabilities(TENANT_A, STAFF_ID)).toContain(TENANT_A);
  });

  it("distinguishes list filters within one tenant", () => {
    expect(staffKeys.list(TENANT_A, "ACTIVE")).not.toEqual(staffKeys.list(TENANT_A, "ALL"));
  });

  it("prefixes every tenant-scoped key with that tenant's handle, so invalidation is scoped", () => {
    // TanStack Query matches by prefix: invalidating tenant(A) must reach A's
    // lists, details, and capability queries, and must not reach B's.
    const handle = staffKeys.tenant(TENANT_A);

    expect(staffKeys.list(TENANT_A, "ALL").slice(0, handle.length)).toEqual([...handle]);
    expect(staffKeys.detail(TENANT_A, STAFF_ID).slice(0, handle.length)).toEqual([...handle]);
    expect(staffKeys.capabilities(TENANT_A, STAFF_ID).slice(0, handle.length)).toEqual([
      ...handle,
    ]);
    expect(staffKeys.list(TENANT_B, "ALL").slice(0, handle.length)).not.toEqual([...handle]);
  });

  it("never produces a globally-shared key below the root", () => {
    expect(staffKeys.all).toEqual(["staff"]);
    expect(staffKeys.tenant(TENANT_A)).not.toEqual(staffKeys.all);
  });
});
