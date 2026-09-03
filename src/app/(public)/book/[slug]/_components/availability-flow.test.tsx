import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api/errors";
import type {
  PublicAvailability,
  PublicServiceCatalog,
  PublicServiceStaff,
  PublicTenant,
} from "@/modules/public-booking/types";

import { AvailabilityFlow } from "./availability-flow";

/**
 * The S9 flow rendered with NO AuthProvider / TenantProvider / DashboardShell
 * — only the mocked public query layer and a mocked router. Proves the flow
 * needs no session, and exercises: S8 service id → S9, technician list from
 * the real endpoint shape, date gating, real slots, empty/error states,
 * selection carried into the confirm URL, and that no booking POST is made.
 */

let searchParams = new URLSearchParams();
const replace = vi.fn();
const push = vi.fn();

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParams,
  useRouter: () => ({ replace, push }),
  usePathname: () => "/book/glamour-nails/availability",
}));

type Stub<T> = {
  data: T | undefined;
  isPending: boolean;
  isError: boolean;
  isSuccess: boolean;
  error: unknown;
  refetch: ReturnType<typeof vi.fn>;
};

function stub<T>(data?: T): Stub<T> {
  return {
    data,
    isPending: data === undefined,
    isError: false,
    isSuccess: data !== undefined,
    error: null,
    refetch: vi.fn(),
  };
}

let tenantResult: Stub<PublicTenant>;
let catalogResult: Stub<PublicServiceCatalog>;
let staffResult: Stub<PublicServiceStaff>;
let availabilityResult: Stub<PublicAvailability>;
const availabilityArgs: Array<[string, string | null, string | null, string | null]> = [];

vi.mock("@/modules/public-booking/queries", () => ({
  usePublicTenant: () => tenantResult,
  usePublicServiceCatalog: () => catalogResult,
  usePublicServiceStaff: () => staffResult,
  usePublicAvailability: (
    slug: string,
    serviceId: string | null,
    staffId: string | null,
    date: string | null
  ) => {
    availabilityArgs.push([slug, serviceId, staffId, date]);
    return availabilityResult;
  },
}));

const NAIL_TENANT: PublicTenant = {
  slug: "glamour-nails",
  name: "Glamour Nails",
  description: null,
  timezone: "Africa/Lagos",
  business_type: "NAIL_TECHNICIAN",
};

const CATALOG: PublicServiceCatalog = {
  currency: "NGN",
  services: [
    { id: "svc1", name: "Gel Manicure", description: "Long-lasting.", duration_minutes: 45, price_minor: 800000 },
  ],
};

beforeEach(() => {
  searchParams = new URLSearchParams("service_id=svc1");
  replace.mockReset();
  push.mockReset();
  availabilityArgs.length = 0;
  tenantResult = stub(NAIL_TENANT);
  catalogResult = stub(CATALOG);
  staffResult = stub<PublicServiceStaff>({
    service_id: "svc1",
    staff: [
      { id: "st1", name: "Ada" },
      { id: "st2", name: "Cara" },
    ],
  });
  availabilityResult = stub<PublicAvailability>({
    date: "2026-09-07",
    timezone: "Africa/Lagos",
    service_id: "svc1",
    staff_id: "st1",
    slots: [
      { start: "09:00", end: "09:45" },
      { start: "09:45", end: "10:30" },
    ],
  });
});

function renderFlow() {
  return render(<AvailabilityFlow slug="glamour-nails" />);
}

