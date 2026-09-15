"use client";

import { useState } from "react";

import { Dialog } from "@/components/ui/Dialog";
import { apiErrorMessage } from "@/lib/api/error-messages";
import { useCompleteBooking, useMarkBookingNoShow } from "@/modules/bookings/queries";
import type { TenantBookingDetail } from "@/modules/bookings/types";

type Outcome = "COMPLETED" | "NO_SHOW";

const COPY: Record<
  Outcome,
  { title: string; description: string; confirmLabel: string; pendingLabel: string; invalidTransition: string }
> = {
  COMPLETED: {
    title: "Mark this appointment as completed?",
    description: "This confirms that the appointment took place.",
    confirmLabel: "Mark completed",
    pendingLabel: "Marking completed…",
    invalidTransition: "This appointment can't be marked completed right now — its status may have changed.",
  },
  NO_SHOW: {
    title: "Mark this appointment as no-show?",
    description: "Use this when the customer did not attend the appointment.",
    confirmLabel: "Mark no-show",
    pendingLabel: "Marking no-show…",
    invalidTransition: "This appointment can't be marked no-show right now — its status may have changed.",
  },
};

/**
 * Confirmation before a terminal outcome (Scheduling S13-BE) — one component
 * for both Complete and No-show, since they are structurally identical
 * (confirm → call the matching mutation → hand the server-confirmed result
 * back), the same way the backend's own `transitionToTerminal` is one
 * implementation behind both `Complete` and `MarkNoShow`.
 *
 * Mirrors `CancelBookingDialog`'s shape, with the task's own copy: "Back" to
 * dismiss (not "Keep booking" — these two actions aren't about keeping vs.
 * discarding a booking, they're recording what already happened), and no
 * mention of fees, penalties, or reasons — out of scope for this version.
 *
 * On success, hands the server-confirmed `TenantBookingDetail` back via
 * `onUpdated` — never assumed locally — exactly like `CancelBookingDialog`'s
 * `onCancelled`. `useCompleteBooking`/`useMarkBookingNoShow` already
 * invalidate every list for this tenant.
 */
export function MarkBookingOutcomeDialog({
  outcome,
  tenantId,
  booking,
  onUpdated,
  onClose,
}: {
  outcome: Outcome;
  tenantId: string;
  booking: TenantBookingDetail;
  onUpdated: (updated: TenantBookingDetail) => void;
  onClose: () => void;
}) {
  const completeBooking = useCompleteBooking(tenantId);
  const markNoShow = useMarkBookingNoShow(tenantId);
  const mutation = outcome === "COMPLETED" ? completeBooking : markNoShow;
  const copy = COPY[outcome];

  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setError(null);
    try {
      const updated = await mutation.mutateAsync(booking.id);
      onUpdated(updated);
    } catch (err) {
      setError(apiErrorMessage(err, { BOOKING_INVALID_TRANSITION: copy.invalidTransition }));
    }
  }

  return (
    <Dialog
      title={copy.title}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={mutation.isPending}
            className="btn-secondary h-10 px-4 text-sm disabled:opacity-60"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={mutation.isPending}
            className="btn-primary h-10 px-4 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            {mutation.isPending ? copy.pendingLabel : copy.confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm text-slate-600 dark:text-slate-400">{copy.description}</p>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300"
        >
          {error}
        </p>
      )}
    </Dialog>
  );
}
