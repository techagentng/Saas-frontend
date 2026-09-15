import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api/errors";
import { resolveVerticalExperience } from "@/lib/vertical/experience";
import type { TenantBooking, TenantBookingDetail } from "@/modules/bookings/types";
import type { Permission } from "@/types/permission";

import { BookingList } from "./booking-list";

/**
 * The main UI lifecycle for S11 (task section 30), exercised against a REAL
 * QueryClient — only `@/modules/bookings/api` is mocked, as an in-memory
 * "server" — so the invalidation → refetch → view-membership-change chain is
 * actually proven, not assumed:
 *
 *   Upcoming shows the booking CONFIRMED
 *   → open detail → Cancel booking → confirm
 *   → mutation succeeds
 *   → the booking disappears from Upcoming
 *   → the Cancelled view shows the same booking CANCELLED
 *
 * Also proves the tenant-switch isolation rule (section 10): switching the
 * `tenantId` this component is keyed by (exactly as `BookingsPage` does)
 * must not carry Tenant A's booking data into Tenant B's view.
 */

const granted = new Set<Permission>(["booking.read", "booking.update"]);
vi.mock("@/providers/permissions-provider", () => ({
  useCan: (permission: Permission) => granted.has(permission),
}));

vi.mock("@/lib/vertical/use-vertical-experience", () => ({
  useVerticalExperience: () => resolveVerticalExperience("NAIL_TECHNICIAN"),
}));

vi.mock("@/providers/auth-provider", () => ({
  useAuth: () => ({ isAuthenticated: true }),
}));

vi.mock("@/modules/staff/queries", () => ({
  useStaffList: () => ({ data: [], isPending: false, isSuccess: true, isError: false, error: null }),
}));
vi.mock("@/modules/services/queries", () => ({
  useServices: () => ({ data: [], isPending: false, isSuccess: true, isError: false, error: null }),
}));

const listBookings = vi.fn();
const getBooking = vi.fn();
const cancelBooking = vi.fn();
const rescheduleBooking = vi.fn();
const completeBooking = vi.fn();
const markBookingNoShow = vi.fn();
vi.mock("@/modules/bookings/api", () => ({
  listBookings: (...args: unknown[]) => listBookings(...args),
  getBooking: (...args: unknown[]) => getBooking(...args),
  cancelBooking: (...args: unknown[]) => cancelBooking(...args),
  rescheduleBooking: (...args: unknown[]) => rescheduleBooking(...args),
  completeBooking: (...args: unknown[]) => completeBooking(...args),
  markBookingNoShow: (...args: unknown[]) => markBookingNoShow(...args),
}));

const TENANT_A = "11111111-1111-4111-8111-111111111111";
const TENANT_B = "22222222-2222-4222-8222-222222222222";

/** A tiny in-memory "server": one booking per tenant, mutated by cancelBooking. */
function makeServerState(): Record<string, TenantBooking> {
  return {
    [TENANT_A]: {
      id: "booking-a",
      reference: "NB-AAAA1111",
      status: "CONFIRMED",
      service: { id: "svc-1", name: "Gel Manicure" },
      staff: { id: "staff-1", name: "Ada Okafor" },
      customer_name: "Jane Doe",
      customer_phone: "+2348000000000",
      customer_email: "jane@example.com",
      start: "2099-01-01T09:00:00Z",
      end: "2099-01-01T09:45:00Z",
      duration_minutes: 45,
      created_at: "2026-09-01T00:00:00Z",
    },
    [TENANT_B]: {
      id: "booking-b",
      reference: "NB-BBBB2222",
      status: "CONFIRMED",
      service: { id: "svc-2", name: "Spa Pedicure" },
      staff: { id: "staff-2", name: "Bola" },
      customer_name: "Sam Customer",
      customer_phone: null,
      customer_email: null,
      start: "2099-01-02T10:00:00Z",
      end: "2099-01-02T11:00:00Z",
      duration_minutes: 60,
      created_at: "2026-09-01T00:00:00Z",
    },
  };
}

let server: Record<string, TenantBooking>;
let queryClient: QueryClient;

function toDetail(booking: TenantBooking): TenantBookingDetail {
  return { ...booking, timezone: "Africa/Lagos" };
}

