import type { ReactNode } from "react";

import { ProtectedRoute } from "@/components/auth/protected-route";

/**
 * Same hero treatment as the (auth) group — dot grid plus a soft brand glow,
 * both theme-aware — so signing up, signing in, and setting up a workspace
 * read as one continuous product rather than three different apps. Wider than the auth
 * card because onboarding is a focused, one-question-at-a-time flow rather
 * than a compact form.
 */
export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="relative flex min-h-full flex-1 flex-col overflow-hidden bg-gradient-to-b from-slate-50 via-white to-white dark:from-slate-900 dark:via-slate-950 dark:to-slate-950">
        <div className="absolute inset-0 -z-10 bg-dot-grid opacity-60" />
        <div
          className="absolute left-1/2 top-0 -z-10 h-[420px] w-[820px] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(ellipse at center, rgb(99 102 241 / 0.16), transparent 70%)" }}
        />
        {children}
      </div>
    </ProtectedRoute>
  );
}
