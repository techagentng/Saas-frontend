"use client";

import { useState } from "react";

import { Dialog } from "@/components/ui/Dialog";
import { apiErrorMessage } from "@/lib/api/error-messages";
import { formatDuration } from "@/lib/scheduling/duration";
import { formatBookingInstant, hasBookingEnded } from "@/modules/bookings/format";
import { useBooking } from "@/modules/bookings/queries";
import type { TenantBookingDetail } from "@/modules/bookings/types";
import { useCan } from "@/providers/permissions-provider";

import { BookingStatusBadge } from "./booking-status-badge";
import { CancelBookingDialog } from "./cancel-booking-dialog";
import { MarkBookingOutcomeDialog } from "./mark-booking-outcome-dialog";
import { RescheduleBookingDialog } from "./reschedule-booking-dialog";

/**
 * Booking detail — the dashboard's one existing modal interaction pattern
 * (`Dialog`), not a drawer or a second page. Fetches independently via
 * `useBooking` rather than trusting the row's already-fetched summary, so
 * detail always reflects the CURRENT server state (matters most right after
 * a cancellation elsewhere invalidates the list but this dialog is still
 * open).
 *
 * Only fields the backend actually returns are shown — no price/currency
 * (this DTO carries neither; see `modules/bookings/types.ts`), and nullable
 * customer contact fields render "Not provided" rather than being silently
 * omitted, so the layout does not shift based on which fields a customer
 * happened to give.
 */
export function BookingDetailDialog({
  tenantId,
  bookingId,
  onClose,
}: {
  tenantId: string;
  bookingId: string;
  onClose: () => void;
}) {
  const bookingQuery = useBooking(tenantId, bookingId);
  // `booking.update` gates both actions — there is deliberately no
  // `booking.cancel`/`booking.reschedule` permission (the backend route
  // comment documents this: both change a booking's state, not a new kind of
  // action). Only a CONFIRMED booking offers either — the same convention
  // `ServiceRow`'s `onArchive` uses for an already-archived service.
  const canManage = useCan("booking.update");
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [outcomeDialog, setOutcomeDialog] = useState<"COMPLETED" | "NO_SHOW" | null>(null);

  const booking = bookingQuery.data;
  const showManageActions = canManage && booking?.status === "CONFIRMED";
  // Scheduling S13-BE: only once the appointment has actually ended — a
  // UX-only hint (see `hasBookingEnded`'s own doc comment); the backend
  // re-validates independently and remains the final authority regardless.
  const showLifecycleActions = showManageActions && booking !== undefined && hasBookingEnded(booking.end);

  return (
    <>
      <Dialog
        title="Booking details"
        onClose={onClose}
        footer={
          showManageActions ? (
            <>
              {showLifecycleActions && (
                <>
                  <button
                    type="button"
                    onClick={() => setOutcomeDialog("COMPLETED")}
                    className="btn-secondary h-10 px-4 text-sm"
                  >
                    Mark completed
                  </button>
                  <button
                    type="button"
                    onClick={() => setOutcomeDialog("NO_SHOW")}
                    className="btn-secondary h-10 px-4 text-sm"
                  >
                    Mark no-show
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setIsRescheduling(true)}
                className="btn-secondary h-10 px-4 text-sm"
              >
                Reschedule
              </button>
              <button
                type="button"
                onClick={() => setIsCancelling(true)}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-rose-300 px-4 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-300 dark:hover:bg-rose-950/40"
              >
                Cancel booking
              </button>
            </>
          ) : undefined
        }
      >
        {bookingQuery.isPending && (
          <p role="status" aria-live="polite" className="text-sm text-slate-500 dark:text-slate-400">
            Loading…
          </p>
        )}

        {bookingQuery.isError && (
          <div role="alert" className="flex flex-col items-start gap-3">
            <p className="text-sm text-rose-700 dark:text-rose-300">
              {apiErrorMessage(bookingQuery.error)}
            </p>
            <button
              type="button"
              onClick={() => bookingQuery.refetch()}
              className="btn-secondary h-9 px-3.5 text-sm"
            >
              Try again
            </button>
          </div>
        )}

        {bookingQuery.isSuccess && booking && <BookingDetailContent booking={booking} />}
      </Dialog>

      {isCancelling && booking && (
        <CancelBookingDialog
          tenantId={tenantId}
          booking={booking}
          onCancelled={() => setIsCancelling(false)}
          onClose={() => setIsCancelling(false)}
        />
      )}

      {isRescheduling && booking && (
        <RescheduleBookingDialog
          tenantId={tenantId}
          booking={booking}
          onRescheduled={() => setIsRescheduling(false)}
          onClose={() => setIsRescheduling(false)}
        />
      )}

      {outcomeDialog && booking && (
        <MarkBookingOutcomeDialog
          outcome={outcomeDialog}
          tenantId={tenantId}
          booking={booking}
          onUpdated={() => setOutcomeDialog(null)}
          onClose={() => setOutcomeDialog(null)}
        />
      )}
    </>
  );
}

function BookingDetailContent({ booking }: { booking: TenantBookingDetail }) {
  const start = formatBookingInstant(booking.start, booking.timezone);
  const end = formatBookingInstant(booking.end, booking.timezone);

  return (
    <div className="flex flex-col gap-5 text-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-sm text-slate-600 dark:text-slate-400">{booking.reference}</p>
        <BookingStatusBadge status={booking.status} />
      </div>

      <Section title="Customer">
        <Field label="Name" value={booking.customer_name} />
        <Field label="Email" value={booking.customer_email ?? "Not provided"} />
        <Field label="Phone" value={booking.customer_phone ?? "Not provided"} />
      </Section>

      <Section title="Appointment">
        <Field label="Service" value={booking.service.name} />
        <Field label="Technician" value={booking.staff.name} />
        <Field label="Date" value={start.date} />
        <Field label="Start" value={start.time} />
        <Field label="End" value={end.time} />
        <Field label="Duration" value={formatDuration(booking.duration_minutes)} />
        <Field label="Timezone" value={booking.timezone} />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {title}
      </h3>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">{children}</dl>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="text-slate-900 dark:text-slate-100">{value}</dd>
    </>
  );
}
