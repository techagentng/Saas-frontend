import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api/errors";
import type { PublicServiceCatalog, PublicTenant } from "@/modules/public-booking/types";
import type { BusinessType } from "@/types/tenant";

import { BookingExperience } from "./booking-experience";

/**
 * The public booking page is deliberately rendered here with NO AuthProvider,
 * NO TenantProvider and NO DashboardShell in the tree — only the mocked query
 * layer. If it needed an authenticated session or dashboard tenant context to
 * render, these tests would throw. They don't.
 */

type QueryStub<T> = {
  data: T | undefined;
  isPending: boolean;
  isError: boolean;
  isSuccess: boolean;
  error: unknown;
  refetch: ReturnType<typeof vi.fn>;
};

const tenantResult: QueryStub<PublicTenant> = {
  data: undefined,
  isPending: true,
  isError: false,
  isSuccess: false,
  error: null,
  refetch: vi.fn(),
};

const catalogResult: QueryStub<PublicServiceCatalog> = {
  data: undefined,
  isPending: true,
  isError: false,
  isSuccess: false,
  error: null,
  refetch: vi.fn(),
};

let lastCatalogEnabled = false;

vi.mock("@/modules/public-booking/queries", () => ({
  usePublicTenant: () => tenantResult,
  usePublicServiceCatalog: (_slug: string, enabled: boolean) => {
    lastCatalogEnabled = enabled;
    return catalogResult;
  },
}));

function setTenant(
  state: "loading" | "notfound" | "error" | { business_type: BusinessType | null | string }
) {
  Object.assign(tenantResult, {
    data: undefined,
    isPending: false,
    isError: false,
    isSuccess: false,
    error: null,
  });

  if (state === "loading") {
    tenantResult.isPending = true;
  } else if (state === "notfound") {
    tenantResult.isError = true;
    tenantResult.error = new ApiError(404, { code: "TENANT_NOT_FOUND", message: "not found" });
  } else if (state === "error") {
    tenantResult.isError = true;
    tenantResult.error = new ApiError(500, { code: "INTERNAL_ERROR", message: "boom" });
  } else {
    tenantResult.isSuccess = true;
    tenantResult.data = {
      slug: "glamour-nails",
      name: "Glamour Nails",
      description: "Bright, clean, friendly nail studio.",
      timezone: "Africa/Lagos",
      business_type: state.business_type as BusinessType | null,
    };
  }
}

function setCatalog(
  state: "loading" | "error" | { currency: string | null; services: PublicServiceCatalog["services"] }
) {
  Object.assign(catalogResult, {
    data: undefined,
    isPending: false,
    isError: false,
    isSuccess: false,
    error: null,
  });

  if (state === "loading") {
    catalogResult.isPending = true;
  } else if (state === "error") {
    catalogResult.isError = true;
    catalogResult.error = new ApiError(500, { code: "INTERNAL_ERROR", message: "boom" });
  } else {
    catalogResult.isSuccess = true;
    catalogResult.data = state;
  }
}

const GEL: PublicServiceCatalog["services"][number] = {
  id: "s1",
  name: "Gel Manicure",
  description: "Long-lasting gel finish.",
  duration_minutes: 45,
  price_minor: 1999,
  category: null,
};

const PEDICURE: PublicServiceCatalog["services"][number] = {
  id: "s2",
  name: "Deluxe Pedicure",
  description: null,
  duration_minutes: 90,
  price_minor: 500000,
  category: null,
};

beforeEach(() => {
  tenantResult.refetch.mockReset();
  catalogResult.refetch.mockReset();
  lastCatalogEnabled = false;
  setTenant("loading");
  setCatalog("loading");
});

