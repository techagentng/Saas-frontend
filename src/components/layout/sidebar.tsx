"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { dashboardNavItems, filterNavItems } from "@/lib/navigation/dashboard-nav";
import { usePermissions } from "@/providers/permissions-provider";
import { useTenant } from "@/providers/tenant-provider";

export function Sidebar() {
  const pathname = usePathname();
  const permissions = usePermissions();
  const { currentTenant } = useTenant();

  const items = filterNavItems(dashboardNavItems, {
    permissions,
    businessType: currentTenant?.business_type,
  });

  // Longest-prefix wins, so /dashboard/services highlights "Services" alone.
  // A plain `startsWith` per item lit up "Dashboard" as well, since every
  // dashboard route is nested under its href — invisible while "Dashboard"
  // was the only entry, wrong the moment a second one exists.
  const activeHref = items
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .reduce<string | null>(
      (longest, item) => (longest === null || item.href.length > longest.length ? item.href : longest),
      null
    );

  return (
    <nav aria-label="Primary">
      <ul className="flex flex-col gap-1">
        {items.map((item) => {
          const isActive = item.href === activeHref;
          const Icon = item.icon;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-black"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
