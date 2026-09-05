import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api/errors";
import type {
  CreatePublicBookingInput,
  CreatePublicBookingResponse,
  PublicServiceCatalog,
  PublicServiceStaff,
  PublicTenant,
} from "@/modules/public-booking/types";

import { BookingReview } from "./booking-review";

/**
 * The S10 booking-creation step, rendered with NO auth session in the tree —
 * only the mocked public query/mutation layer and a mocked router. Proves the
 * anonymous flow stays unauthenticated and exercises: the review summary,
 * customer-form validation, the exact mutation payload, pending/duplicate-submit
 * UI, the 409 conflict hand-off, generic failure copy, confirmation rendering,
 * null-currency safety, and that no customer PII ever reaches the URL.
 */

let searchParams = new URLSearchParams();
const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParams,
  useRouter: () => ({ replace }),
}));

function stub<T>(data?: T) {
  return {
    data,
    isPending: data === undefined,
    isError: false,
    isSuccess: data !== undefined,
    error: null as unknown,
    refetch: vi.fn(),
  };
}

let tenantResult: ReturnType<typeof stub<PublicTenant>>;
let catalogResult: ReturnType<typeof stub<PublicServiceCatalog>>;
let staffResult: ReturnType<typeof stub<PublicServiceStaff>>;

type MutationStub = {
  mutate: ReturnType<typeof vi.fn>;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  data: CreatePublicBookingResponse | undefined;
  error: unknown;
};
let mutation: MutationStub;
/** Payload + options captured from the last `mutation.mutate(...)` call. */
let lastMutateCall: { input: CreatePublicBookingInput; options?: { onError?: (e: unknown) => void } } | null;

vi.mock("@/modules/public-booking/queries", () => ({
  usePublicTenant: () => tenantResult,
  usePublicServiceCatalog: () => catalogResult,
  usePublicServiceStaff: () => staffResult,
  useCreatePublicBooking: () => mutation,
}));

const fetchSpy = vi.spyOn(globalThis, "fetch");

const BOOKING: CreatePublicBookingResponse = {
  booking: {
    id: "bk-1",
    reference: "NB-1A2B3C4D",
    status: "CONFIRMED",
    service: { id: "svc1", name: "Gel Manicure" },
    staff: { id: "st1", name: "Ada Okafor" },
    date: "2026-09-07",
    start: "09:00",
    end: "09:45",
    timezone: "Africa/Lagos",
  },
};

beforeEach(() => {
  fetchSpy.mockClear();
  replace.mockClear();
  lastMutateCall = null;
  searchParams = new URLSearchParams(
    "service_id=svc1&staff_id=st1&date=2026-09-07&start=09:00&end=09:45"
  );
  tenantResult = stub<PublicTenant>({
    slug: "glamour-nails",
    name: "Glamour Nails",
    description: null,
    timezone: "Africa/Lagos",
    business_type: "NAIL_TECHNICIAN",
  });
  catalogResult = stub<PublicServiceCatalog>({
    currency: "NGN",
    services: [
      {
        id: "svc1",
        name: "Gel Manicure",
        description: null,
        duration_minutes: 45,
        price_minor: 800000,
        category: null,
      },
    ],
  });
  staffResult = stub<PublicServiceStaff>({ service_id: "svc1", staff: [{ id: "st1", name: "Ada Okafor" }] });
  mutation = {
    mutate: vi.fn((input: CreatePublicBookingInput, options?: { onError?: (e: unknown) => void }) => {
      lastMutateCall = { input, options };
    }),
    isPending: false,
    isSuccess: false,
    isError: false,
    data: undefined,
    error: null,
  };
});

async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>, over: Partial<Record<"name" | "phone" | "email", string>> = {}) {
  if (over.name !== "") await user.type(screen.getByLabelText(/your name/i), over.name ?? "Jane Customer");
  if (over.phone) await user.type(screen.getByLabelText(/phone/i), over.phone);
  if (over.email) await user.type(screen.getByLabelText(/email/i), over.email);
  await user.click(screen.getByRole("button", { name: /book appointment/i }));
}

