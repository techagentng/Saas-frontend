import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { resolveVerticalExperience } from "@/lib/vertical/experience";
import type { TenantBooking } from "@/modules/bookings/types";
import type { Service } from "@/modules/services/types";
import type { StaffProfile } from "@/modules/staff/types";
import type { Permission } from "@/types/permission";

import { BookingList } from "./booking-list";

/**
 * Behaviour under test: the view switch, filters, and list rendering states.
 * Detail-open + cancellation are exercised in `booking-detail-dialog.test.tsx`
 * and the full lifecycle in `booking-lifecycle.test.tsx` — this file mocks
 * `useBooking`/`useCancelBooking` only enough that opening a row's detail
 * dialog does not crash.
 */

const granted = new Set<Permission>();
vi.mock("@/providers/permissions-provider", () => ({
  useCan: (permission: Permission) => granted.has(permission),
}));

let vertical = resolveVerticalExperience("NAIL_TECHNICIAN");
vi.mock("@/lib/vertical/use-vertical-experience", () => ({
  useVerticalExperience: () => vertical,
}));

vi.mock("@/providers/auth-provider", () => ({
  useAuth: () => ({ isAuthenticated: true }),
}));

const bookingsResult = {
  data: [] as TenantBooking[],
  isPending: false,
  isSuccess: true,
  isError: false,
  error: null as unknown,
  refetch: vi.fn(),
};

/** Captures the filter object passed to `useBookings` on the most recent render. */
let lastFilterArg: unknown = null;

