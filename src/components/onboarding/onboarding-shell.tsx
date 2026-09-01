"use client";

import { useEffect, useRef } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";

import { Logo } from "@/components/ui/Logo";
import { StepIndicator } from "@/components/onboarding/step-indicator";
import { businessTypeLabel } from "@/lib/tenant/business-type-labels";
import type { Tenant } from "@/types/tenant";

export type SaveStatus = "idle" | "saving" | "saved";

type OnboardingShellProps = {
  tenant: Tenant;
  /** Question heading — the single focus of the screen. */
  title: string;
  description: string;
  /** Zero-based position used only for the progress footer and step number. */
  stepIndex: number;
  stepTotal: number;
  /** Identity of the current screen; changing it re-runs the entry animation and moves focus. */
  screenKey: string;
  onBack: () => void;
  onContinue: () => void;
  /** Label for the primary action — "Continue" normally, "Finish setup" on the final screen. */
  continueLabel?: string;
  isFinalAction?: boolean;
  continueDisabled?: boolean;
  saveStatus: SaveStatus;
  error: string | null;
  children: ReactNode;
};

/**
 * One-question-at-a-time onboarding chrome, built entirely from the existing
 * design system (brand/slate tokens, .btn-primary, shadow/radius scale) so it
 * reads as the same product as the landing and auth pages.
 *
 * Structural only, mirroring DashboardShell's "no business-feature UI lives
 * here" charter: it owns header, question framing, progress, save/error state
 * and the Back/Continue actions, while the actual fields are composed in
 * through `children`. It is deliberately unaware of whether a screen maps to
 * a backend onboarding step or is a purely presentational substep — that
 * separation lives in the page.
 */
export function OnboardingShell({
  tenant,
  title,
  description,
  stepIndex,
  stepTotal,
  screenKey,
  onBack,
  onContinue,
  continueLabel = "Continue",
  isFinalAction = false,
  continueDisabled = false,
  saveStatus,
  error,
  children,
}: OnboardingShellProps) {
  const isSaving = saveStatus === "saving";
  const headingRef = useRef<HTMLHeadingElement>(null);
  const hasMounted = useRef(false);

  // Move focus to the new question when the screen changes, so keyboard and
  // screen-reader users land on the new content instead of a button that now
  // belongs to a previous question. Skipped on first mount so arriving at the
  // page doesn't yank focus away from where the browser put it.
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
    headingRef.current?.focus();
  }, [screenKey]);

  // Enter advances, matching the conversational-form convention. Ignored for
  // textarea (Enter means newline there), for select/button/anchor (Enter
  // already has native meaning), and whenever a modifier is held — so this
  // never fights normal typing or assistive technology.
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Enter" || isSaving || continueDisabled) return;
    if (event.shiftKey || event.metaKey || event.ctrlKey || event.altKey) return;

    const target = event.target as HTMLElement;
    const tag = target.tagName.toLowerCase();
    if (tag === "textarea" || tag === "select" || tag === "button" || tag === "a") return;

    event.preventDefault();
    onContinue();
  }

  return (
    <div className="flex min-h-full flex-1 flex-col" onKeyDown={handleKeyDown}>
      <header className="flex items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <Logo />
        <p aria-live="polite" className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {saveStatus === "saving" && "Saving…"}
          {saveStatus === "saved" && "Saved"}
        </p>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-8 sm:px-8 sm:py-12">
        <div key={screenKey} className="w-full max-w-2xl animate-fade-up">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-sm font-bold tabular-nums tracking-widest text-brand-600 dark:text-brand-400">
              {String(stepIndex + 1).padStart(2, "0")}
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {tenant.name} · {businessTypeLabel(tenant.business_type)}
            </span>
          </div>

          <h1
            ref={headingRef}
            tabIndex={-1}
            className="mt-5 text-3xl font-bold leading-tight tracking-tight text-slate-900 dark:text-white outline-none sm:text-4xl"
          >
            {title}
          </h1>
          <p className="mt-3 max-w-xl text-base text-slate-600 dark:text-slate-400">{description}</p>

          <div className="mt-8">{children}</div>

          {error && (
            <p
              role="alert"
              className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-700"
            >
              {error}
            </p>
          )}

          <div className="mt-10 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={onBack}
              disabled={isSaving}
              className="btn-secondary h-12 px-5 text-sm disabled:opacity-60"
            >
              Back
            </button>
            <button
              type="button"
              onClick={onContinue}
              disabled={isSaving || continueDisabled}
              className="btn-primary h-12 px-6 text-sm disabled:opacity-60 sm:min-w-44"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  {continueLabel}
                  {isFinalAction ? <Check className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                </>
              )}
            </button>
            <p className="hidden text-xs text-slate-400 dark:text-slate-500 sm:ml-1 sm:block">
              Press Enter <kbd className="font-sans">↵</kbd>
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-950/60 px-5 py-4 backdrop-blur sm:px-8">
        <div className="mx-auto max-w-2xl">
          <StepIndicator currentIndex={stepIndex} total={stepTotal} />
        </div>
      </footer>
    </div>
  );
}