describe("BookingReview — review + form", () => {
  it("summarizes the real selection and stays anonymous (no fetch, no auth)", () => {
    render(<BookingReview slug="glamour-nails" />);

    expect(screen.getByRole("heading", { level: 1, name: /almost done/i })).toBeInTheDocument();
    expect(screen.getByText("Glamour Nails")).toBeInTheDocument();
    expect(screen.getByText("Gel Manicure")).toBeInTheDocument();
    expect(screen.getByText("Ada Okafor")).toBeInTheDocument();
    expect(screen.getByText(/2026/)).toBeInTheDocument();
    expect(screen.getByText("09:00 – 09:45")).toBeInTheDocument();
    expect(screen.getByText("₦8,000.00")).toBeInTheDocument();
    expect(screen.getByText("45 min")).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("never shows a confirmation before the backend succeeds", () => {
    render(<BookingReview slug="glamour-nails" />);
    expect(screen.queryByText(/booking confirmed/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/reference/i)).not.toBeInTheDocument();
  });

  it("offers a Change time link that preserves service/staff/date", () => {
    render(<BookingReview slug="glamour-nails" />);
    const link = screen.getByRole("link", { name: /change time/i });
    expect(link.getAttribute("href")).toContain("/book/glamour-nails/availability?");
    expect(link.getAttribute("href")).toContain("service_id=svc1");
    expect(link.getAttribute("href")).toContain("staff_id=st1");
    expect(link.getAttribute("href")).toContain("date=2026-09-07");
  });

  it("null currency stays symbol-free", () => {
    catalogResult = stub<PublicServiceCatalog>({ currency: null, services: catalogResult.data!.services });
    render(<BookingReview slug="glamour-nails" />);
    expect(screen.getAllByText("8,000.00").length).toBeGreaterThan(0);
    expect(screen.queryByText(/₦/)).not.toBeInTheDocument();
  });

  it("shows a 'something's missing' terminal on an incomplete deep link", () => {
    searchParams = new URLSearchParams("service_id=svc1&staff_id=st1");
    render(<BookingReview slug="glamour-nails" />);
    expect(screen.getByRole("heading", { name: /something's missing from your booking/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /book appointment/i })).not.toBeInTheDocument();
  });

  it("shows the not-found terminal for a hidden tenant", () => {
    tenantResult = { ...stub<PublicTenant>(), isPending: false, isError: true, error: new ApiError(404, { code: "TENANT_NOT_FOUND", message: "x" }) };
    render(<BookingReview slug="nope" />);
    expect(screen.getByText(/this booking page isn't available/i)).toBeInTheDocument();
  });
});

describe("BookingReview — customer form validation", () => {
  it("requires a name and moves focus to the field", async () => {
    const user = userEvent.setup();
    render(<BookingReview slug="glamour-nails" />);

    await user.click(screen.getByRole("button", { name: /book appointment/i }));

    const nameField = screen.getByLabelText(/your name/i);
    expect(nameField).toHaveAttribute("aria-invalid", "true");
    expect(nameField).toHaveFocus();
    expect(mutation.mutate).not.toHaveBeenCalled();
  });

  it("rejects an obviously malformed email without a backend round trip", async () => {
    const user = userEvent.setup();
    render(<BookingReview slug="glamour-nails" />);

    await fillAndSubmit(user, { email: "not-an-email" });

    expect(screen.getByText(/valid email address/i)).toBeInTheDocument();
    expect(mutation.mutate).not.toHaveBeenCalled();
  });

  it("submits with only a name (phone and email optional)", async () => {
    const user = userEvent.setup();
    render(<BookingReview slug="glamour-nails" />);

    await fillAndSubmit(user);

    expect(mutation.mutate).toHaveBeenCalledTimes(1);
    expect(lastMutateCall?.input).toEqual({
      service_id: "svc1",
      staff_id: "st1",
      date: "2026-09-07",
      start: "09:00",
      customer: { name: "Jane Customer" },
    });
  });

  it("sends phone and email when provided, and never an authoritative end/price/tenant", async () => {
    const user = userEvent.setup();
    render(<BookingReview slug="glamour-nails" />);

    await fillAndSubmit(user, { phone: "+2348000000000", email: "jane@example.com" });

    expect(lastMutateCall?.input.customer).toEqual({
      name: "Jane Customer",
      phone: "+2348000000000",
      email: "jane@example.com",
    });
    const keys = Object.keys(lastMutateCall!.input);
    expect(keys).toEqual(["service_id", "staff_id", "date", "start", "customer"]);
  });
});

describe("BookingReview — submit + pending", () => {
  it("shows a pending label and disables the button while the mutation is in flight", () => {
    mutation.isPending = true;
    render(<BookingReview slug="glamour-nails" />);

    const button = screen.getByRole("button", { name: /booking…/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  it("does not fire a second mutation while one is pending (duplicate-submit guard)", async () => {
    const user = userEvent.setup();
    mutation.isPending = true;
    render(<BookingReview slug="glamour-nails" />);

    await user.type(screen.getByLabelText(/your name/i), "Jane");
    await user.click(screen.getByRole("button", { name: /booking…/i }));

    expect(mutation.mutate).not.toHaveBeenCalled();
  });

  it("puts NO customer PII into the URL", async () => {
    const user = userEvent.setup();
    render(<BookingReview slug="glamour-nails" />);

    await fillAndSubmit(user, { phone: "+2348000000000", email: "jane@example.com" });

    for (const call of replace.mock.calls) {
      const url = String(call[0]);
      expect(url).not.toMatch(/jane|example\.com|2348000000000|Jane/i);
    }
  });
});

describe("BookingReview — 409 conflict hand-off", () => {
  function submitThenReject409() {
    const user = userEvent.setup();
    render(<BookingReview slug="glamour-nails" />);
    return (async () => {
      await fillAndSubmit(user);
      // Simulate the mutation rejecting with a 409, invoking the caller's onError.
      lastMutateCall?.options?.onError?.(
        new ApiError(409, { code: "BOOKING_SLOT_UNAVAILABLE", message: "gone" })
      );
    })();
  }

  it("routes back to slot selection with service/staff/date intact and an `unavailable` flag — no PII", async () => {
    await submitThenReject409();

    expect(replace).toHaveBeenCalledTimes(1);
    const url = String(replace.mock.calls[0][0]);
    expect(url).toContain("/book/glamour-nails/availability?");
    expect(url).toContain("service_id=svc1");
    expect(url).toContain("staff_id=st1");
    expect(url).toContain("date=2026-09-07");
    expect(url).toContain("unavailable=1");
    expect(url).not.toContain("start=");
    expect(url).not.toMatch(/jane|customer/i);
  });

  it("does not show a fatal page error for a 409 — it shows a calm hand-off", async () => {
    await submitThenReject409();
    // Now re-render with the mutation in its errored 409 state.
    mutation.isError = true;
    mutation.error = new ApiError(409, { code: "BOOKING_SLOT_UNAVAILABLE", message: "gone" });
    render(<BookingReview slug="glamour-nails" />);

    expect(screen.getByText(/no longer available/i)).toBeInTheDocument();
    expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
  });
});

describe("BookingReview — other failures", () => {
  it("maps a generic server failure to safe copy, keeping the form usable", () => {
    mutation.isError = true;
    mutation.error = new ApiError(500, { code: "INTERNAL_ERROR", message: "boom" });
    render(<BookingReview slug="glamour-nails" />);

    expect(screen.getByRole("alert")).toHaveTextContent(/couldn't complete your booking/i);
    expect(screen.getByRole("button", { name: /book appointment/i })).toBeEnabled();
    expect(screen.queryByText("boom")).not.toBeInTheDocument();
  });

  it("maps VALIDATION_FAILED to friendly copy, not the backend wording", () => {
    mutation.isError = true;
    mutation.error = new ApiError(400, { code: "VALIDATION_FAILED", message: "customer email is not a valid address" });
    render(<BookingReview slug="glamour-nails" />);

    expect(screen.getByRole("alert")).toHaveTextContent(/check your details/i);
    expect(screen.queryByText(/customer email is not a valid address/i)).not.toBeInTheDocument();
  });
});

describe("BookingReview — confirmation", () => {
  beforeEach(() => {
    mutation.isSuccess = true;
    mutation.data = BOOKING;
  });

  it("renders the persisted confirmation with a prominent reference and real fields", () => {
    render(<BookingReview slug="glamour-nails" />);

    expect(screen.getByRole("heading", { level: 1, name: /booking confirmed/i })).toBeInTheDocument();
    expect(screen.getByText("NB-1A2B3C4D")).toBeInTheDocument();
    expect(screen.getByText("Reference")).toBeInTheDocument();
    // Real response fields in the summary.
    expect(screen.getByText("Gel Manicure")).toBeInTheDocument();
    expect(screen.getByText("Ada Okafor")).toBeInTheDocument();
    expect(screen.getByText("09:00 – 09:45")).toBeInTheDocument();
    expect(screen.getByText("Africa/Lagos")).toBeInTheDocument();
    // The internal booking id is never surfaced.
    expect(screen.queryByText("bk-1")).not.toBeInTheDocument();
    // Announced for assistive tech.
    expect(screen.getByRole("status")).toHaveTextContent(/confirmed/i);
  });

  it("keeps confirmation null-currency safe", () => {
    catalogResult = stub<PublicServiceCatalog>({ currency: null, services: catalogResult.data!.services });
    render(<BookingReview slug="glamour-nails" />);

    expect(screen.getByRole("heading", { name: /booking confirmed/i })).toBeInTheDocument();
    expect(screen.queryByText(/₦/)).not.toBeInTheDocument();
  });
});
