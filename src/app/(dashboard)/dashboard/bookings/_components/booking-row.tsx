"use client";

import { formatBookingInstant } from "@/modules/bookings/format";
import type { TenantBooking } from "@/modules/bookings/types";

import { BookingStatusBadge } from "./booking-status-badge";

/**
 * One booking list row. Shows only what an owner needs to recognize the
 * appointment at a glance — time, customer, service, technician, reference,
 * status — matching `ServiceRow`/`TechnicianRow`'s own restraint (created_at
 * is real data too, but answers no question this screen asks, so it is not
 * shown here).
 *
 * The row's main area is a real `<button>` rather than a click handler on the
 * `<li>`, so opening detail is keyboard-operable and has a real accessible
 * name — never a div-with-onClick. `timezone` is the tenant's own (passed by
 * the caller, since `TenantBooking` itself carries none — see
 * `formatBookingInstant`), never the viewer's device zone.
 */
export function BookingRow({
  booking,
  timezone,
  onOpenDetail,
}: {
  booking: TenantBooking;
  timezone: string | null;
  onOpenDetail: () => void;
}) {
  const { date, time } = formatBookingInstant(booking.start, timezone);
  const isCancelled = booking.status === "CANCELLED";

  return (
    <li className={`card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-5 ${isCancelled ? "opacity-70" : ""}`}>
      <button
        type="button"
        onClick={onOpenDetail}
        aria-label={`View booking details for ${booking.customer_name}, ${date} at ${time}`}
        className="flex min-w-0 flex-1 flex-col gap-2 rounded-lg text-left sm:flex-row sm:items-center sm:gap-4"
      >
        <div className="shrink-0 sm:w-32">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{time}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{date}</p>
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-50">
            {booking.customer_name}
          </p>
          <p className="truncate text-sm text-slate-600 dark:text-slate-400">
            {booking.service.name} · {booking.staff.name}
          </p>
        </div>

        <div className="shrink-0 sm:w-32">
          <p className="font-mono text-xs text-slate-500 dark:text-slate-400">{booking.reference}</p>
        </div>
      </button>

      <div className="shrink-0 sm:pl-2">
        <BookingStatusBadge status={booking.status} />
      </div>
    </li>
  );
}
