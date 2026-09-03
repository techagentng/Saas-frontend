"use client";

import { apiErrorMessage } from "@/lib/api/error-messages";
import { usePublicAvailability } from "@/modules/public-booking/queries";
import type { PublicAvailabilitySlot } from "@/modules/public-booking/types";

import { InlineLoading, InlineRetry } from "./booking-states";

/**
 * Step 4 — choose a real slot (Scheduling S9).
 *
 * Every slot comes straight from the S7 engine via the public availability
 * endpoint. The frontend never regenerates slots, never infers extra ones
 * from the service duration, and never shows a slot the backend did not
 * return. An empty list for a resolved query is "no times on this date",
 * not an error.
 *
 * `usePublicAvailability` does not fire until service + technician + date are
 * all set, so the "no times" state can never flash before the request has
 * been made.
 */
export function SlotPicker({
  slug,
  serviceId,
  staffId,
  date,
  onSelect,
  slotWasTaken = false,
}: {
  slug: string;
  serviceId: string;
  staffId: string;
  date: string;
  onSelect: (slot: PublicAvailabilitySlot) => void;
  /** The S10 review step bounced back here because the chosen slot was booked first. */
  slotWasTaken?: boolean;
}) {
  const query = usePublicAvailability(slug, serviceId, staffId, date);
  const slots = query.data?.slots ?? [];

  return (
    <section aria-labelledby="slot-heading" className="space-y-4">
      <h2
        id="slot-heading"
        className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white"
      >
        Choose a time
      </h2>

      {slotWasTaken && (
        <p
          role="alert"
          className="rounded-2xl border border-amber-300 bg-amber-50/80 p-4 text-sm text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200"
        >
          That time is no longer available. Please choose another time.
        </p>
      )}

      {query.isPending && <InlineLoading label="Finding available times…" />}

      {query.isError && (
        <InlineRetry
          message={apiErrorMessage(query.error, {
            VALIDATION_FAILED: "We couldn't check times for that combination. Try a different date.",
          })}
          onRetry={() => query.refetch()}
        />
      )}

      {query.isSuccess && slots.length === 0 && (
        <p className="rounded-2xl border border-dashed border-[#D9C6BA] bg-white/60 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
          No times are available on this date. Try choosing another date.
        </p>
      )}

      {query.isSuccess && slots.length > 0 && (
        <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
          {slots.map((slot) => (
            <li key={slot.start}>
              <button
                type="button"
                onClick={() => onSelect(slot)}
                aria-label={`Book ${slot.start} to ${slot.end}`}
                className="w-full rounded-full border border-[#E0D0C5] bg-white/70 px-2 py-2.5 text-sm font-medium tabular-nums text-slate-800 transition-colors hover:border-slate-900 hover:bg-slate-900 hover:text-white dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-200 dark:hover:border-white dark:hover:bg-white dark:hover:text-slate-900"
              >
                {slot.start}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
