import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Service } from "@/modules/services/types";
import type { Permission } from "@/types/permission";

import { ServiceCatalog } from "./service-catalog";

/**
 * Behaviour under test: which controls a given permission set produces. The
 * data layer and the capability source are both stubbed, because neither is
 * what this asserts — the point is that `service.read` alone yields a readable
 * catalog with no way to change it, which is exactly the STAFF experience.
 */

const granted = new Set<Permission>();

vi.mock("@/providers/permissions-provider", () => ({
  useCan: (permission: Permission) => granted.has(permission),
}));

const servicesResult = {
  data: [] as Service[],
  isPending: false,
  isSuccess: true,
  isError: false,
  error: null as unknown,
  refetch: vi.fn(),
};

vi.mock("@/modules/services/queries", () => ({
  useServices: () => servicesResult,
  useCreateService: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateService: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useArchiveService: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

const TENANT_ID = "11111111-1111-4111-8111-111111111111";

const manicure: Service = {
  id: "33333333-3333-4333-8333-333333333333",
  name: "Gel Manicure",
  description: "Soak-off gel, shaping and cuticle care.",
  duration_minutes: 60,
  price_minor: 1999,
  status: "ACTIVE",
  created_at: "2026-08-27T10:00:00Z",
  updated_at: "2026-08-27T10:00:00Z",
};

function renderCatalog(permissions: Permission[], services: Service[] = [manicure]) {
  granted.clear();
  for (const permission of permissions) granted.add(permission);

  servicesResult.data = services;
  servicesResult.isPending = false;
  servicesResult.isSuccess = true;
  servicesResult.isError = false;

  return render(<ServiceCatalog tenantId={TENANT_ID} currency="NGN" />);
}

beforeEach(() => {
  granted.clear();
});

describe("ServiceCatalog — read-only access", () => {
  it("shows the catalog but no mutation controls", () => {
    renderCatalog(["service.read"]);

    expect(screen.getByText("Gel Manicure")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /add service/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^archive/i })).not.toBeInTheDocument();
  });

  it("shows the empty state without an add control", () => {
    renderCatalog(["service.read"], []);

    expect(screen.getByText("No services yet")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /add service/i })).not.toBeInTheDocument();
    expect(screen.getByText(/ask an owner to add the first service/i)).toBeInTheDocument();
  });
});

describe("ServiceCatalog — per-permission controls", () => {
  it("service.create reveals the add control", () => {
    renderCatalog(["service.read", "service.create"]);

    expect(screen.getByRole("button", { name: /add service/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /edit gel manicure/i })).not.toBeInTheDocument();
  });

  it("service.update reveals the edit control", () => {
    renderCatalog(["service.read", "service.update"]);

    expect(screen.getByRole("button", { name: /edit gel manicure/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /archive gel manicure/i })).not.toBeInTheDocument();
  });

  it("service.archive reveals the archive control", () => {
    renderCatalog(["service.read", "service.archive"]);

    expect(screen.getByRole("button", { name: /archive gel manicure/i })).toBeInTheDocument();
  });

  it("offers no archive control for an already-archived service", () => {
    // Archiving an archived service is a server-side no-op, so the control is
    // absent rather than present and inert.
    renderCatalog(["service.read", "service.archive", "service.update"], [
      { ...manicure, status: "ARCHIVED" },
    ]);

    expect(screen.getByText("Archived")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /archive gel manicure/i })).not.toBeInTheDocument();
    // Archived services remain editable server-side (the update endpoint has
    // no status check), so the edit control stays.
    expect(screen.getByRole("button", { name: /edit gel manicure/i })).toBeInTheDocument();
  });
});

describe("ServiceCatalog — rendering", () => {
  it("shows duration and the tenant's currency, never internal identifiers", () => {
    renderCatalog(["service.read"]);

    expect(screen.getByText("1 hr")).toBeInTheDocument();
    expect(screen.getByText(/₦19\.99/)).toBeInTheDocument();
    expect(screen.queryByText(manicure.id)).not.toBeInTheDocument();
    expect(screen.queryByText(TENANT_ID)).not.toBeInTheDocument();
    expect(screen.queryByText(/2026-08-27/)).not.toBeInTheDocument();
  });
});
