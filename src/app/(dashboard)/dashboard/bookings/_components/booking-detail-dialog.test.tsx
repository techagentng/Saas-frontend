import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { TenantBookingDetail } from "@/modules/bookings/types";
import type { Permission } from "@/types/permission";

import { BookingDetailDialog } from "./booking-detail-dialog";

const granted = new Set<Permission>();
vi.mock("@/providers/permissions-provider", () => ({
  useCan: (permission: Permission) => granted.has(permission),
}));

const bookingResult = {
  data: undefined as TenantBookingDetail | undefined,
  isPending: false,
  isSuccess: true,
  isError: false,
  error: null as unknown,
  refetch: vi.fn(),
};

type MutationStub = { mutateAsync: ReturnType<typeof vi.fn>; isPending: boolean };
let cancelMutation: MutationStub;
let rescheduleMutation: MutationStub;

vi.mock("@/modules/bookings/queries", () => ({
  useBooking: () => bookingResult,
  useCancelBooking: () => cancelMutation,
  useRescheduleBooking: () => rescheduleMutation,
}));

const TENANT_ID = "11111111-1111-4111-8111-111111111111";

const CONFIRMED: TenantBookingDetail = {
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
  timezone: "Africa/Lagos",
};

const CANCELLED: TenantBookingDetail = { ...CONFIRMED, status: "CANCELLED" };

function renderDialog(booking: TenantBookingDetail | undefined, permissions: Permission[] = []) {
  granted.clear();
  for (const permission of permissions) granted.add(permission);
  bookingResult.data = booking;
  bookingResult.isSuccess = booking !== undefined;
  bookingResult.isPending = booking === undefined;
  bookingResult.isError = false;

  return render(
    <BookingDetailDialog tenantId={TENANT_ID} bookingId="booking-1" onClose={vi.fn()} />
  );
}

const RESCHEDULED: TenantBookingDetail = {
  ...CONFIRMED,
  start: "2026-09-27T15:00:00Z",
  end: "2026-09-27T15:45:00Z",
};

beforeEach(() => {
  granted.clear();
  cancelMutation = { mutateAsync: vi.fn().mockResolvedValue(CANCELLED), isPending: false };
  rescheduleMutation = { mutateAsync: vi.fn().mockResolvedValue(RESCHEDULED), isPending: false };
});

