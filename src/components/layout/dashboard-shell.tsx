"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";

import { MenuIcon } from "@/components/icons/menu-icon";
import { AccountMenu } from "@/components/layout/account-menu";
import { Sidebar } from "@/components/layout/sidebar";
import { TenantSelector } from "@/components/tenant/tenant-selector";

/**
 * Structural shell only: sidebar, header (tenant selector + account menu
 * locations), main content area, and a mobile off-canvas sidebar. No
 * business-feature UI lives here (see AGENTS.md Phase C non-goals).
 */
export function DashboardShell({ children }: { children: ReactNode }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Close the mobile drawer whenever navigation completes. Adjusted during
  // render (React's documented pattern for resetting state on a prop
  // change) rather than in an effect, which would cost an extra render.
  const [renderedPathname, setRenderedPathname] = useState(pathname);
  if (pathname !== renderedPathname) {
    setRenderedPathname(pathname);
    setIsMobileSidebarOpen(false);
  }

  return (
    <div className="flex min-h-full flex-1">
      <aside className="hidden w-64 shrink-0 border-r border-zinc-200 px-4 py-6 md:flex md:flex-col dark:border-zinc-800">
        <Sidebar />
      </aside>

      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <aside className="relative z-50 flex h-full w-64 flex-col border-r border-zinc-200 bg-white px-4 py-6 dark:border-zinc-800 dark:bg-black">
            <Sidebar />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-zinc-200 px-4 py-3 md:px-6 dark:border-zinc-800">
          <button
            type="button"
            aria-label="Open navigation"
            aria-expanded={isMobileSidebarOpen}
            onClick={() => setIsMobileSidebarOpen(true)}
            className="rounded-md p-2 text-zinc-600 hover:bg-zinc-100 md:hidden dark:text-zinc-400 dark:hover:bg-zinc-900"
          >
            <MenuIcon className="h-5 w-5" aria-hidden="true" />
          </button>

          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Booking SaaS</span>

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
