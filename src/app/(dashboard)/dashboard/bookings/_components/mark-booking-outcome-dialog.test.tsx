import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { TenantBookingDetail } from "@/modules/bookings/types";

import { MarkBookingOutcomeDialog } from "./mark-booking-outcome-dialog";

type MutationStub = { mutateAsync: ReturnType<typeof vi.fn>; isPending: boolean };
let completeMutation: MutationStub;
let noShowMutation: MutationStub;

vi.mock("@/modules/bookings/queries", () => ({
  useCompleteBooking: () => completeMutation,
  useMarkBookingNoShow: () => noShowMutation,
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
  start: "2020-01-01T09:00:00Z",
  end: "2020-01-01T09:45:00Z",
  duration_minutes: 45,
  created_at: "2020-01-01T00:00:00Z",
  timezone: "Africa/Lagos",
};

const COMPLETED: TenantBookingDetail = { ...CONFIRMED, status: "COMPLETED" };
const NO_SHOW: TenantBookingDetail = { ...CONFIRMED, status: "NO_SHOW" };

beforeEach(() => {
  completeMutation = { mutateAsync: vi.fn().mockResolvedValue(COMPLETED), isPending: false };
  noShowMutation = { mutateAsync: vi.fn().mockResolvedValue(NO_SHOW), isPending: false };
});

describe("MarkBookingOutcomeDialog — Completed", () => {
  it("uses the task's exact copy and calls no mutation before confirming", () => {
    render(
      <MarkBookingOutcomeDialog
        outcome="COMPLETED"
        tenantId={TENANT_ID}
        booking={CONFIRMED}
        onUpdated={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByRole("dialog", { name: /mark this appointment as completed\?/i })).toBeInTheDocument();
    expect(screen.getByText("This confirms that the appointment took place.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mark completed" })).toBeInTheDocument();
    expect(completeMutation.mutateAsync).not.toHaveBeenCalled();
  });

  it("Back dismisses without calling the mutation", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <MarkBookingOutcomeDialog
        outcome="COMPLETED"
        tenantId={TENANT_ID}
        booking={CONFIRMED}
        onUpdated={vi.fn()}
        onClose={onClose}
      />
    );

    await user.click(screen.getByRole("button", { name: "Back" }));

    expect(completeMutation.mutateAsync).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("confirms exactly once with the right booking id and calls onUpdated with the server result", async () => {
    const user = userEvent.setup();
    const onUpdated = vi.fn();
    render(
      <MarkBookingOutcomeDialog
        outcome="COMPLETED"
        tenantId={TENANT_ID}
        booking={CONFIRMED}
        onUpdated={onUpdated}
        onClose={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: "Mark completed" }));

    expect(completeMutation.mutateAsync).toHaveBeenCalledTimes(1);
    expect(completeMutation.mutateAsync).toHaveBeenCalledWith("booking-1");
    expect(noShowMutation.mutateAsync).not.toHaveBeenCalled();
    expect(onUpdated).toHaveBeenCalledWith(COMPLETED);
  });

  it("shows a pending label and disables both buttons while in flight (duplicate-submit guard)", () => {
    completeMutation.isPending = true;
    render(
      <MarkBookingOutcomeDialog
        outcome="COMPLETED"
        tenantId={TENANT_ID}
        booking={CONFIRMED}
        onUpdated={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: /marking completed…/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Back" })).toBeDisabled();
  });

  it("on failure, keeps the dialog open with an inline error and no fee/penalty language", async () => {
    const user = userEvent.setup();
    completeMutation.mutateAsync = vi.fn().mockRejectedValue(new Error("network down"));
    render(
      <MarkBookingOutcomeDialog
        outcome="COMPLETED"
        tenantId={TENANT_ID}
        booking={CONFIRMED}
        onUpdated={vi.fn()}
        onClose={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: "Mark completed" }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: /mark this appointment as completed\?/i })).toBeInTheDocument();
    expect(screen.queryByText(/fee|penalt/i)).not.toBeInTheDocument();
  });
});

describe("MarkBookingOutcomeDialog — No-show", () => {
  it("uses the task's exact copy, with no fee/penalty language", () => {
    render(
      <MarkBookingOutcomeDialog
        outcome="NO_SHOW"
        tenantId={TENANT_ID}
        booking={CONFIRMED}
        onUpdated={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByRole("dialog", { name: /mark this appointment as no-show\?/i })).toBeInTheDocument();
    expect(
      screen.getByText("Use this when the customer did not attend the appointment.")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mark no-show" })).toBeInTheDocument();
    expect(screen.queryByText(/fee|penalt/i)).not.toBeInTheDocument();
  });

  it("confirms exactly once against the no-show mutation, never completing it instead", async () => {
    const user = userEvent.setup();
    const onUpdated = vi.fn();
    render(
      <MarkBookingOutcomeDialog
        outcome="NO_SHOW"
        tenantId={TENANT_ID}
        booking={CONFIRMED}
        onUpdated={onUpdated}
        onClose={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: "Mark no-show" }));

    expect(noShowMutation.mutateAsync).toHaveBeenCalledTimes(1);
    expect(noShowMutation.mutateAsync).toHaveBeenCalledWith("booking-1");
    expect(completeMutation.mutateAsync).not.toHaveBeenCalled();
    expect(onUpdated).toHaveBeenCalledWith(NO_SHOW);
  });

  it("maps a stale-transition conflict to the outcome-specific message", async () => {
    const user = userEvent.setup();
    const { ApiError } = await import("@/lib/api/errors");
    noShowMutation.mutateAsync = vi
      .fn()
      .mockRejectedValue(new ApiError(409, { code: "BOOKING_INVALID_TRANSITION", message: "nope" }));
    render(
      <MarkBookingOutcomeDialog
        outcome="NO_SHOW"
        tenantId={TENANT_ID}
        booking={CONFIRMED}
        onUpdated={vi.fn()}
        onClose={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: "Mark no-show" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/status may have changed/i);
  });
});