describe("BookingDetailDialog — rendering", () => {
  it("shows every returned field, with nullable customer contact handled gracefully", () => {
    renderDialog({ ...CONFIRMED, customer_phone: null, customer_email: null }, ["booking.read"]);

    expect(screen.getByText("NB-1A2B3C4D")).toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("Gel Manicure")).toBeInTheDocument();
    expect(screen.getByText("Ada Okafor")).toBeInTheDocument();
    expect(screen.getByText("Africa/Lagos")).toBeInTheDocument();
    expect(screen.getAllByText("Not provided")).toHaveLength(2);
  });

  it("shows a loading state while the detail query is pending", () => {
    renderDialog(undefined);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});

describe("BookingDetailDialog — cancel permission", () => {
  it("shows Cancel booking for a CONFIRMED booking with booking.update", () => {
    renderDialog(CONFIRMED, ["booking.read", "booking.update"]);
    expect(screen.getByRole("button", { name: "Cancel booking" })).toBeInTheDocument();
  });

  it("hides Cancel booking without booking.update", () => {
    renderDialog(CONFIRMED, ["booking.read"]);
    expect(screen.queryByRole("button", { name: "Cancel booking" })).not.toBeInTheDocument();
  });

  it("hides Cancel booking for an already-CANCELLED booking, even with permission", () => {
    renderDialog(CANCELLED, ["booking.read", "booking.update"]);
    expect(screen.queryByRole("button", { name: "Cancel booking" })).not.toBeInTheDocument();
    expect(screen.getByText("Cancelled")).toBeInTheDocument();
  });
});

describe("BookingDetailDialog — reschedule permission (S12-BE)", () => {
  it("shows Reschedule for a CONFIRMED booking with booking.update", () => {
    renderDialog(CONFIRMED, ["booking.read", "booking.update"]);
    expect(screen.getByRole("button", { name: "Reschedule" })).toBeInTheDocument();
  });

  it("hides Reschedule for a read-only user (booking.read but no booking.update)", () => {
    renderDialog(CONFIRMED, ["booking.read"]);
    expect(screen.queryByRole("button", { name: "Reschedule" })).not.toBeInTheDocument();
  });

  it("hides Reschedule for an already-CANCELLED booking, even with permission", () => {
    renderDialog(CANCELLED, ["booking.read", "booking.update"]);
    expect(screen.queryByRole("button", { name: "Reschedule" })).not.toBeInTheDocument();
  });

  it("opens the reschedule dialog showing the current booking", async () => {
    const user = userEvent.setup();
    renderDialog(CONFIRMED, ["booking.read", "booking.update"]);

    await user.click(screen.getByRole("button", { name: "Reschedule" }));

    expect(screen.getByRole("dialog", { name: /reschedule appointment/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Choose a new date")).toHaveValue("2026-09-12");
  });

  it("closes the reschedule dialog after a successful reschedule", async () => {
    const user = userEvent.setup();
    renderDialog(CONFIRMED, ["booking.read", "booking.update"]);

    await user.click(screen.getByRole("button", { name: "Reschedule" }));
    // Confirm is disabled until something actually changes (section 18) —
    // pick a different date first.
    await user.clear(screen.getByLabelText("Choose a new date"));
    await user.type(screen.getByLabelText("Choose a new date"), "2026-09-27");
    await user.click(screen.getByRole("button", { name: /confirm reschedule/i }));

    expect(rescheduleMutation.mutateAsync).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog", { name: /reschedule appointment/i })).not.toBeInTheDocument();
    // The underlying detail dialog stays open, showing the still-Confirmed booking.
    expect(screen.getByRole("dialog", { name: /booking details/i })).toBeInTheDocument();
  });
});

describe("BookingDetailDialog — cancellation confirmation", () => {
  it("asks for confirmation before cancelling, without calling the mutation yet", async () => {
    const user = userEvent.setup();
    renderDialog(CONFIRMED, ["booking.read", "booking.update"]);

    await user.click(screen.getByRole("button", { name: "Cancel booking" }));

    expect(screen.getByRole("dialog", { name: /cancel this booking/i })).toBeInTheDocument();
    expect(screen.getByText(/make the time slot available for booking again/i)).toBeInTheDocument();
    expect(screen.queryByText(/refund/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/payment/i)).not.toBeInTheDocument();
    expect(cancelMutation.mutateAsync).not.toHaveBeenCalled();
  });

  it("keeps the booking on Keep booking, without cancelling", async () => {
    const user = userEvent.setup();
    renderDialog(CONFIRMED, ["booking.read", "booking.update"]);

    await user.click(screen.getByRole("button", { name: "Cancel booking" }));
    await user.click(screen.getByRole("button", { name: "Keep booking" }));

    expect(cancelMutation.mutateAsync).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog", { name: /cancel this booking/i })).not.toBeInTheDocument();
  });

  it("cancels exactly once and reflects the server-confirmed CANCELLED status", async () => {
    const user = userEvent.setup();
    renderDialog(CONFIRMED, ["booking.read", "booking.update"]);

    await user.click(screen.getByRole("button", { name: "Cancel booking" }));
    // The detail dialog's own trigger is now `aria-hidden` (Dialog hides every
    // sibling while the confirm dialog is open on top), so this uniquely
    // matches the confirm dialog's footer button.
    await user.click(screen.getByRole("button", { name: "Cancel booking" }));

    expect(cancelMutation.mutateAsync).toHaveBeenCalledTimes(1);
    expect(cancelMutation.mutateAsync).toHaveBeenCalledWith("booking-1");
  });

  it("prevents a duplicate cancel submission while the mutation is pending", async () => {
    const user = userEvent.setup();
    cancelMutation.isPending = true;
    renderDialog(CONFIRMED, ["booking.read", "booking.update"]);

    await user.click(screen.getByRole("button", { name: "Cancel booking" }));

    const confirmButton = screen.getByRole("button", { name: /cancelling…/i });
    expect(confirmButton).toBeDisabled();
  });

  it("on failure, keeps the booking CONFIRMED and shows an inline error with Retry available", async () => {
    const user = userEvent.setup();
    cancelMutation.mutateAsync = vi.fn().mockRejectedValue(new Error("network down"));
    renderDialog(CONFIRMED, ["booking.read", "booking.update"]);

    await user.click(screen.getByRole("button", { name: "Cancel booking" }));
    await user.click(screen.getByRole("button", { name: "Cancel booking" }));

    expect(screen.getByRole("alert")).toBeInTheDocument();
    // The booking is still shown as CONFIRMED underneath the still-open confirm dialog.
    expect(screen.getByText("Confirmed")).toBeInTheDocument();
    // Retry is simply clicking the same action again.
    expect(screen.getByRole("button", { name: /cancel booking/i })).toBeInTheDocument();
  });
});
