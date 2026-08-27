import type { ReactNode } from "react";

/**
 * Dashboard-side field wrapper. The input styling itself is not defined here —
 * it delegates to the `.input-base` component class in globals.css, so there is
 * exactly one definition of what an input looks like and dark mode only has to
 * be right in one place. Callers still append layout utilities
 * (`${fieldInputClass} w-28`); utilities sort after the components layer, so
 * they win over `.input-base`'s own width/radius.
 */
export const fieldInputClass = "input-base";

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
        <label htmlFor={id} className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
        {optional && <span className="text-xs text-slate-400 dark:text-slate-600">Optional</span>}
      </div>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-slate-500 dark:text-slate-400">
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
