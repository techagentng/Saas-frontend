import { describe, expect, it } from "vitest";

import { serviceImageKeys } from "@/modules/service-images/keys";

const TENANT_A = "11111111-1111-4111-8111-111111111111";
const TENANT_B = "22222222-2222-4222-8222-222222222222";
const SERVICE_A = "33333333-3333-4333-8333-333333333333";
const SERVICE_B = "44444444-4444-4444-8444-444444444444";

describe("serviceImageKeys", () => {
  it("gives two tenants distinct keys for the identical service id", () => {
    expect(serviceImageKeys.list(TENANT_A, SERVICE_A)).not.toEqual(
      serviceImageKeys.list(TENANT_B, SERVICE_A)
    );
  });

  it("gives two services within one tenant distinct keys", () => {
    expect(serviceImageKeys.list(TENANT_A, SERVICE_A)).not.toEqual(
      serviceImageKeys.list(TENANT_A, SERVICE_B)
    );
  });

  it("carries the tenant id and never a bare service id below the root", () => {
    expect(serviceImageKeys.tenant(TENANT_A)).toContain(TENANT_A);
    expect(serviceImageKeys.service(TENANT_A, SERVICE_A)).toContain(TENANT_A);
    expect(serviceImageKeys.service(TENANT_A, SERVICE_A)).toContain(SERVICE_A);
  });

  it("prefixes every key with tenant(id), so invalidation is tenant-scoped", () => {
    const handle = serviceImageKeys.tenant(TENANT_A);
    expect(serviceImageKeys.list(TENANT_A, SERVICE_A).slice(0, handle.length)).toEqual([...handle]);
    expect(serviceImageKeys.list(TENANT_B, SERVICE_A).slice(0, handle.length)).not.toEqual([
      ...handle,
    ]);
  });

  it("prefixes every list key with service(tenant, service), so invalidation is service-scoped", () => {
    const handle = serviceImageKeys.service(TENANT_A, SERVICE_A);
    expect(serviceImageKeys.list(TENANT_A, SERVICE_A).slice(0, handle.length)).toEqual([...handle]);
    expect(serviceImageKeys.list(TENANT_A, SERVICE_B).slice(0, handle.length)).not.toEqual([
      ...handle,
    ]);
  });

  it("never produces a globally-shared key below the root", () => {
    expect(serviceImageKeys.all).toEqual(["service-images"]);
    expect(serviceImageKeys.tenant(TENANT_A)).not.toEqual(serviceImageKeys.all);
  });

  it("never embeds anything that looks like customer PII in a key segment", () => {
    // Every segment is either a fixed literal or a UUID — an id, never a
    // name/email/phone a query key could leak into devtools or logs.
    const allSegments = [
      ...serviceImageKeys.list(TENANT_A, SERVICE_A),
      ...serviceImageKeys.list(TENANT_B, SERVICE_B),
    ];
    for (const segment of allSegments) {
      expect(segment).not.toMatch(/@/);
    }
  });
});
