"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsUpDown } from "lucide-react";

import { Logo } from "@/components/ui/Logo";
import { dashboardNavItems, filterNavItems, upcomingNavItems } from "@/lib/navigation/dashboard-nav";
import { businessTypeLabel } from "@/lib/tenant/business-type-labels";
import { useVerticalExperience } from "@/lib/vertical/use-vertical-experience";
import { usePermissions } from "@/providers/permissions-provider";
import { useTenant } from "@/providers/tenant-provider";

export function Sidebar() {
  const pathname = usePathname();
  const permissions = usePermissions();
  const { currentTenant } = useTenant();
  const vertical = useVerticalExperience();

  const items = filterNavItems(dashboardNavItems, {
    permissions,
    businessType: currentTenant?.business_type,
  });

  // The nav config carries a static fallback label ("Team"); the visible
  // label for the staff roster follows the tenant's vertical
  // ("Technicians", "Drivers", or "Team"). The route itself never changes.
  const labelFor = (href: string, fallback: string) =>
    href === "/dashboard/team" ? vertical.team.plural : fallback;

  // Longest-prefix wins, so /dashboard/services highlights "Services" alone.
  // A plain `startsWith` per item lit up "Dashboard" as well, since every
  // dashboard route is nested under its href.
  const activeHref = items
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .reduce<string | null>(
      (longest, item) => (longest === null || item.href.length > longest.length ? item.href : longest),
      null
    );

  return (
    <div className="flex h-full flex-col bg-white dark:bg-ink-soft">
      {/* Logo Header */}
      <div className="flex h-16 shrink-0 items-center border-b border-slate-200 dark:border-slate-800 px-6">
        <Link href="/dashboard" aria-label="BookFlow home">
          <Logo />
        </Link>
      </div>

      {/* Navigation */}
      <nav aria-label="Primary" className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
        <div>
          <p className="px-3 pt-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Manage
          </p>
          <ul className="flex flex-col gap-1">
            {items.map((item) => {
              const isActive = item.href === activeHref;
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-brand-50 text-brand-700 dark:bg-brand-600/10 dark:text-brand-400"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {labelFor(item.href, item.label)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Coming Soon Section */}
        <div className="mt-6">
          <p className="px-3 pt-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Coming soon
          </p>
          <ul className="flex flex-col gap-1">
            {upcomingNavItems.map((item) => {
              const Icon = item.icon;

              return (
                <li key={item.label}>
                  <span
                    aria-disabled="true"
                    className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 dark:text-slate-600"
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {item.label}
                    <span className="ml-auto rounded-full border border-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 dark:border-slate-800 dark:text-slate-600">
                      Soon
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Tenant Selector Footer */}
      {currentTenant && (
        <div className="border-t border-slate-200 dark:border-slate-800 p-4">
          <div className="flex w-full items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-brand-500 to-violet-500 text-white text-xs font-bold">
              {currentTenant.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                {currentTenant.name}
              </p>
              <p className="truncate text-[10px] text-slate-500 dark:text-slate-400">
                {businessTypeLabel(currentTenant.business_type)}
              </p>
            </div>
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-slate-400" />
          </div>
        </div>
      )}
    </div>
  );
}