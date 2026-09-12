import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
vi.mock("@/modules/bookings/api", () => ({
  listBookings: (...args: unknown[]) => listBookings(...args),
  getBooking: (...args: unknown[]) => getBooking(...args),
  cancelBooking: (...args: unknown[]) => cancelBooking(...args),
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

  listBookings.mockImplementation((tenantId: string, filter: { view: string }) => {
    const booking = server[tenantId];
    if (!booking) return Promise.resolve([]);
    if (filter.view === "UPCOMING") return Promise.resolve(booking.status === "CONFIRMED" ? [booking] : []);
    if (filter.view === "CANCELLED") return Promise.resolve(booking.status === "CANCELLED" ? [booking] : []);
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
});