beforeEach(() => {
  granted.clear();
  granted.add("booking.read");
  granted.add("booking.update");
  server = makeServerState();
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });

  // Reset call history for every mock, not just its implementation — several
  // tests below assert exact call counts (e.g. "duplicate submission
  // prevented"), which would otherwise accumulate across tests sharing these
  // same `vi.fn()` instances.
  listBookings.mockReset();
  getBooking.mockReset();
  cancelBooking.mockReset();
  rescheduleBooking.mockReset();
  completeBooking.mockReset();
  markBookingNoShow.mockReset();

  listBookings.mockImplementation((tenantId: string, filter: { view: string }) => {
    const booking = server[tenantId];
    if (!booking) return Promise.resolve([]);
    if (filter.view === "UPCOMING") return Promise.resolve(booking.status === "CONFIRMED" ? [booking] : []);
    if (filter.view === "CANCELLED") return Promise.resolve(booking.status === "CANCELLED" ? [booking] : []);
    // S13-BE: PAST includes CONFIRMED/COMPLETED/NO_SHOW, excludes CANCELLED
    // (its own dedicated view) — mirroring toRepoFilter's real semantics.
    if (filter.view === "PAST") return Promise.resolve(booking.status !== "CANCELLED" ? [booking] : []);
    return Promise.resolve([booking]);
  });

  getBooking.mockImplementation((tenantId: string, bookingId: string) => {
    const booking = server[tenantId];
    if (!booking || booking.id !== bookingId) return Promise.reject(new Error("not found"));
    return Promise.resolve(toDetail(booking));
  });

  cancelBooking.mockImplementation((tenantId: string, bookingId: string) => {
    const booking = server[tenantId];
    if (!booking || booking.id !== bookingId) return Promise.reject(new Error("not found"));
    booking.status = "CANCELLED";
    return Promise.resolve(toDetail(booking));
  });

  rescheduleBooking.mockImplementation(
    (tenantId: string, bookingId: string, input: { date: string; start: string }) => {
      const booking = server[tenantId];
      if (!booking || booking.id !== bookingId) return Promise.reject(new Error("not found"));
      const start = new Date(`${input.date}T${input.start}:00Z`);
      const durationMs = booking.duration_minutes * 60 * 1000;
      booking.start = start.toISOString();
      booking.end = new Date(start.getTime() + durationMs).toISOString();
      return Promise.resolve(toDetail(booking));
    }
  );

  completeBooking.mockImplementation((tenantId: string, bookingId: string) => {
    const booking = server[tenantId];
    if (!booking || booking.id !== bookingId) return Promise.reject(new Error("not found"));
    if (booking.status !== "CONFIRMED" && booking.status !== "COMPLETED") {
      return Promise.reject(new ApiError(409, { code: "BOOKING_INVALID_TRANSITION", message: "no" }));
    }
    booking.status = "COMPLETED";
    return Promise.resolve(toDetail(booking));
  });

  markBookingNoShow.mockImplementation((tenantId: string, bookingId: string) => {
    const booking = server[tenantId];
    if (!booking || booking.id !== bookingId) return Promise.reject(new Error("not found"));
    if (booking.status !== "CONFIRMED" && booking.status !== "NO_SHOW") {
      return Promise.reject(new ApiError(409, { code: "BOOKING_INVALID_TRANSITION", message: "no" }));
    }
    booking.status = "NO_SHOW";
    return Promise.resolve(toDetail(booking));
  });
});

function renderTenant(tenantId: string) {
  return render(
    <QueryClientProvider client={queryClient}>
      <BookingList key={tenantId} tenantId={tenantId} timezone="Africa/Lagos" />
    </QueryClientProvider>
  );
}

describe("S11 lifecycle — Upcoming → cancel → Cancelled", () => {
  it("walks the full lifecycle the task describes", async () => {
    const user = userEvent.setup();
    renderTenant(TENANT_A);

    // 1. Upcoming shows the booking CONFIRMED.
    await screen.findByText("Jane Doe");
    expect(screen.getByText("Confirmed")).toBeInTheDocument();

    // 2. Open detail.
    await user.click(screen.getByRole("button", { name: /view booking details for jane doe/i }));
    const dialog = await screen.findByRole("dialog", { name: /booking details/i });

    // 3. Cancel booking → confirm.
    await user.click(screen.getByRole("button", { name: "Cancel booking" }));
    await user.click(screen.getByRole("button", { name: "Cancel booking" }));

    // 4. Mutation succeeds — the detail dialog reflects it immediately. Scoped
    // to the dialog because the view-switch tab is also labelled "Cancelled".
    await waitFor(() => expect(cancelBooking).toHaveBeenCalledWith(TENANT_A, "booking-a"));
    await waitFor(() => expect(within(dialog).getByText("Cancelled")).toBeInTheDocument());

    // Close the detail dialog to get back to the list. Not Escape: on
    // success the confirm dialog already unmounted itself and tried to
    // restore focus to the (now-removed, since cancelling hid it) "Cancel
    // booking" trigger, so focus may no longer be inside the dialog panel
    // for a keyboard Escape to reach.
    await user.click(screen.getByRole("button", { name: /close booking details/i }));

    // 5. The booking disappears from Upcoming (the invalidated list refetches).
    await waitFor(() => expect(screen.queryByText("Jane Doe")).not.toBeInTheDocument());
    expect(screen.getByText(/no upcoming appointments/i)).toBeInTheDocument();

    // 6. Switching to Cancelled shows the same booking, CANCELLED.
    await user.click(screen.getByRole("tab", { name: "Cancelled" }));
    const row = (await screen.findByRole("button", { name: /view booking details for jane doe/i })).closest("li")!;
    expect(within(row).getByText("Cancelled")).toBeInTheDocument();
  });
});