describe("BookingExperience — public tenant + route", () => {
  it("renders the business name for a nail tenant, with no auth session in the tree", () => {
    setTenant({ business_type: "NAIL_TECHNICIAN" });
    setCatalog({ currency: "NGN", services: [GEL] });

    render(<BookingExperience slug="glamour-nails" />);

    expect(screen.getByRole("heading", { level: 1, name: "Glamour Nails" })).toBeInTheDocument();
    expect(screen.getByText("Bright, clean, friendly nail studio.")).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
  });

  it("shows a skeleton, not a not-found or empty state, while the tenant loads", () => {
    setTenant("loading");
    render(<BookingExperience slug="glamour-nails" />);

    expect(screen.queryByText(/isn't available/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/no services are available/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
  });
});

describe("BookingExperience — vertical guard", () => {
  it("renders the catalog for NAIL_TECHNICIAN", () => {
    setTenant({ business_type: "NAIL_TECHNICIAN" });
    setCatalog({ currency: "NGN", services: [GEL, PEDICURE] });

    render(<BookingExperience slug="glamour-nails" />);

    expect(screen.getByRole("heading", { name: "Choose a service" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Gel Manicure/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Deluxe Pedicure/ })).toBeInTheDocument();
    expect(lastCatalogEnabled).toBe(true);
  });

  for (const businessType of ["HOTEL", "RESTAURANT", "TRANSPORT"] as const) {
    it(`renders the unsupported state for ${businessType} and never a catalog`, () => {
      setTenant({ business_type: businessType });

      render(<BookingExperience slug="grand-hotel" />);

      expect(
        screen.getByText(/online booking for this business type isn't available yet/i)
      ).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 1, name: "Glamour Nails" })).toBeInTheDocument();
      expect(screen.queryByRole("heading", { name: "Choose a service" })).not.toBeInTheDocument();
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
      // The catalog query must not even be enabled for a non-nail tenant.
      expect(lastCatalogEnabled).toBe(false);
    });
  }

  it("fails safe for an unknown/future business type", () => {
    setTenant({ business_type: "SPA" });

    render(<BookingExperience slug="mystery" />);

    expect(
      screen.getByText(/online booking for this business type isn't available yet/i)
    ).toBeInTheDocument();
    expect(lastCatalogEnabled).toBe(false);
  });

  it("fails safe for a null business type", () => {
    setTenant({ business_type: null });

    render(<BookingExperience slug="legacy" />);

    expect(
      screen.getByText(/online booking for this business type isn't available yet/i)
    ).toBeInTheDocument();
  });
});

describe("BookingExperience — services rendering", () => {
  beforeEach(() => setTenant({ business_type: "NAIL_TECHNICIAN" }));

  /** The catalogue row (`<li>`) for a service — the row, not the Select link. */
  function rowFor(name: string) {
    return screen.getByRole("heading", { name }).closest("li") as HTMLElement;
  }

  it("renders real fields: name, description, duration, price", () => {
    setCatalog({ currency: "NGN", services: [GEL] });
    render(<BookingExperience slug="glamour-nails" />);

    const row = rowFor("Gel Manicure");
    expect(within(row).getByRole("heading", { name: "Gel Manicure" })).toBeInTheDocument();
    expect(within(row).getByText("Long-lasting gel finish.")).toBeInTheDocument();
    expect(within(row).getByText("45 min")).toBeInTheDocument();
    expect(within(row).getByText("₦19.99")).toBeInTheDocument();
    // Selecting is still a link into the existing S9 flow.
    expect(within(row).getByRole("link", { name: "Select Gel Manicure" })).toHaveAttribute(
      "href",
      "/book/glamour-nails/availability?service_id=s1"
    );
  });

  it("handles a null description without rendering anything for it", () => {
    setCatalog({ currency: "NGN", services: [PEDICURE] });
    render(<BookingExperience slug="glamour-nails" />);

    const row = rowFor("Deluxe Pedicure");
    expect(within(row).getByRole("heading", { name: "Deluxe Pedicure" })).toBeInTheDocument();
    expect(within(row).queryByText("null")).not.toBeInTheDocument();
    expect(within(row).getByText("1 hr 30 min")).toBeInTheDocument();
  });

  it("formats duration in hours and minutes", () => {
    setCatalog({ currency: "NGN", services: [PEDICURE] });
    render(<BookingExperience slug="glamour-nails" />);

    expect(screen.getByText("1 hr 30 min")).toBeInTheDocument();
  });

  it("formats price with the catalog currency", () => {
    setCatalog({ currency: "NGN", services: [PEDICURE] });
    render(<BookingExperience slug="glamour-nails" />);

    expect(screen.getByText("₦5,000.00")).toBeInTheDocument();
  });

  it("renders a price without a symbol when currency is null, and does not invent NGN", () => {
    setCatalog({ currency: null, services: [GEL] });
    render(<BookingExperience slug="glamour-nails" />);

    const row = rowFor("Gel Manicure");
    expect(within(row).getAllByText("19.99").length).toBeGreaterThan(0);
    expect(within(row).queryByText(/₦/)).not.toBeInTheDocument();
  });

  it("renders one Select link per service", () => {
    setCatalog({ currency: "USD", services: [GEL, PEDICURE] });
    render(<BookingExperience slug="glamour-nails" />);

    expect(screen.getAllByRole("link", { name: /^Select / })).toHaveLength(2);
  });

  it("renders the empty state for a nail tenant with no services", () => {
    setCatalog({ currency: "NGN", services: [] });
    render(<BookingExperience slug="glamour-nails" />);

    expect(screen.getByText("No services are available for online booking yet.")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});

describe("BookingExperience — error states", () => {
  it("shows a customer-safe not-found for an unresolved slug, with no retry", () => {
    setTenant("notfound");
    render(<BookingExperience slug="no-such-salon" />);

    expect(screen.getByRole("heading", { level: 1, name: /this booking page isn't available/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /try again/i })).not.toBeInTheDocument();
    // No leak of internal state vocabulary.
    expect(screen.queryByText(/archived|disabled|onboarding/i)).not.toBeInTheDocument();
  });

  it("shows a retryable error for a non-404 tenant failure", async () => {
    setTenant("error");
    render(<BookingExperience slug="glamour-nails" />);

    const retry = screen.getByRole("button", { name: /try again/i });
    await userEvent.click(retry);
    expect(tenantResult.refetch).toHaveBeenCalledTimes(1);
  });

  it("keeps the business header when only the catalog request fails, and retries just the catalog", async () => {
    setTenant({ business_type: "NAIL_TECHNICIAN" });
    setCatalog("error");
    render(<BookingExperience slug="glamour-nails" />);

    expect(screen.getByRole("heading", { level: 1, name: "Glamour Nails" })).toBeInTheDocument();
    expect(screen.getByText(/couldn't load the services/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(catalogResult.refetch).toHaveBeenCalledTimes(1);
    expect(tenantResult.refetch).not.toHaveBeenCalled();
  });
});

describe("BookingExperience — selection carries the service id, no fake availability", () => {
  beforeEach(() => setTenant({ business_type: "NAIL_TECHNICIAN" }));

  it("links each service to the next step with its id in the URL", () => {
    setCatalog({ currency: "NGN", services: [GEL, PEDICURE] });
    render(<BookingExperience slug="glamour-nails" />);

    expect(screen.getByRole("link", { name: /Gel Manicure/ })).toHaveAttribute(
      "href",
      "/book/glamour-nails/availability?service_id=s1"
    );
    expect(screen.getByRole("link", { name: /Deluxe Pedicure/ })).toHaveAttribute(
      "href",
      "/book/glamour-nails/availability?service_id=s2"
    );
  });

  it("shows no fabricated technicians, dates, slots or availability badges", () => {
    setCatalog({ currency: "NGN", services: [GEL] });
    render(<BookingExperience slug="glamour-nails" />);

    expect(screen.queryByText(/technician|time slot|available (today|now)|\d{1,2}:\d{2}\s*(am|pm)?/i)).not.toBeInTheDocument();
  });
});
