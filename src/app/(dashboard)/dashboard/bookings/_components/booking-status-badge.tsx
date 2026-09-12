import type { BookingStatus } from "@/modules/bookings/types";

/**
 * The only two statuses this contract has (`model.BookingStatus`) — never
 * invent a third. Text-based, not colour-alone: the label itself says
 * CONFIRMED/CANCELLED, and the colour is a reinforcing cue only.
 */
export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const isCancelled = status === "CANCELLED";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
        isCancelled
          ? "border-slate-300 text-slate-500 dark:border-slate-700 dark:text-slate-400"
          : "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300"
      }`}
    >
      {status === "CONFIRMED" ? "Confirmed" : "Cancelled"}
    </span>
  );
}
