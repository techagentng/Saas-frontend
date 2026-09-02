import { describe, expect, it } from "vitest";

import { dashboardNavItems, filterNavItems } from "@/lib/navigation/dashboard-nav";
import type { Permission } from "@/types/permission";
import type { BusinessType } from "@/types/tenant";

function visibleLabels(
  permissions: Permission[],
  businessType: BusinessType | null | undefined
): string[] {
  return filterNavItems(dashboardNavItems, {
    permissions: new Set(permissions),
    businessType,
  }).map((item) => item.label);
}

describe("filterNavItems — the two predicates together", () => {
  it("shows Services with the right business type AND service.read", () => {
    expect(visibleLabels(["service.read"], "NAIL_TECHNICIAN")).toContain("Services");
  });

  it("hides Services with the right business type but no service.read", () => {
    expect(visibleLabels([], "NAIL_TECHNICIAN")).not.toContain("Services");
  });

  it("hides Services with service.read but the wrong business type", () => {
    expect(visibleLabels(["service.read"], "RESTAURANT")).not.toContain("Services");
    expect(visibleLabels(["service.read"], "HOTEL")).not.toContain("Services");
    expect(visibleLabels(["service.read"], "TRANSPORT")).not.toContain("Services");
  });

  it("hides Services when neither predicate is satisfied", () => {
    expect(visibleLabels([], "RESTAURANT")).not.toContain("Services");
  });

  it("fails closed on a legacy tenant with no business type, even with the permission", () => {
    expect(visibleLabels(["service.read"], null)).not.toContain("Services");
  });

  it("leaves ungated items alone in every combination", () => {
    // Dashboard has neither a permission nor a business type, and must never
    // be filtered out by either predicate.
    expect(visibleLabels([], null)).toEqual(["Dashboard"]);
    expect(visibleLabels(["service.read"], "NAIL_TECHNICIAN")).toEqual(["Dashboard", "Services"]);
  });
});

describe("filterNavItems — Team (Scheduling S3)", () => {
  it("shows Team with staff.read, regardless of business type", () => {
    for (const businessType of ["NAIL_TECHNICIAN", "RESTAURANT", "HOTEL", "TRANSPORT"] as const) {
      expect(visibleLabels(["staff.read"], businessType)).toContain("Team");
    }
  });

  it("shows Team with staff.read even with no business type at all", () => {
    // Unlike Services, Team carries no vertical gate — a staff roster is
    // universal, so a legacy tenant with no business type still sees it.
    expect(visibleLabels(["staff.read"], null)).toContain("Team");
  });

  it("hides Team without staff.read", () => {
    expect(visibleLabels([], "NAIL_TECHNICIAN")).not.toContain("Team");
    expect(visibleLabels(["service.read"], "NAIL_TECHNICIAN")).not.toContain("Team");
  });
});

describe("filterNavItems — each predicate independently", () => {
  const icon = () => null;

  it("applies the permission predicate on its own", () => {
    const items = [{ label: "Gated", href: "/gated", icon, permission: "x.read" as Permission }];

    expect(filterNavItems(items, { permissions: new Set(["x.read"]), businessType: null })).toHaveLength(1);
    expect(filterNavItems(items, { permissions: new Set(), businessType: null })).toHaveLength(0);
  });

  it("applies the business-type predicate on its own", () => {
    const items = [
      { label: "Vertical", href: "/vertical", icon, businessTypes: ["HOTEL"] as BusinessType[] },
    ];

    expect(filterNavItems(items, { permissions: new Set(), businessType: "HOTEL" })).toHaveLength(1);
    expect(filterNavItems(items, { permissions: new Set(), businessType: "RESTAURANT" })).toHaveLength(0);
    expect(filterNavItems(items, { permissions: new Set(), businessType: null })).toHaveLength(0);
  });
});
