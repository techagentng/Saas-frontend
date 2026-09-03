/**
 * The booking progression indicator: Service → Technician → Time → Review.
 *
 * Derived entirely from where the customer is in the real flow — never a
 * fabricated status. Shown on the availability and review pages so the
 * customer can see the shape of what's left; the catalogue page (step 1)
 * doesn't need it.
 */
const STEPS = [
  { key: "service", label: "Service" },
  { key: "technician", label: "Technician" },
  { key: "time", label: "Time" },
  { key: "review", label: "Review" },
] as const;

export type BookingStep = (typeof STEPS)[number]["key"];

export function BookingProgress({ current }: { current: BookingStep }) {
  const currentIndex = STEPS.findIndex((step) => step.key === current);

  return (
    <ol
      aria-label="Booking progress"
      className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs font-medium"
    >
      {STEPS.map((step, index) => {
        const done = index < currentIndex;
        const isCurrent = index === currentIndex;
        return (
          <li key={step.key} className="flex items-center gap-1.5">
            <span
              aria-current={isCurrent ? "step" : undefined}
              className={
                isCurrent
                  ? "text-slate-900 dark:text-white"
                  : done
                    ? "text-slate-500 dark:text-slate-400"
                    : "text-slate-400 dark:text-slate-600"
              }
            >
              <span className="tabular-nums">{index + 1}</span>
              <span className="ml-1">{step.label}</span>
            </span>
            {index < STEPS.length - 1 && (
              <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                ›
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
