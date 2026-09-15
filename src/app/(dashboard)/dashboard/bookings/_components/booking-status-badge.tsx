import type { BookingStatus } from "@/modules/bookings/types";

const STATUS_LABELS: Record<BookingStatus, string> = {
  CONFIRMED: "Confirmed",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
  NO_SHOW: "No-show",
};

const STATUS_CLASSES: Record<BookingStatus, string> = {
  CONFIRMED:
    "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300",
  CANCELLED: "border-slate-300 text-slate-500 dark:border-slate-700 dark:text-slate-400",
  COMPLETED:
    "border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-300",
  // Amber, not rose: NO_SHOW is an outcome to note, not a destructive/error
  // state — the same reasoning that keeps CANCELLED itself neutral grey
  // rather than red.
  NO_SHOW:
    "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300",
};

/**
 * The four statuses `model.BookingStatus` allows (Scheduling S11 + S13-BE) —
 * never invent a fifth. Text-based, not colour-alone: the label itself always
 * says which status it is, and colour is a reinforcing cue only.
 */
export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
