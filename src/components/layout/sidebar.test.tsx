import { cleanup, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Permission } from "@/types/permission";
import type { BusinessType, Tenant } from "@/types/tenant";

import { Sidebar } from "./sidebar";

const granted = new Set<Permission>();
let currentTenant: Tenant | null = null;
let pathname = "/dashboard";

vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
}));

vi.mock("@/providers/permissions-provider", () => ({
  usePermissions: () => granted,
}));

vi.mock("@/providers/tenant-provider", () => ({
  useTenant: () => ({ currentTenant }),
}));

function tenantWith(businessType: BusinessType | null): Tenant {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Luxe Nails Studio",
    slug: "luxe-nails",
    status: "ACTIVE",
    description: null,
    contact_email: null,
    contact_phone: null,
    timezone: "Africa/Lagos",
    business_type: businessType,
    onboarding_status: "COMPLETED",
    onboarding_step: "business_profile",
    currency: "NGN",
    created_at: "2026-08-27T10:00:00Z",
    updated_at: "2026-08-27T10:00:00Z",
  };
}

function setup(options: {
  permissions?: Permission[];
  businessType?: BusinessType | null;
  path?: string;
  tenant?: boolean;
} = {}) {
  granted.clear();
  for (const permission of options.permissions ?? []) granted.add(permission);
  currentTenant =
    options.tenant === false
      ? null
      : tenantWith("businessType" in options ? (options.businessType ?? null) : "NAIL_TECHNICIAN");
  pathname = options.path ?? "/dashboard";
  return render(<Sidebar />);
}

beforeEach(() => {
  granted.clear();
  currentTenant = null;
  pathname = "/dashboard";
});

describe("Sidebar — never renders empty", () => {
  it("always shows branding and the ungated Dashboard link", () => {
    // The worst case: no tenant, no permissions. Even here the sidebar must
    // not be a blank 256px column.
    setup({ tenant: false, permissions: [] });

    expect(screen.getByLabelText("BookFlow home")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("href", "/dashboard");
  });

  it("names the workspace the links act on", () => {
    setup({ permissions: ["service.read"] });

    expect(screen.getByText("Luxe Nails Studio")).toBeInTheDocument();
    expect(screen.getByText("Nail Technician")).toBeInTheDocument();
  });

  it("shows the roadmap group as non-clickable rows, never as links", () => {
    // "Technicians" was promoted out of this list into the real nav (as
    // "Team") when Scheduling S3 shipped — see dashboard-nav.ts.
    setup({ permissions: ["service.read"] });

    for (const label of ["Availability", "Bookings", "Customers"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
      expect(screen.queryByRole("link", { name: new RegExp(label, "i") })).not.toBeInTheDocument();
    }
    expect(screen.getAllByText("Soon")).toHaveLength(3);
  });
});

describe("Sidebar — Team (Scheduling S3)", () => {
  it("shows the roster link for a tenant with staff.read, regardless of business type", () => {
    setup({ permissions: ["staff.read"], businessType: "RESTAURANT" });

    expect(screen.getByRole("link", { name: "Team" })).toHaveAttribute("href", "/dashboard/team");
  });

  it("hides the roster link without the permission", () => {
    setup({ permissions: [], businessType: "NAIL_TECHNICIAN" });

    expect(screen.queryByRole("link", { name: /technicians|team/i })).not.toBeInTheDocument();
  });
});

describe("Sidebar — vertical-aware roster label (V1)", () => {
  it("labels the roster link 'Technicians' for a nail tenant", () => {
    setup({ permissions: ["staff.read"], businessType: "NAIL_TECHNICIAN" });

    expect(screen.getByRole("link", { name: "Technicians" })).toHaveAttribute(
      "href",
      "/dashboard/team"
    );
    expect(screen.queryByRole("link", { name: "Team" })).not.toBeInTheDocument();
  });

  it("labels the roster link 'Drivers' for a transport tenant", () => {
    setup({ permissions: ["staff.read"], businessType: "TRANSPORT" });

    expect(screen.getByRole("link", { name: "Drivers" })).toHaveAttribute(
      "href",
      "/dashboard/team"
    );
  });

  it("labels the roster link 'Team' for hotel and restaurant tenants", () => {
    for (const businessType of ["HOTEL", "RESTAURANT"] as const) {
      setup({ permissions: ["staff.read"], businessType });
      expect(screen.getByRole("link", { name: "Team" })).toHaveAttribute(
        "href",
        "/dashboard/team"
      );
      cleanup();
    }
  });

  it("labels the roster link 'Team' for an unknown business type (fail-safe)", () => {
    setup({ permissions: ["staff.read"], businessType: null });

    expect(screen.getByRole("link", { name: "Team" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Technicians" })).not.toBeInTheDocument();
  });

  it("updates the label when the tenant switches vertical, with no stale label left", () => {
    const { rerender } = setup({ permissions: ["staff.read"], businessType: "NAIL_TECHNICIAN" });
    expect(screen.getByRole("link", { name: "Technicians" })).toBeInTheDocument();

    currentTenant = tenantWith("TRANSPORT");
    rerender(<Sidebar />);

    expect(screen.getByRole("link", { name: "Drivers" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Technicians" })).not.toBeInTheDocument();
  });
});

describe("Sidebar — gating still applies", () => {
  it("shows Services for a scheduling tenant with service.read", () => {
    setup({ permissions: ["service.read"], businessType: "NAIL_TECHNICIAN" });

    expect(screen.getByRole("link", { name: "Services" })).toHaveAttribute(
      "href",
      "/dashboard/services"
    );
  });

  it("hides Services without the permission", () => {
    setup({ permissions: [], businessType: "NAIL_TECHNICIAN" });

    expect(screen.queryByRole("link", { name: "Services" })).not.toBeInTheDocument();
  });

  it("hides Services for a non-scheduling vertical", () => {
    setup({ permissions: ["service.read"], businessType: "RESTAURANT" });

    expect(screen.queryByRole("link", { name: "Services" })).not.toBeInTheDocument();
  });
});

describe("Sidebar — active state", () => {
  it("marks only the deepest matching route as current", () => {
    setup({ permissions: ["service.read"], path: "/dashboard/services" });

    const nav = screen.getByRole("navigation", { name: "Primary" });
    expect(within(nav).getByRole("link", { name: "Services" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(within(nav).getByRole("link", { name: "Dashboard" })).not.toHaveAttribute(
      "aria-current"
    );
  });

  it("marks Dashboard current on the dashboard root", () => {
    setup({ permissions: ["service.read"], path: "/dashboard" });

    const nav = screen.getByRole("navigation", { name: "Primary" });
    expect(within(nav).getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "aria-current",
      "page"
    );
  });
});