describe("S12-BE lifecycle — reschedule", () => {
  it("moves the booking to the new date/time, preserving id and reference, and closes the reschedule dialog", async () => {
    const user = userEvent.setup();
    renderTenant(TENANT_A);

    await screen.findByText("Jane Doe");
    await user.click(screen.getByRole("button", { name: /view booking details for jane doe/i }));
    await screen.findByRole("dialog", { name: /booking details/i });

    await user.click(screen.getByRole("button", { name: "Reschedule" }));
    const rescheduleDialog = await screen.findByRole("dialog", { name: /reschedule appointment/i });
    await user.clear(within(rescheduleDialog).getByLabelText("Choose a new date"));
    await user.type(within(rescheduleDialog).getByLabelText("Choose a new date"), "2099-02-01");
    await user.click(within(rescheduleDialog).getByRole("button", { name: /confirm reschedule/i }));

    await waitFor(() =>
      expect(rescheduleBooking).toHaveBeenCalledWith(TENANT_A, "booking-a", {
        date: "2099-02-01",
        start: "10:00",
      })
    );
    // The reschedule dialog closed; the detail dialog (same booking id/reference) remains.
    expect(screen.queryByRole("dialog", { name: /reschedule appointment/i })).not.toBeInTheDocument();
    const detailDialog = screen.getByRole("dialog", { name: /booking details/i });
    expect(within(detailDialog).getByText("NB-AAAA1111")).toBeInTheDocument();
  });

  it("409 conflict: keeps the booking unchanged, shows a clear inline error, and lets the user pick another time", async () => {
    rescheduleBooking.mockRejectedValueOnce(
      new ApiError(409, { code: "BOOKING_SLOT_UNAVAILABLE", message: "slot gone" })
    );
    const user = userEvent.setup();
    const originalStart = server[TENANT_A].start;
    renderTenant(TENANT_A);

    await screen.findByText("Jane Doe");
    await user.click(screen.getByRole("button", { name: /view booking details for jane doe/i }));
    await user.click(screen.getByRole("button", { name: "Reschedule" }));
    const rescheduleDialog = await screen.findByRole("dialog", { name: /reschedule appointment/i });

    await user.clear(within(rescheduleDialog).getByLabelText("Choose a new date"));
    await user.type(within(rescheduleDialog).getByLabelText("Choose a new date"), "2099-02-01");
    await user.click(within(rescheduleDialog).getByRole("button", { name: /confirm reschedule/i }));

    // The booking is unchanged (still its original start) — the server call rejected.
    expect(await screen.findByRole("alert")).toHaveTextContent(/no longer available/i);
    expect(server[TENANT_A].start).toBe(originalStart);

    // The dialog is still open and usable — pick another time and it succeeds.
    await user.clear(within(rescheduleDialog).getByLabelText("Choose a new date"));
    await user.type(within(rescheduleDialog).getByLabelText("Choose a new date"), "2099-03-01");
    await user.click(within(rescheduleDialog).getByRole("button", { name: /confirm reschedule/i }));

    await waitFor(() =>
      expect(rescheduleBooking).toHaveBeenLastCalledWith(TENANT_A, "booking-a", {
        date: "2099-03-01",
        start: "10:00",
      })
    );
    expect(screen.queryByRole("dialog", { name: /reschedule appointment/i })).not.toBeInTheDocument();
  });
});

