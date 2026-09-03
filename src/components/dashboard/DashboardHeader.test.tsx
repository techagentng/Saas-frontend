import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Tenant } from "@/types/tenant";

import { DashboardHeader } from "./DashboardHeader";

let currentTenant: Tenant | null = null;

vi.mock("@/providers/tenant-provider", () => ({
  useTenant: () => ({ currentTenant }),
}));

function tenant(overrides: Partial<Tenant> = {}): Tenant {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Glamour Nails",
    slug: "glamour-nails",
    status: "ACTIVE",
    description: null,
    contact_email: null,
    contact_phone: null,
    timezone: null,
    business_type: "NAIL_TECHNICIAN",
    onboarding_status: "COMPLETED",
    onboarding_step: null,
    currency: "NGN",
    created_at: "2026-09-01T00:00:00Z",
    updated_at: "2026-09-01T00:00:00Z",
    ...overrides,
  };
}

beforeEach(() => {
  currentTenant = tenant();
});

describe("DashboardHeader — View booking page", () => {
  it("links to the public booking page using the canonical NEXT_PUBLIC_APP_URL", () => {
    render(<DashboardHeader />);

    const link = screen.getByRole("link", { name: /view booking page/i });
    expect(link).toHaveAttribute("href", "https://www.iweapps.com/book/glamour-nails");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
  });

  it("uses each tenant's own slug", () => {
    currentTenant = tenant({ slug: "polish-parlour" });
    render(<DashboardHeader />);

    expect(screen.getByRole("link", { name: /view booking page/i })).toHaveAttribute(
      "href",
      "https://www.iweapps.com/book/polish-parlour"
    );
  });

  it("falls back to a disabled button when there is no workspace yet", () => {
    currentTenant = null;
    render(<DashboardHeader />);

    expect(screen.queryByRole("link", { name: /view booking page/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /view booking page/i })).toBeDisabled();
  });
});
