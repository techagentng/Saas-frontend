import { describe, expect, it } from "vitest";

import { serviceKeys } from "@/modules/services/keys";

const TENANT_A = "11111111-1111-4111-8111-111111111111";
const TENANT_B = "22222222-2222-4222-8222-222222222222";
const SERVICE_ID = "33333333-3333-4333-8333-333333333333";

describe("serviceKeys", () => {
  it("gives two tenants distinct list keys", () => {
    // The failure this prevents: one shared cache entry, so Tenant A's catalog
    // renders while Tenant B is selected.
    expect(serviceKeys.list(TENANT_A, "ALL")).not.toEqual(serviceKeys.list(TENANT_B, "ALL"));
  });

  it("gives two tenants distinct detail keys, even for the same service id", () => {
    expect(serviceKeys.detail(TENANT_A, SERVICE_ID)).not.toEqual(
      serviceKeys.detail(TENANT_B, SERVICE_ID)
    );
  });

  it("carries the tenant id in every key it produces", () => {
    expect(serviceKeys.tenant(TENANT_A)).toContain(TENANT_A);
    expect(serviceKeys.list(TENANT_A, "ACTIVE")).toContain(TENANT_A);
    expect(serviceKeys.detail(TENANT_A, SERVICE_ID)).toContain(TENANT_A);
  });

  it("distinguishes list filters within one tenant", () => {
    expect(serviceKeys.list(TENANT_A, "ACTIVE")).not.toEqual(serviceKeys.list(TENANT_A, "ALL"));
  });

  it("prefixes every tenant-scoped key with that tenant's handle, so invalidation is scoped", () => {
    // TanStack Query matches by prefix: invalidating tenant(A) must reach A's
    // lists and details, and must not reach B's.
    const handle = serviceKeys.tenant(TENANT_A);

    expect(serviceKeys.list(TENANT_A, "ALL").slice(0, handle.length)).toEqual([...handle]);
    expect(serviceKeys.detail(TENANT_A, SERVICE_ID).slice(0, handle.length)).toEqual([...handle]);
    expect(serviceKeys.list(TENANT_B, "ALL").slice(0, handle.length)).not.toEqual([...handle]);
  });

  it("never produces a globally-shared key below the root", () => {
    expect(serviceKeys.all).toEqual(["services"]);
    expect(serviceKeys.tenant(TENANT_A)).not.toEqual(serviceKeys.all);
  });
});
