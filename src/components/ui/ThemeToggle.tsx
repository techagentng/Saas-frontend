"use client";

import { useLayoutEffect } from "react";
import { Moon, Sun } from "lucide-react";

import { cn } from "@/lib/utils";
import { DEFAULT_THEME, THEME_STORAGE_KEY, isTheme, type Theme } from "@/lib/theme";

function storedTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(saved) ? saved : DEFAULT_THEME;
  } catch {
    // localStorage can throw outright, not just return null (Safari private
    // mode, storage blocked by policy). Falling back keeps the toggle working
    // for the session even when the choice cannot be persisted.
    return DEFAULT_THEME;
  }
}

function activeTheme(): Theme {
  const attr = document.documentElement.getAttribute("data-theme");
  return isTheme(attr) ? attr : DEFAULT_THEME;
}

/**
 * Switches `data-theme` on <html>, which is what every `dark:` utility keys
 * off (see the @custom-variant in globals.css).
 *
 * Deliberately holds no React state. The two icons are shown and hidden by
 * the same `dark:` variant as the rest of the app, so the button renders
 * correctly straight from the server HTML — no mounted-flag, no placeholder
 * frame, and no hydration mismatch to suppress. Several instances of this
 * button on one page stay in sync automatically, since they all read the one
 * attribute rather than separate copies of a state value.
 */
export function ThemeToggle({ className }: { className?: string }) {
  // The inline script in the root layout already applied the saved theme
  // during parsing, which is all production needs. In development React's
  // Strict Mode remounts once and resets <html> to the attributes it manages
  // from JSX, wiping that one — so re-apply it before paint. No-op in prod.
  // See next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md.
  useLayoutEffect(() => {
    document.documentElement.setAttribute("data-theme", storedTheme());
  }, []);

  function toggle() {
    const next: Theme = activeTheme() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Choice applies for this page view but will not survive a reload.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition-colors",
        "hover:bg-slate-100 hover:text-slate-900",
        "dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100",
        className
      )}
    >
      <Sun className="hidden h-[18px] w-[18px] dark:block" aria-hidden="true" />
      <Moon className="h-[18px] w-[18px] dark:hidden" aria-hidden="true" />
    </button>
  );
}
