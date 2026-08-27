import type { ReactNode } from "react";

/**
 * Dashboard-side counterpart to `components/onboarding/field.tsx` — same
 * structure, same radius, same focus ring, in the zinc palette the dashboard
 * shell already uses (the onboarding surface is light-only slate; the shell
 * carries dark variants). Deliberately one shared field rather than a second
 * design system: nothing here introduces a new control, spacing scale, or
 * button treatment, and the `.btn-primary`/`.btn-secondary` component classes
 * in globals.css remain the only button styles in the app.
 */
export const fieldInputClass =
  "w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors hover:border-zinc-300 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-600/40 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-600";

type FieldProps = {
  id: string;
  label: string;
  hint?: ReactNode;
  /** Rendered next to the label so an optional field is never mistaken for a required one. */
  optional?: boolean;
  /** Validation message. Wired to the control via `aria-describedby` by the caller. */
  error?: string | null;
  children: ReactNode;
};

export function Field({ id, label, hint, optional, error, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </label>
        {optional && <span className="text-xs text-zinc-400 dark:text-zinc-600">Optional</span>}
      </div>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-zinc-500 dark:text-zinc-400">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-xs font-medium text-rose-600 dark:text-rose-400">
          {error}
        </p>
      )}
    </div>
  );
}