vi.mock("@/modules/bookings/queries", () => ({
  useBookings: (_tenantId: string, filter: unknown) => {
    lastFilterArg = filter;
    return bookingsResult;
  },
  useBooking: () => ({
    data: undefined,
    isPending: true,
    isSuccess: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useCancelBooking: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

const staffResult = { data: [] as StaffProfile[], isPending: false, isSuccess: true, isError: false, error: null };
const servicesResult = { data: [] as Service[], isPending: false, isSuccess: true, isError: false, error: null };

vi.mock("@/modules/staff/queries", () => ({ useStaffList: () => staffResult }));
vi.mock("@/modules/services/queries", () => ({ useServices: () => servicesResult }));

const TENANT_ID = "11111111-1111-4111-8111-111111111111";

function booking(overrides: Partial<TenantBooking> = {}): TenantBooking {
  return {
    id: "booking-1",
    reference: "NB-1A2B3C4D",
    status: "CONFIRMED",
    service: { id: "svc-1", name: "Gel Manicure" },
    staff: { id: "staff-1", name: "Ada Okafor" },
    customer_name: "Jane Doe",
    customer_phone: "+2348000000000",
    customer_email: "jane@example.com",
    start: "2026-09-12T09:00:00Z",
    end: "2026-09-12T09:45:00Z",
    duration_minutes: 45,
    created_at: "2026-09-01T00:00:00Z",
    ...overrides,
  };
}

function renderList(bookings: TenantBooking[] = [booking()]) {
  bookingsResult.data = bookings;
  bookingsResult.isPending = false;
  bookingsResult.isSuccess = true;
  bookingsResult.isError = false;
  return render(<BookingList tenantId={TENANT_ID} timezone="Africa/Lagos" />);
}

beforeEach(() => {
  granted.clear();
  vertical = resolveVerticalExperience("NAIL_TECHNICIAN");
  lastFilterArg = null;
  staffResult.data = [];
  servicesResult.data = [];
});

describe("BookingList — default view", () => {
  it("defaults to the Upcoming view", () => {
    renderList();
    expect(lastFilterArg).toMatchObject({ view: "UPCOMING" });
    expect(screen.getByRole("tab", { name: "Upcoming" })).toHaveAttribute("aria-selected", "true");
  });
});

describe("BookingList — view switching", () => {
  it("switches to Past", async () => {
    const user = userEvent.setup();
    renderList();

    await user.click(screen.getByRole("tab", { name: "Past" }));
    expect(lastFilterArg).toMatchObject({ view: "PAST" });
  });

  it("switches to Cancelled", async () => {
    const user = userEvent.setup();
    renderList();

    await user.click(screen.getByRole("tab", { name: "Cancelled" }));
    expect(lastFilterArg).toMatchObject({ view: "CANCELLED" });
  });

  it("switches to All", async () => {
    const user = userEvent.setup();
    renderList();

    await user.click(screen.getByRole("tab", { name: "All" }));
    expect(lastFilterArg).toMatchObject({ view: "ALL" });
  });
});

describe("BookingList — rows", () => {
  it("renders a row per booking with the real DTO fields", () => {
    renderList([booking()]);

    const row = screen.getByRole("button", { name: /view booking details for jane doe/i }).closest("li")!;
    expect(within(row).getByText("Jane Doe")).toBeInTheDocument();
    expect(within(row).getByText(/Gel Manicure/)).toBeInTheDocument();
    expect(within(row).getByText(/Ada Okafor/)).toBeInTheDocument();
    expect(within(row).getByText("NB-1A2B3C4D")).toBeInTheDocument();
    expect(within(row).getByText("Confirmed")).toBeInTheDocument();
  });

  it("opens the detail dialog on row click", async () => {
    const user = userEvent.setup();
    renderList([booking()]);

    await user.click(screen.getByRole("button", { name: /view booking details for jane doe/i }));

    expect(screen.getByRole("dialog", { name: /booking details/i })).toBeInTheDocument();
  });
});

describe("BookingList — empty states", () => {
  it("shows the Upcoming empty state", () => {
    renderList([]);
    expect(screen.getByText(/no upcoming appointments/i)).toBeInTheDocument();
  });

  it("shows the Cancelled empty state", async () => {
    const user = userEvent.setup();
    renderList([]);

    await user.click(screen.getByRole("tab", { name: "Cancelled" }));
    expect(screen.getByText(/no cancelled appointments/i)).toBeInTheDocument();
  });

  it("never shows an error state for a legitimately empty list", () => {
    renderList([]);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows the filtered empty message once any filter is active", async () => {
    const user = userEvent.setup();
    servicesResult.data = [{ id: "svc-1", name: "Gel Manicure", description: null, duration_minutes: 45, price_minor: 100000, category_id: null, status: "ACTIVE", created_at: "", updated_at: "" }];
    renderList([]);

    await user.selectOptions(screen.getByLabelText("Service"), "svc-1");
    expect(screen.getByText("No bookings match these filters.")).toBeInTheDocument();
  });
});

describe("BookingList — filters", () => {
  it("filters by service, sourced from this tenant's ACTIVE catalog", async () => {
    const user = userEvent.setup();
    servicesResult.data = [
      { id: "svc-1", name: "Gel Manicure", description: null, duration_minutes: 45, price_minor: 100000, category_id: null, status: "ACTIVE", created_at: "", updated_at: "" },
    ];
    renderList();

    await user.selectOptions(screen.getByLabelText("Service"), "svc-1");
    expect(lastFilterArg).toMatchObject({ serviceId: "svc-1" });
  });

  it("filters by technician, sourced from this tenant's ACTIVE roster", async () => {
    const user = userEvent.setup();
    staffResult.data = [{ id: "staff-1", user_id: null, display_name: "Ada Okafor", bio: null, is_bookable: true, status: "ACTIVE", created_at: "", updated_at: "" }];
    renderList();

    await user.selectOptions(screen.getByLabelText("Technician"), "staff-1");
    expect(lastFilterArg).toMatchObject({ staffId: "staff-1" });
  });

  it("filters by date", async () => {
    const user = userEvent.setup();
    renderList();

    const dateInput = screen.getByLabelText("Date");
    await user.type(dateInput, "2026-09-12");
    expect(lastFilterArg).toMatchObject({ date: "2026-09-12" });
  });

  it("clears all three filters via the clear action, leaving the view untouched", async () => {
    const user = userEvent.setup();
    staffResult.data = [{ id: "staff-1", user_id: null, display_name: "Ada Okafor", bio: null, is_bookable: true, status: "ACTIVE", created_at: "", updated_at: "" }];
    renderList();

    await user.selectOptions(screen.getByLabelText("Technician"), "staff-1");
    await user.click(screen.getByRole("tab", { name: "Past" }));
    expect(screen.getByRole("button", { name: /clear filters/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /clear filters/i }));

    expect(lastFilterArg).toMatchObject({ view: "PAST", staffId: null, serviceId: null, date: null });
    expect(screen.queryByRole("button", { name: /clear filters/i })).not.toBeInTheDocument();
  });
});
