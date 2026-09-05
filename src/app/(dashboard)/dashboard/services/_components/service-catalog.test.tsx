import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ServiceCategory } from "@/modules/service-categories/types";
import type { ServiceSuggestion } from "@/modules/service-suggestions/types";
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

const categoriesResult = {
  data: [] as ServiceCategory[],
  isPending: false,
  isSuccess: true,
  isError: false,
  error: null as unknown,
  refetch: vi.fn(),
};

const suggestionsResult = {
  data: [] as ServiceSuggestion[],
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

vi.mock("@/modules/service-categories/queries", () => ({
  useServiceCategories: () => categoriesResult,
  useCreateServiceCategory: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateServiceCategory: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useArchiveServiceCategory: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("@/modules/service-suggestions/queries", () => ({
  useServiceSuggestions: () => suggestionsResult,
}));

const TENANT_ID = "11111111-1111-4111-8111-111111111111";

const manicure: Service = {
  id: "33333333-3333-4333-8333-333333333333",
  name: "Gel Manicure",
  description: "Soak-off gel, shaping and cuticle care.",
  duration_minutes: 60,
  price_minor: 1999,
  category_id: null,
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

  categoriesResult.data = [];
  categoriesResult.isPending = false;
  categoriesResult.isSuccess = true;
  categoriesResult.isError = false;

  suggestionsResult.data = [];
  suggestionsResult.isPending = false;
  suggestionsResult.isSuccess = true;
  suggestionsResult.isError = false;

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

describe("ServiceCatalog — grouped by category", () => {
  const naturalNails: ServiceCategory = {
    id: "cat-natural-nails",
    name: "Natural Nails",
    sort_order: 0,
    status: "ACTIVE",
    created_at: "2026-08-27T10:00:00Z",
    updated_at: "2026-08-27T10:00:00Z",
  };
  const pedicures: ServiceCategory = {
    id: "cat-pedicures",
    name: "Pedicures",
    sort_order: 1,
    status: "ACTIVE",
    created_at: "2026-08-27T10:00:00Z",
    updated_at: "2026-08-27T10:00:00Z",
  };

  it("renders services grouped under their real category names", () => {
    granted.clear();
    granted.add("service.read");

    categoriesResult.data = [naturalNails, pedicures];
    servicesResult.data = [
      { ...manicure, category_id: naturalNails.id },
      {
        ...manicure,
        id: "svc-pedicure",
        name: "Classic Pedicure",
        category_id: pedicures.id,
      },
    ];

    render(<ServiceCatalog tenantId={TENANT_ID} currency="NGN" />);

    const natural = screen.getByText("Natural Nails").closest("details") as HTMLElement;
    const ped = screen.getByText("Pedicures").closest("details") as HTMLElement;
    expect(within(natural).getByText("Gel Manicure")).toBeInTheDocument();
    expect(within(ped).getByText("Classic Pedicure")).toBeInTheDocument();
  });

  it("renders a legacy service with no category under 'Uncategorized', safely", () => {
    granted.clear();
    granted.add("service.read");

    categoriesResult.data = [naturalNails];
    servicesResult.data = [{ ...manicure, category_id: null }];

    render(<ServiceCatalog tenantId={TENANT_ID} currency="NGN" />);

    expect(screen.getByText("Uncategorized")).toBeInTheDocument();
    const group = screen.getByText("Uncategorized").closest("details") as HTMLElement;
    expect(within(group).getByText("Gel Manicure")).toBeInTheDocument();
  });

  it("still shows a service's category name even if that category was later archived", () => {
    granted.clear();
    granted.add("service.read");

    categoriesResult.data = [{ ...naturalNails, status: "ARCHIVED" }];
    servicesResult.data = [{ ...manicure, category_id: naturalNails.id }];

    render(<ServiceCatalog tenantId={TENANT_ID} currency="NGN" />);

    expect(screen.getByText("Natural Nails")).toBeInTheDocument();
    expect(screen.getByText("Category archived")).toBeInTheDocument();
  });

  it("offers no archive control on an already-archived category", () => {
    granted.clear();
    granted.add("service.read");
    granted.add("service.archive");

    categoriesResult.data = [{ ...naturalNails, status: "ARCHIVED" }];
    servicesResult.data = [{ ...manicure, category_id: naturalNails.id }];

    render(<ServiceCatalog tenantId={TENANT_ID} currency="NGN" />);

    expect(
      screen.queryByRole("button", { name: /archive category natural nails/i })
    ).not.toBeInTheDocument();
  });
});

describe("ServiceCatalog — entry point into the builder", () => {
  it("clicking the existing Add service control opens the interactive builder, not a plain form", async () => {
    const user = userEvent.setup();
    renderCatalog(["service.read", "service.create"]);

    await user.click(screen.getByRole("button", { name: /add service/i }));

    // The builder's own step heading — proof this is the multi-step flow,
    // not the single-form `ServiceFormDialog` create dialog.
    expect(screen.getByText(/step 1 of 3/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Add service" })).toBeInTheDocument();
  });
});
