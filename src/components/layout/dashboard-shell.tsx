"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";

import { MenuIcon } from "@/components/icons/menu-icon";
import { AccountMenu } from "@/components/layout/account-menu";
import { Sidebar } from "@/components/layout/sidebar";
import { TenantSelector } from "@/components/tenant/tenant-selector";

/**
 * Structural shell only: sidebar, header (tenant selector + account menu),
 * main content area, and a mobile off-canvas sidebar.
 *
 * Palette note: this was built in zinc while the dashboard content is slate.
 * Two neutral ramps at slightly different hues read as a rendering fault
 * rather than a design choice, so the chrome now uses the same slate scale as
 * the cards it frames. Every surface here declares an explicit background —
 * a transparent panel over a dark body is how the sidebar ended up looking
 * like an empty column.
 */
export function DashboardShell({ children }: { children: ReactNode }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Close the mobile drawer whenever navigation completes. Adjusted during
  // render (React's documented pattern for resetting state on a prop change)
  // rather than in an effect, which would cost an extra render.
  const [renderedPathname, setRenderedPathname] = useState(pathname);
  if (pathname !== renderedPathname) {
    setRenderedPathname(pathname);
    setIsMobileSidebarOpen(false);
  }

  return (
    // `min-h-full flex-1`, not `min-h-screen`: the root layout already sets
    // html.h-full + body.min-h-full, so 100vh here would stack a second full
    // viewport onto that chain and introduce a stray scrollbar.
    <div className="flex min-h-full flex-1 bg-slate-50 dark:bg-slate-950">
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white px-4 py-6 md:flex md:flex-col dark:border-slate-800 dark:bg-slate-900">
        <Sidebar />
      </aside>

      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <aside className="relative z-50 flex h-full w-72 max-w-[85vw] flex-col border-r border-slate-200 bg-white px-4 py-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <Sidebar />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur md:px-6 dark:border-slate-800 dark:bg-slate-900/90">
          <button
            type="button"
            aria-label="Open navigation"
            aria-expanded={isMobileSidebarOpen}
            onClick={() => setIsMobileSidebarOpen(true)}
            className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 md:hidden dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <MenuIcon className="h-5 w-5" aria-hidden="true" />
          </button>

          <span className="text-sm font-semibold text-slate-900 md:hidden dark:text-white">
            BookFlow
          </span>

          <div className="ml-auto flex items-center gap-3">
            <TenantSelector />
            <AccountMenu />
          </div>
        </header>

        <main className="flex flex-1 flex-col px-4 py-6 md:px-6 md:py-8">{children}</main>
      </div>
    </div>
  );
}
