"use client";

import { useState } from "react";

import { Dialog } from "@/components/ui/Dialog";
import { apiErrorMessage } from "@/lib/api/error-messages";
import { useCancelBooking } from "@/modules/bookings/queries";
import type { TenantBookingDetail } from "@/modules/bookings/types";

/**
 * Confirmation before cancelling — cancellation is destructive from the
 * scheduling perspective (it frees the slot back up publicly), so this asks
 * first, mirroring `ArchiveServiceDialog`'s shape exactly.
 *
 * Makes no claim about money: the backend contract has no payment/refund
 * concept for a booking, so the consequence copy states only what is
 * actually true — the appointment is cancelled and the time slot becomes
 * bookable again.
 *
 * On success, hands the server-confirmed `TenantBookingDetail` back to the
 * caller via `onCancelled` — never assumed locally — so the caller (the
 * detail dialog) can update its own view of the booking without a second
 * fetch. `useCancelBooking` already invalidates every list for this tenant.
 */
export function CancelBookingDialog({
  tenantId,
  booking,
  onCancelled,
  onClose,
}: {
  tenantId: string;
  booking: TenantBookingDetail;
  onCancelled: (updated: TenantBookingDetail) => void;
  onClose: () => void;
}) {
  const cancelBooking = useCancelBooking(tenantId);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel() {
    setError(null);
    try {
      const updated = await cancelBooking.mutateAsync(booking.id);
      onCancelled(updated);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  return (
    <Dialog
      title="Cancel this booking?"
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={cancelBooking.isPending}
            className="btn-secondary h-10 px-4 text-sm disabled:opacity-60"
          >
            Keep booking
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={cancelBooking.isPending}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelBooking.isPending ? "Cancelling…" : "Cancel booking"}
          </button>
        </>
      }
    >
      <p className="text-sm text-slate-600 dark:text-slate-400">
        This will cancel the appointment and make the time slot available for booking again.
      </p>

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
