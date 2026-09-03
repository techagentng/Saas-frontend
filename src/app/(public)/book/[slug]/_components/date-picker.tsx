"use client";

import { useId } from "react";

import { todayLocalISODate } from "./date";

/**
 * Step 3 — choose a date (Scheduling S9).
 *
 * A native `<input type="date">`: mobile-friendly, keyboard-native, no
 * calendar dependency, and it submits a plain `YYYY-MM-DD` civil date. `min`
 * is the visitor's local today — a soft guard against obviously-past
 * selection; the backend re-validates against the tenant's own timezone and
 * returns an empty slot list for a past date regardless. The frontend never
 * computes a timezone offset for the availability request.
 */
export function DatePicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (date: string) => void;
}) {
  const id = useId();
  const min = todayLocalISODate();

  return (
    <section aria-labelledby="date-heading" className="space-y-4">
      <h2
        id="date-heading"
        className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white"
      >
        Choose a date
      </h2>
      <label htmlFor={id} className="block text-sm font-medium text-slate-600 dark:text-slate-400">
        Appointment date
        <input
          id={id}
          type="date"
          min={min}
          value={value ?? ""}
          onChange={(event) => {
            const next = event.target.value;
            if (next && next >= min) onChange(next);
          }}
          className="mt-1.5 block w-full max-w-xs rounded-2xl border border-[#E0D0C5] bg-white/80 px-4 py-3 text-sm text-slate-900 transition-colors focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:border-slate-800 dark:bg-slate-900/60 dark:text-white"
        />
      </label>
    </section>
  );
}
