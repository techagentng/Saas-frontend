import type { ReactNode } from "react";

/** Shared input styling, matching the login/register fields so onboarding uses the same controls as the rest of the product. */
export const onboardingInputClass =
  "w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 px-4 py-3 text-base text-slate-900 dark:text-white placeholder:text-slate-400 transition-colors hover:border-slate-300 dark:hover:border-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-600/40 disabled:opacity-60";

type FieldProps = {
  id: string;
  label: string;
  hint?: string;
  /** Rendered next to the label so an optional field is never mistaken for a required one. */
  optional?: boolean;
  children: ReactNode;
};

export function Field({ id, label, hint, optional, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
        {optional && <span className="text-xs text-slate-400 dark:text-slate-500">Optional</span>}
      </div>
      {children}
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-slate-500 dark:text-slate-400">
          {hint}
        </p>
      )}
    </div>
  );
}

/** Read-only value display for fields that are immutable after creation (business type, public slug). */
export function ReadOnlyValue({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</p>
      <p className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 px-4 py-3 text-base text-slate-600 dark:text-slate-400">
        {value}
      </p>
      {hint && <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  );
}
