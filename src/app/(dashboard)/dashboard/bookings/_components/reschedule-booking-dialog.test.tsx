import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { TenantBookingDetail } from "@/modules/bookings/types";

import { RescheduleBookingDialog } from "./reschedule-booking-dialog";

type MutationStub = { mutateAsync: ReturnType<typeof vi.fn>; isPending: boolean };
let mutation: MutationStub;

vi.mock("@/modules/bookings/queries", () => ({
  useRescheduleBooking: () => mutation,
}));

const TENANT_ID = "11111111-1111-4111-8111-111111111111";

const BOOKING: TenantBookingDetail = {
  id: "booking-1",
  reference: "NB-1A2B3C4D",
  status: "CONFIRMED",
  service: { id: "svc-1", name: "Gel Manicure" },
  staff: { id: "staff-1", name: "Ada Okafor" },
  customer_name: "Jane Doe",
  customer_phone: "+2348000000000",
  customer_email: "jane@example.com",
  // 2026-09-15 10:00–10:45 in Africa/Lagos (UTC+1) → 09:00–09:45 UTC.
  start: "2026-09-15T09:00:00Z",
  end: "2026-09-15T09:45:00Z",
  duration_minutes: 45,
  created_at: "2026-09-01T00:00:00Z",
  timezone: "Africa/Lagos",
};

const RESCHEDULED: TenantBookingDetail = {
  ...BOOKING,
  start: "2026-09-27T15:00:00Z",
  end: "2026-09-27T15:45:00Z",
};

function renderDialog(booking: TenantBookingDetail = BOOKING) {
  return render(
    <RescheduleBookingDialog
      tenantId={TENANT_ID}
      booking={booking}
      onRescheduled={vi.fn()}
      onClose={vi.fn()}
    />
  );
}

beforeEach(() => {
  mutation = { mutateAsync: vi.fn().mockResolvedValue(RESCHEDULED), isPending: false };
});

describe("RescheduleBookingDialog — displays current booking", () => {
  it("shows the current date/time and fixed service/technician for context", () => {
    renderDialog();

    expect(screen.getByText(/sep 15, 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/10:00 AM.*10:45 AM/)).toBeInTheDocument();
    expect(screen.getByText(/Gel Manicure/)).toBeInTheDocument();
    expect(screen.getByText(/Ada Okafor/)).toBeInTheDocument();
  });

  it("pre-fills the date/time inputs from the booking's own tenant-local values", () => {
    renderDialog();

    expect(screen.getByLabelText("Choose a new date")).toHaveValue("2026-09-15");
    expect(screen.getByLabelText("Start time")).toHaveValue("10:00");
  });

  it("offers no control to change service or technician", () => {
    renderDialog();

    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/service/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/technician/i)).not.toBeInTheDocument();
  });
});

describe("RescheduleBookingDialog — same slot", () => {
  it("disables Confirm reschedule until something actually changes", async () => {
    const user = userEvent.setup();
    renderDialog();

    expect(screen.getByRole("button", { name: /confirm reschedule/i })).toBeDisabled();

    await user.clear(screen.getByLabelText("Start time"));
    await user.type(screen.getByLabelText("Start time"), "1100");

    expect(screen.getByRole("button", { name: /confirm reschedule/i })).toBeEnabled();
  });
});

describe("RescheduleBookingDialog — submit", () => {
  it("submits the exact booking id and the edited date/start", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.clear(screen.getByLabelText("Choose a new date"));
    await user.type(screen.getByLabelText("Choose a new date"), "2026-09-27");
    await user.clear(screen.getByLabelText("Start time"));
    await user.type(screen.getByLabelText("Start time"), "1600");
    await user.click(screen.getByRole("button", { name: /confirm reschedule/i }));

    expect(mutation.mutateAsync).toHaveBeenCalledTimes(1);
    expect(mutation.mutateAsync).toHaveBeenCalledWith({
      bookingId: "booking-1",
      input: { date: "2026-09-27", start: "16:00" },
    });
  });

  it("calls onRescheduled with the server-confirmed booking on success", async () => {
    const user = userEvent.setup();
    const onRescheduled = vi.fn();
    render(
      <RescheduleBookingDialog
        tenantId={TENANT_ID}
        booking={BOOKING}
        onRescheduled={onRescheduled}
        onClose={vi.fn()}
      />
    );

    await user.clear(screen.getByLabelText("Choose a new date"));
    await user.type(screen.getByLabelText("Choose a new date"), "2026-09-27");
    await user.click(screen.getByRole("button", { name: /confirm reschedule/i }));

    expect(onRescheduled).toHaveBeenCalledWith(RESCHEDULED);
  });

  it("shows a pending label and disables Confirm while the mutation is in flight (duplicate-submit guard)", () => {
    mutation.isPending = true;
    renderDialog();

    const button = screen.getByRole("button", { name: /rescheduling…/i });
    expect(button).toBeDisabled();
  });
});

describe("RescheduleBookingDialog — 409 conflict", () => {
  it("keeps the dialog open with a clear message and lets the user try another time", async () => {
    const user = userEvent.setup();
    const { ApiError } = await import("@/lib/api/errors");
    mutation.mutateAsync = vi
      .fn()
      .mockRejectedValue(new ApiError(409, { code: "BOOKING_SLOT_UNAVAILABLE", message: "gone" }));
    renderDialog();

    await user.clear(screen.getByLabelText("Choose a new date"));
    await user.type(screen.getByLabelText("Choose a new date"), "2026-09-27");
    await user.click(screen.getByRole("button", { name: /confirm reschedule/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/no longer available/i);
    // The dialog is still open and editable — the user can pick another time.
    expect(screen.getByRole("dialog", { name: /reschedule appointment/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Start time")).toBeEnabled();
  });
});

describe("RescheduleBookingDialog — other errors", () => {
  it("maps VALIDATION_FAILED to friendly copy without discarding the form", async () => {
    const user = userEvent.setup();
    const { ApiError } = await import("@/lib/api/errors");
    mutation.mutateAsync = vi
      .fn()
      .mockRejectedValue(new ApiError(400, { code: "VALIDATION_FAILED", message: "only a confirmed booking can be rescheduled" }));
    renderDialog();

    await user.clear(screen.getByLabelText("Choose a new date"));
    await user.type(screen.getByLabelText("Choose a new date"), "2026-09-27");
    await user.click(screen.getByRole("button", { name: /confirm reschedule/i }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText(/only a confirmed booking can be rescheduled/i)).not.toBeInTheDocument();
  });
});
