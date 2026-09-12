"use client";

import { useState } from "react";

import { Dialog } from "@/components/ui/Dialog";
import { apiErrorMessage } from "@/lib/api/error-messages";
import { formatDuration } from "@/lib/scheduling/duration";
import { formatBookingInstant } from "@/modules/bookings/format";
import { useBooking } from "@/modules/bookings/queries";
import type { TenantBookingDetail } from "@/modules/bookings/types";
import { useCan } from "@/providers/permissions-provider";

import { BookingStatusBadge } from "./booking-status-badge";
import { CancelBookingDialog } from "./cancel-booking-dialog";

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
  const canCancel = useCan("booking.update");
  const [isCancelling, setIsCancelling] = useState(false);

  const booking = bookingQuery.data;
  // Cancelling an already-CANCELLED booking is a no-op server-side, so the
  // control is simply absent there rather than offering an action with no
  // effect — the same convention `ServiceRow`'s `onArchive` uses.
  const showCancelAction = canCancel && booking?.status === "CONFIRMED";

  return (
    <>
      <Dialog
        title="Booking details"
        onClose={onClose}
        footer={
          showCancelAction ? (
            <button
              type="button"
              onClick={() => setIsCancelling(true)}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-rose-300 px-4 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-300 dark:hover:bg-rose-950/40"
            >
              Cancel booking
            </button>
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
