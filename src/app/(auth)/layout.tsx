import Link from "next/link";
import type { ReactNode } from "react";

import { Logo } from "@/components/ui/Logo";

/**
 * Matches the marketing site's hero treatment (bg-dot-grid + brand radial
 * glow) rather than the dashboard shell's app chrome — this is the visitor's
 * first impression after leaving the landing page.
 *
 * Was light-only until dark mode became an explicit, user-chosen setting; the
 * gradient and dot grid now follow the theme so signing in does not throw a
 * white page at someone who chose dark on the landing page.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-full flex-1 flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-slate-50 via-white to-white dark:from-slate-900 dark:via-slate-950 dark:to-slate-950 px-4 py-12">
      <div className="absolute inset-0 -z-10 bg-dot-grid opacity-60" />
      <div
        className="absolute left-1/2 top-0 -z-10 h-[420px] w-[820px] -translate-x-1/2 rounded-full opacity-50 blur-3xl"
        style={{ background: "radial-gradient(ellipse at center, rgb(99 102 241 / 0.18), transparent 70%)" }}
      />

      <Link href="/" className="mb-8 flex items-center" aria-label="BookFlow home">
        <Logo />
      </Link>

      <div className="flex w-full flex-col items-center">{children}</div>

      <p className="mt-8 text-center text-xs text-slate-400 dark:text-slate-500">
        © {new Date().getFullYear()} BookFlow. All rights reserved.
      </p>
    </div>
  );
}
