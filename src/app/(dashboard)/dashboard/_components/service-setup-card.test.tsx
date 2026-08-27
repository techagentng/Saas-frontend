import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Service } from "@/modules/services/types";
import type { Permission } from "@/types/permission";
import type { BusinessType, Tenant } from "@/types/tenant";

import { ServiceSetupCard } from "./service-setup-card";

const granted = new Set<Permission>();

vi.mock("@/providers/permissions-provider", () => ({
  useCan: (permission: Permission) => granted.has(permission),
}));

let currentTenant: Tenant | null = null;

vi.mock("@/providers/tenant-provider", () => ({
  useTenant: () => ({ currentTenant }),
}));

const servicesResult = {
  data: [] as Service[],
  isSuccess: true,
};

vi.mock("@/modules/services/queries", () => ({
  useServices: () => servicesResult,
}));

function tenantWith(businessType: BusinessType | null): Tenant {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Polished",
    slug: "polished",
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

const service: Service = {
  id: "33333333-3333-4333-8333-333333333333",
  name: "Gel Manicure",
  description: null,
  duration_minutes: 60,
  price_minor: 1999,
  status: "ACTIVE",
  created_at: "2026-08-27T10:00:00Z",
  updated_at: "2026-08-27T10:00:00Z",
};

function setup(options: {
  businessType: BusinessType | null;
  permissions: Permission[];
  services?: Service[];
  isSuccess?: boolean;
}) {
  granted.clear();
  for (const permission of options.permissions) granted.add(permission);

  currentTenant = tenantWith(options.businessType);
  servicesResult.data = options.services ?? [];
  servicesResult.isSuccess = options.isSuccess ?? true;

  return render(<ServiceSetupCard />);
}

beforeEach(() => {
  granted.clear();
  currentTenant = null;
});

describe("ServiceSetupCard — visibility", () => {
  it("renders nothing without a resolved workspace", () => {
    granted.add("service.read");
    const { container } = render(<ServiceSetupCard />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing for a business type that does not use a service catalog", () => {
    const { container } = setup({ businessType: "RESTAURANT", permissions: ["service.read"] });
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing for a legacy tenant with no business type", () => {
    const { container } = setup({ businessType: null, permissions: ["service.read"] });
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing without service.read", () => {
    const { container } = setup({ businessType: "NAIL_TECHNICIAN", permissions: [] });
    expect(container).toBeEmptyDOMElement();
  });

  it("claims nothing about the catalog until the query has resolved", () => {
    const { container } = setup({
      businessType: "NAIL_TECHNICIAN",
      permissions: ["service.read", "service.create"],
      isSuccess: false,
    });
    expect(container).toBeEmptyDOMElement();
  });
});

describe("ServiceSetupCard — state", () => {
  it("prompts setup when the catalog is empty and the user can create", () => {
    setup({
      businessType: "NAIL_TECHNICIAN",
      permissions: ["service.read", "service.create"],
      services: [],
    });

    expect(screen.getByRole("heading", { name: "Add your services" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Set up services" })).toHaveAttribute(
      "href",
      "/dashboard/services"
    );
  });

  it("does not offer to add services to a user who cannot create them", () => {
    setup({ businessType: "NAIL_TECHNICIAN", permissions: ["service.read"], services: [] });

    expect(screen.queryByRole("heading", { name: "Add your services" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View services" })).toBeInTheDocument();
  });

  it("becomes a manage link once services exist", () => {
    setup({
      businessType: "NAIL_TECHNICIAN",
      permissions: ["service.read", "service.create"],
      services: [service],
    });

    expect(screen.queryByRole("heading", { name: "Add your services" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Manage services" })).toBeInTheDocument();
    expect(screen.getByText(/1 service customers will be able to book/i)).toBeInTheDocument();
  });

  it("counts only active services, so an all-archived catalog still prompts setup", () => {
    setup({
      businessType: "NAIL_TECHNICIAN",
      permissions: ["service.read", "service.create"],
      services: [{ ...service, status: "ARCHIVED" }],
    });

    expect(screen.getByRole("heading", { name: "Add your services" })).toBeInTheDocument();
  });
});
