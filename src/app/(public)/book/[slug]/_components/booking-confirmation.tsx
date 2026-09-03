"use client";

import { useEffect, useRef } from "react";

import type { PublicBookingConfirmation } from "@/modules/public-booking/types";

import { BookingSummary } from "./booking-summary";
import { formatCivilDate } from "./date";

/**
 * Shown ONLY after the backend has returned a persisted booking (`201`).
 * Never rendered optimistically.
 *
 * Uses only real response fields. The reference (`NB-…`) is made prominent for
 * the customer to quote; the internal booking `id` is not surfaced. On mount,
 * focus moves to the heading and the region announces itself so a screen
 * reader user hears the outcome.
 */
export function BookingConfirmation({
  booking,
  businessName,
  priceMinor,
  currency,
  durationMinutes,
}: {
  booking: PublicBookingConfirmation;
  businessName: string;
  /** From the selected service DTO — the response has no price. */
  priceMinor: number;
  currency: string | null;
  durationMinutes: number;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="space-y-8">
      <div role="status" aria-live="polite" className="space-y-4">
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
          <span aria-hidden="true">✓</span> {booking.status === "CONFIRMED" ? "Confirmed" : booking.status}
        </span>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-3xl font-semibold tracking-tight text-slate-900 outline-none sm:text-[2rem] dark:text-white"
        >
          Booking confirmed
        </h1>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          You&apos;re booked in with {businessName} for {formatCivilDate(booking.date)} at{" "}
          {booking.start}.
        </p>
      </div>

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 dark:border-emerald-900/50 dark:bg-emerald-950/30">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-400">
          Reference
        </p>
        <p className="mt-1 font-mono text-2xl font-semibold tracking-tight text-emerald-900 dark:text-emerald-200">
          {booking.reference}
        </p>
        <p className="mt-2 text-xs text-emerald-800/80 dark:text-emerald-300/80">
          Quote this if you need to contact the salon about your appointment.
        </p>
      </div>

      <BookingSummary
        data={{
          businessName,
          serviceName: booking.service.name,
          durationMinutes,
          technicianName: booking.staff.name,
          date: booking.date,
          start: booking.start,
          end: booking.end,
          priceMinor,
          currency,
          extraRows: [{ label: "Timezone", value: booking.timezone }],
        }}
      />

      <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-500">
        Keep this page open to keep your reference handy — it isn&apos;t emailed and can&apos;t be
        reloaded once you leave.
      </p>
    </div>
  );
}