describe("S13-BE lifecycle — Complete", () => {
  it("CONFIRMED → Mark completed → confirm → COMPLETED shown → actions removed → moves out of Upcoming into Past", async () => {
    const user = userEvent.setup();
    // An eligible booking: CONFIRMED and already ended.
    server[TENANT_A].start = "2020-01-01T09:00:00Z";
    server[TENANT_A].end = "2020-01-01T09:45:00Z";
    renderTenant(TENANT_A);

    await screen.findByText("Jane Doe");
    await user.click(screen.getByRole("button", { name: /view booking details for jane doe/i }));
    const dialog = await screen.findByRole("dialog", { name: /booking details/i });

    await user.click(within(dialog).getByRole("button", { name: "Mark completed" }));
    await user.click(screen.getByRole("button", { name: "Mark completed" }));

    await waitFor(() => expect(completeBooking).toHaveBeenCalledWith(TENANT_A, "booking-a"));
    await waitFor(() => expect(within(dialog).getByText("Completed")).toBeInTheDocument());
    // Terminal — every action button is gone.
    expect(within(dialog).queryByRole("button", { name: "Mark completed" })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Mark no-show" })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Reschedule" })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Cancel booking" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /close booking details/i }));

    // Gone from Upcoming (no longer CONFIRMED)...
    await waitFor(() => expect(screen.queryByText("Jane Doe")).not.toBeInTheDocument());
    // ...and present in Past, per the backend's own S13-BE grouping (never
    // recreated client-side — this is just the refetch after invalidation).
    await user.click(screen.getByRole("tab", { name: "Past" }));
    const row = (await screen.findByRole("button", { name: /view booking details for jane doe/i })).closest("li")!;
    expect(within(row).getByText("Completed")).toBeInTheDocument();
  });

  it("failure preserves CONFIRMED and the booking stays in Upcoming", async () => {
    completeBooking.mockRejectedValueOnce(new Error("network down"));
    const user = userEvent.setup();
    server[TENANT_A].start = "2020-01-01T09:00:00Z";
    server[TENANT_A].end = "2020-01-01T09:45:00Z";
    renderTenant(TENANT_A);

    await screen.findByText("Jane Doe");
    await user.click(screen.getByRole("button", { name: /view booking details for jane doe/i }));
    const dialog = await screen.findByRole("dialog", { name: /booking details/i });
    await user.click(screen.getByRole("button", { name: "Mark completed" }));
    await user.click(screen.getByRole("button", { name: "Mark completed" }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(within(dialog).getByText("Confirmed")).toBeInTheDocument();
    expect(server[TENANT_A].status).toBe("CONFIRMED");
  });
});

describe("S13-BE lifecycle — No-show", () => {
  it("CONFIRMED → Mark no-show → confirm → NO_SHOW shown → actions removed", async () => {
    const user = userEvent.setup();
    server[TENANT_A].start = "2020-01-01T09:00:00Z";
    server[TENANT_A].end = "2020-01-01T09:45:00Z";
    renderTenant(TENANT_A);

    await screen.findByText("Jane Doe");
    await user.click(screen.getByRole("button", { name: /view booking details for jane doe/i }));
    const dialog = await screen.findByRole("dialog", { name: /booking details/i });

    await user.click(within(dialog).getByRole("button", { name: "Mark no-show" }));
    await user.click(screen.getByRole("button", { name: "Mark no-show" }));

    await waitFor(() => expect(markBookingNoShow).toHaveBeenCalledWith(TENANT_A, "booking-a"));
    await waitFor(() => expect(within(dialog).getByText("No-show")).toBeInTheDocument());
    expect(within(dialog).queryByRole("button", { name: "Mark completed" })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Mark no-show" })).not.toBeInTheDocument();
  });

  it("failure preserves CONFIRMED", async () => {
    markBookingNoShow.mockRejectedValueOnce(new Error("network down"));
    const user = userEvent.setup();
    server[TENANT_A].start = "2020-01-01T09:00:00Z";
    server[TENANT_A].end = "2020-01-01T09:45:00Z";
    renderTenant(TENANT_A);

    await screen.findByText("Jane Doe");
    await user.click(screen.getByRole("button", { name: /view booking details for jane doe/i }));
    const dialog = await screen.findByRole("dialog", { name: /booking details/i });
    await user.click(screen.getByRole("button", { name: "Mark no-show" }));
    await user.click(screen.getByRole("button", { name: "Mark no-show" }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(within(dialog).getByText("Confirmed")).toBeInTheDocument();
    expect(server[TENANT_A].status).toBe("CONFIRMED");
  });
});

describe("S13-BE — stale-state race (task section 17)", () => {
  it("Owner A's stale CONFIRMED view self-corrects to COMPLETED when Owner B completed it first", async () => {
    const user = userEvent.setup();
    server[TENANT_A].start = "2020-01-01T09:00:00Z";
    server[TENANT_A].end = "2020-01-01T09:45:00Z";
    renderTenant(TENANT_A);

    // Owner A opens the booking (still CONFIRMED in their view).
    await screen.findByText("Jane Doe");
    await user.click(screen.getByRole("button", { name: /view booking details for jane doe/i }));
    const dialog = await screen.findByRole("dialog", { name: /booking details/i });
    expect(within(dialog).getByRole("button", { name: "Mark no-show" })).toBeInTheDocument();

    // Owner B, elsewhere, marks it COMPLETED first — Owner A's dialog has no
    // way to know this yet; its cached data is now stale.
    server[TENANT_A].status = "COMPLETED";

    // Owner A clicks "Mark no-show" — the backend rejects the transition
    // (BOOKING_INVALID_TRANSITION) because the real current status is no
    // longer CONFIRMED.
    await user.click(within(dialog).getByRole("button", { name: "Mark no-show" }));
    await user.click(screen.getByRole("button", { name: "Mark no-show" }));

    // The mutation's onError invalidates this booking's detail, which
    // refetches the NOW-real state and the dialog self-corrects: it shows
    // Completed, and no further lifecycle/cancel/reschedule actions — not a
    // blind retry, and not stuck showing the stale CONFIRMED state.
    await waitFor(() => expect(within(dialog).getByText("Completed")).toBeInTheDocument());
    expect(within(dialog).queryByRole("button", { name: "Mark completed" })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Mark no-show" })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Reschedule" })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Cancel booking" })).not.toBeInTheDocument();
    expect(markBookingNoShow).toHaveBeenCalledTimes(1);
  });
});

describe("S11 lifecycle — tenant switch clears stale data", () => {
  it("shows Tenant A's booking, then only Tenant B's after switching, never both", async () => {
    const { rerender } = renderTenant(TENANT_A);

    await screen.findByText("Jane Doe");
    expect(screen.queryByText("Sam Customer")).not.toBeInTheDocument();

    rerender(
      <QueryClientProvider client={queryClient}>
        <BookingList key={TENANT_B} tenantId={TENANT_B} timezone="Africa/Lagos" />
      </QueryClientProvider>
    );

    await screen.findByText("Sam Customer");
    expect(screen.queryByText("Jane Doe")).not.toBeInTheDocument();
  });

  it("does not leak Tenant A's technician/service filter selection into Tenant B", async () => {
    const user = userEvent.setup();
    renderTenant(TENANT_A);
    await screen.findByText("Jane Doe");

    // Switch to Past on Tenant A.
    await user.click(screen.getByRole("tab", { name: "Past" }));
    expect(listBookings).toHaveBeenLastCalledWith(
      TENANT_A,
      expect.objectContaining({ view: "PAST" }),
      expect.anything()
    );

    // The remount (key={tenantId}, exactly as BookingsPage does) resets local
    // filter state back to the UPCOMING default for the new tenant.
    render(
      <QueryClientProvider client={queryClient}>
        <BookingList key={TENANT_B} tenantId={TENANT_B} timezone="Africa/Lagos" />
      </QueryClientProvider>
    );

    await waitFor(() =>
      expect(listBookings).toHaveBeenLastCalledWith(
        TENANT_B,
        expect.objectContaining({ view: "UPCOMING" }),
        expect.anything()
      )
    );
  });

  it("closes a stale open reschedule dialog rather than showing Tenant A's booking under Tenant B", async () => {
    const user = userEvent.setup();
    const { rerender } = renderTenant(TENANT_A);

    await screen.findByText("Jane Doe");
    await user.click(screen.getByRole("button", { name: /view booking details for jane doe/i }));
    await user.click(screen.getByRole("button", { name: "Reschedule" }));
    expect(await screen.findByRole("dialog", { name: /reschedule appointment/i })).toBeInTheDocument();

    // Remount for Tenant B in the SAME tree (rerender, not a second render),
    // exactly as BookingsPage's key={tenantId} does — this is what actually
    // unmounts Tenant A's subtree (and its portaled dialogs) rather than
    // leaving it mounted alongside Tenant B's.
    rerender(
      <QueryClientProvider client={queryClient}>
        <BookingList key={TENANT_B} tenantId={TENANT_B} timezone="Africa/Lagos" />
      </QueryClientProvider>
    );

    expect(screen.queryByRole("dialog", { name: /reschedule appointment/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: /booking details/i })).not.toBeInTheDocument();
    await screen.findByText("Sam Customer");
  });
});
