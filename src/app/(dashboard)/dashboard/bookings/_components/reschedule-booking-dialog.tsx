"use client";

import { useState } from "react";

import { Dialog } from "@/components/ui/Dialog";
import { fieldInputClass } from "@/components/ui/field";
import { apiErrorMessage } from "@/lib/api/error-messages";
import { formatBookingInstant, toTenantLocalDateAndTime } from "@/modules/bookings/format";
import { useRescheduleBooking } from "@/modules/bookings/queries";
import type { TenantBookingDetail } from "@/modules/bookings/types";

/**
 * Reschedule — moves a CONFIRMED booking to a new date/start, preserving its
 * id, reference, customer, service and technician (Scheduling S12-BE).
 *
 * NO slot-availability preview: `AvailabilityService.GetAvailabilityExcludingBooking`
 * — the backend's booking-aware ("doesn't conflict with its own current
 * slot") availability check — exists only as a private collaborator inside
 * the reschedule endpoint's own atomic validate-then-write call. It is never
 * exposed over HTTP (confirmed against `availability_handler.go`: the one
 * exposed route, `GET .../availability`, still calls plain `GetAvailability`,
 * unmodified). Reusing that endpoint for a slot grid here would misreport
 * this booking's own current time as a conflict — exactly the self-conflict
 * problem S12-BE exists to prevent — so this dialog asks for a plain date +
 * start time instead of a slot grid, and lets the real reschedule call be the
 * only source of truth: a request either succeeds or fails with a real error
 * (see the 409 handling below). This was a deliberate, user-confirmed product
 * decision given the missing route, not an oversight.
 */
export function RescheduleBookingDialog({
  tenantId,
  booking,
  onRescheduled,
  onClose,
}: {
  tenantId: string;
  booking: TenantBookingDetail;
  onRescheduled: (updated: TenantBookingDetail) => void;
  onClose: () => void;
}) {
  const reschedule = useRescheduleBooking(tenantId);

  const initial = toTenantLocalDateAndTime(booking.start, booking.timezone);
  const [date, setDate] = useState(initial.date);
  const [start, setStart] = useState(initial.time);
  const [error, setError] = useState<string | null>(null);

  const currentStart = formatBookingInstant(booking.start, booking.timezone);
  const currentEnd = formatBookingInstant(booking.end, booking.timezone);
  // Reliable because both values are the SAME tenant-timezone representation
  // the inputs are seeded from — a plain string comparison is enough, no
  // instant math needed. Backend still treats a same-slot submit as a valid
  // no-op; this only skips a pointless round trip (task's own "optionally
  // disable Confirm when nothing changed").
  const unchanged = date === initial.date && start === initial.time;

  async function handleSubmit() {
    setError(null);
    try {
      const updated = await reschedule.mutateAsync({ bookingId: booking.id, input: { date, start } });
      onRescheduled(updated);
    } catch (err) {
      setError(
        apiErrorMessage(err, {
          BOOKING_SLOT_UNAVAILABLE: "That time is no longer available. Choose another time.",
          VALIDATION_FAILED:
            "That date and time couldn't be booked — check the booking is still confirmed and the time is valid.",
        })
      );
    }
  }

  return (
    <Dialog
      title="Reschedule appointment"
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={reschedule.isPending}
            className="btn-secondary h-10 px-4 text-sm disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={reschedule.isPending || unchanged}
            className="btn-primary h-10 px-4 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            {reschedule.isPending ? "Rescheduling…" : "Confirm reschedule"}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <section className="flex flex-col gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm dark:border-slate-800 dark:bg-slate-900/60">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Current appointment
          </h3>
          <p className="text-slate-900 dark:text-slate-100">{currentStart.date}</p>
          <p className="text-slate-700 dark:text-slate-300">
            {currentStart.time} – {currentEnd.time}
          </p>
          {/* Service and technician are shown for context only — fixed,
              never editable here (staff/service reassignment is out of
              scope for this feature). */}
          <p className="text-slate-600 dark:text-slate-400">
            {booking.service.name} · {booking.staff.name}
          </p>
        </section>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="reschedule-date" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Choose a new date
          </label>
          <input
            id="reschedule-date"
            type="date"
            value={date}
            disabled={reschedule.isPending}
            onChange={(event) => setDate(event.target.value)}
            className={`${fieldInputClass} h-10`}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="reschedule-start" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Start time
          </label>
          <input
            id="reschedule-start"
            type="time"
            value={start}
            disabled={reschedule.isPending}
            onChange={(event) => setStart(event.target.value)}
            className={`${fieldInputClass} h-10 w-40`}
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Times are in this business&apos;s timezone ({booking.timezone}).
          </p>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300"
          >
            {error}
          </p>
        )}
      </div>
    </Dialog>
  );
}