describe("AvailabilityFlow — service summary + technician step", () => {
  it("shows the S8-chosen service from public data and the technician list", () => {
    renderFlow();

    expect(screen.getByRole("heading", { level: 1, name: /book with glamour nails/i })).toBeInTheDocument();
    expect(screen.getByText("Gel Manicure")).toBeInTheDocument();
    expect(screen.getByText("₦8,000.00")).toBeInTheDocument();
    expect(screen.getByText("45 min")).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: "Choose a technician" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ada" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cara" })).toBeInTheDocument();
  });

  it("selecting a technician writes staff_id to the URL and clears any stale date", async () => {
    searchParams = new URLSearchParams("service_id=svc1&date=2026-09-07");
    renderFlow();

    await userEvent.click(screen.getByRole("button", { name: "Cara" }));

    expect(replace).toHaveBeenCalledTimes(1);
    const url = replace.mock.calls[0][0] as string;
    expect(url).toContain("staff_id=st2");
    expect(url).not.toContain("date=");
  });

  it("auto-selects the only technician", async () => {
    staffResult = stub<PublicServiceStaff>({ service_id: "svc1", staff: [{ id: "only", name: "Solo" }] });
    renderFlow();

    // effect fires after paint
    await vi.waitFor(() => expect(replace).toHaveBeenCalled());
    expect(replace.mock.calls[0][0]).toContain("staff_id=only");
  });

  it("shows a customer-friendly empty state when no technician can perform the service", () => {
    staffResult = stub<PublicServiceStaff>({ service_id: "svc1", staff: [] });
    renderFlow();

    expect(
      screen.getByText(/no technicians are currently available for this service/i)
    ).toBeInTheDocument();
  });

  it("shows a retry on a technician-list failure", async () => {
    staffResult = { ...stub<PublicServiceStaff>(), isPending: false, isError: true, error: new ApiError(500, { code: "INTERNAL_ERROR", message: "x" }) };
    renderFlow();

    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(staffResult.refetch).toHaveBeenCalled();
  });
});

