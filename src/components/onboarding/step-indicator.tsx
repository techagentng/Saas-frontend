type StepIndicatorProps = {
  /** Zero-based position within `total`. */
  currentIndex: number;
  total: number;
};

/**
 * Generic progress footer — takes a position, not a step list, so it serves
 * the presentation substeps today and any future vertical's longer step
 * sequence without change.
 *
 * Not a visual-only stepper: the same information is available as text
 * ("Step 2 of 4", "50%") and through aria-valuetext, so the bar itself is
 * decorative and hidden from assistive technology.
 */
export function StepIndicator({ currentIndex, total }: StepIndicatorProps) {
  const safeTotal = Math.max(total, 1);
  const position = Math.min(Math.max(currentIndex + 1, 1), safeTotal);
  const percent = Math.round((position / safeTotal) * 100);
  const label = `Step ${position} of ${safeTotal}`;

  return (
    <div className="flex items-center gap-4">
      <p className="shrink-0 text-xs font-medium text-slate-500">{label}</p>
      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={`${label}, ${percent}% complete`}
        className="h-1 flex-1 overflow-hidden rounded-full bg-slate-200"
      >
        <div
          className="h-full rounded-full bg-brand-600 transition-[width] duration-500 ease-out motion-reduce:transition-none"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="shrink-0 text-xs font-medium tabular-nums text-slate-500">{percent}%</p>
    </div>
  );
}
