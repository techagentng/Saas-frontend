"use client";

import Link from "next/link";
import { Plus, Scissors, Users, Clock, Contact, ExternalLink } from "lucide-react";
import type { ComponentType, SVGProps } from "react";

import { useBookingPageHref } from "@/lib/tenant/use-booking-page-href";
import { usePermissions } from "@/providers/permissions-provider";
import type { Permission } from "@/types/permission";

type QuickAction = {
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  primary?: boolean;
  /** Internal route (or absolute URL for `external`) this action opens. */
  href?: string;
  /** Opens in a new tab — the public booking page. */
  external?: boolean;
  /** Capability required; the action is hidden without it (backend still enforces). */
  permission?: Permission;
};

/**
 * Dashboard quick actions — every one now points at the real feature that
 * backs it. Actions whose feature does not exist yet (New booking, View
 * customers — Scheduling S11) render disabled with a "Soon" badge, matching
 * the sidebar's roadmap treatment, rather than a button that does nothing.
 *
 * "Add service" links into the existing Services page, where the currency
 * prerequisite and the real create form already live — a shortcut into that
 * flow, not a second one. It is shown only with `service.create`.
 */
export function QuickActions() {
  const permissions = usePermissions();
  const { href: bookingPageHref } = useBookingPageHref();

  const actions: QuickAction[] = [
    { label: "New booking", icon: Plus, primary: true },
    { label: "Add service", icon: Scissors, href: "/dashboard/services", permission: "service.create" },
    { label: "Add technician", icon: Users, href: "/dashboard/team", permission: "staff.create" },
    { label: "Working hours", icon: Clock, href: "/dashboard/team", permission: "staff.read" },
    { label: "View customers", icon: Contact },
    {
      label: "Open booking page",
      icon: ExternalLink,
      href: bookingPageHref ?? undefined,
      external: true,
    },
  ];

  const visible = actions.filter((a) => !a.permission || permissions.has(a.permission));

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {visible.map((action) => {
        const Icon = action.icon;
        const iconWrap = `flex h-8 w-8 items-center justify-center rounded-lg ${
          action.primary
            ? "bg-brand-600 text-white"
            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
        }`;

        if (action.href) {
          return (
            <Link
              key={action.label}
              href={action.href}
              {...(action.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="card card-hover flex flex-col items-start gap-2 p-4 text-left no-underline"
            >
              <span className={iconWrap} aria-hidden="true">
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {action.label}
              </span>
            </Link>
          );
        }

        return (
          <span
            key={action.label}
            aria-disabled="true"
            className="card flex cursor-not-allowed flex-col items-start gap-2 p-4 text-left opacity-60"
          >
            <span className={iconWrap} aria-hidden="true">
              <Icon className="h-4 w-4" />
            </span>
            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              {action.label}
              <span className="rounded-full border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-400 dark:border-slate-700 dark:text-slate-500">
                Soon
              </span>
            </span>
          </span>
        );
      })}
    </div>
  );
}