describe("AvailabilityFlow — date + slot steps", () => {
  it("does not render the date or slot step until a technician is chosen", () => {
    renderFlow(); // no staff_id in URL

    expect(screen.queryByRole("heading", { name: "Choose a date" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Choose a time" })).not.toBeInTheDocument();
  });

  it("does not render the slot step (nor query availability meaningfully) until a date is chosen", () => {
    searchParams = new URLSearchParams("service_id=svc1&staff_id=st1");
    renderFlow();

    expect(screen.getByRole("heading", { name: "Choose a date" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Choose a time" })).not.toBeInTheDocument();
    // SlotPicker is the only caller of usePublicAvailability, so it was never invoked.
    expect(availabilityArgs).toHaveLength(0);
  });

  it("renders real slots once service + technician + date are all set", () => {
    searchParams = new URLSearchParams("service_id=svc1&staff_id=st1&date=2026-09-07");
    renderFlow();

    expect(screen.getByRole("heading", { name: "Choose a time" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /book 09:00 to 09:45/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /book 09:45 to 10:30/i })).toBeInTheDocument();
    // Passed straight through from the URL — the frontend computes no timezone.
    expect(availabilityArgs.at(-1)).toEqual(["glamour-nails", "svc1", "st1", "2026-09-07"]);
  });

  it("shows the no-times state without flashing it before the request resolves", () => {
    searchParams = new URLSearchParams("service_id=svc1&staff_id=st1&date=2026-09-07");
    availabilityResult = stub<PublicAvailability>();
    availabilityResult.isPending = true;
    availabilityResult.isSuccess = false;
    const { rerender } = renderFlow();
    expect(screen.queryByText(/no times are available/i)).not.toBeInTheDocument();

    availabilityResult = stub<PublicAvailability>({
      date: "2026-09-07",
      timezone: "Africa/Lagos",
      service_id: "svc1",
      staff_id: "st1",
      slots: [],
    });
    rerender(<AvailabilityFlow slug="glamour-nails" />);
    expect(screen.getByText(/no times are available on this date/i)).toBeInTheDocument();
  });

  it("retries just the availability request on failure", async () => {
    searchParams = new URLSearchParams("service_id=svc1&staff_id=st1&date=2026-09-07");
    availabilityResult = { ...stub<PublicAvailability>(), isPending: false, isError: true, error: new ApiError(500, { code: "INTERNAL_ERROR", message: "x" }) };
    renderFlow();

    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(availabilityResult.refetch).toHaveBeenCalled();
  });
});

describe("AvailabilityFlow — selection hand-off", () => {
  it("choosing a slot pushes to the confirm route with every detail, and sends no request", async () => {
    searchParams = new URLSearchParams("service_id=svc1&staff_id=st1&date=2026-09-07");
    renderFlow();

    await userEvent.click(screen.getByRole("button", { name: /book 09:00 to 09:45/i }));

    expect(push).toHaveBeenCalledTimes(1);
    const url = push.mock.calls[0][0] as string;
    expect(url).toContain("/book/glamour-nails/confirm?");
    expect(url).toContain("service_id=svc1");
    expect(url).toContain("staff_id=st1");
    expect(url).toContain("date=2026-09-07");
    expect(url).toContain("start=09%3A00");
    expect(url).toContain("end=09%3A45");
  });
});

describe("AvailabilityFlow — guards", () => {
  it("shows an unavailable message for a non-nail tenant, no technician UI", () => {
    tenantResult = stub<PublicTenant>({ ...NAIL_TENANT, business_type: "HOTEL" });
    renderFlow();

    expect(screen.queryByRole("heading", { name: "Choose a technician" })).not.toBeInTheDocument();
    expect(screen.getByText(/online booking isn't available for this business/i)).toBeInTheDocument();
  });

  it("shows a not-found for a hidden tenant", () => {
    tenantResult = { ...stub<PublicTenant>(), isPending: false, isError: true, error: new ApiError(404, { code: "TENANT_NOT_FOUND", message: "x" }) };
    renderFlow();

    expect(screen.getByText(/this booking page isn't available/i)).toBeInTheDocument();
  });

  it("prompts to choose a service when the id is missing or unknown", () => {
    searchParams = new URLSearchParams();
    renderFlow();

    expect(screen.getByRole("heading", { name: /choose a service to continue/i })).toBeInTheDocument();
  });

  it("null currency renders the price with no symbol and never NGN", () => {
    catalogResult = stub<PublicServiceCatalog>({ currency: null, services: CATALOG.services });
    renderFlow();

    const summary = screen.getByText("Gel Manicure").closest("section")!;
    expect(within(summary).getAllByText("8,000.00").length).toBeGreaterThan(0);
    expect(within(summary).queryByText(/₦/)).not.toBeInTheDocument();
  });

  it("never shows fabricated availability anywhere before a real slot query", () => {
    renderFlow();
    expect(screen.queryByText(/\d{1,2}:\d{2}/)).not.toBeInTheDocument();
    expect(screen.queryByText(/available (today|now)/i)).not.toBeInTheDocument();
  });
});

describe("AvailabilityFlow — S10 conflict hand-off", () => {
  it("shows the 'no longer available' alert in the slot step when returned from a 409, keeping service/staff/date", () => {
    searchParams = new URLSearchParams("service_id=svc1&staff_id=st1&date=2026-09-07&unavailable=1");
    renderFlow();

    expect(screen.getByRole("heading", { name: "Choose a time" })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      /that time is no longer available\. please choose another time\./i
    );
    // The rest of the selection is intact — real slots still render.
    expect(screen.getByRole("button", { name: /book 09:00 to 09:45/i })).toBeInTheDocument();
    expect(availabilityArgs.at(-1)).toEqual(["glamour-nails", "svc1", "st1", "2026-09-07"]);
  });

  it("drops the stale `unavailable` flag when the customer changes technician", async () => {
    searchParams = new URLSearchParams("service_id=svc1&staff_id=st1&date=2026-09-07&unavailable=1");
    renderFlow();

    await userEvent.click(screen.getByRole("button", { name: "Cara" }));

    const url = replace.mock.calls.at(-1)![0] as string;
    expect(url).not.toContain("unavailable");
  });
});
