"use client";

import { useState } from "react";

import { useBookingPageHref } from "@/lib/tenant/use-booking-page-href";
import { useVerticalExperience } from "@/lib/vertical/use-vertical-experience";
import { useTenant } from "@/providers/tenant-provider";

/**
 * A small owner-facing surface for the public booking page (Scheduling S8).
 *
 * Rendered only where it genuinely applies: inside the appointment dashboard,
 * which is nail-only today (`vertical.capabilities.appointmentDashboard`). An
 * unsupported vertical has no public appointment URL to advertise yet, so
 * this returns null for it — the guard is defensive; the parent already only
 * mounts this component for a nail tenant.
 *
 * The link is built from `NEXT_PUBLIC_APP_URL` via `getBookingUrl`, never from
 * `window.location` — an owner copying this to send to customers must always
 * get the production domain even when previewing from a Render URL.
 */
export function BookingLinkCard() {
  const { currentTenant } = useTenant();
  const vertical = useVerticalExperience();
  const { absolute: bookingUrl, href: openHref } = useBookingPageHref();
  const [copied, setCopied] = useState(false);

  if (!vertical.capabilities.appointmentDashboard || !currentTenant?.slug || !openHref) {
    return null;
  }

  async function copy() {
    if (!bookingUrl) return;
    try {
      await navigator.clipboard.writeText(bookingUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (insecure context, permissions). Leave the URL
      // visible on screen so it can still be selected and copied by hand.
      setCopied(false);
    }
  }

  return (
    <section className="card p-5 sm:p-6">
      <h2 className="text-base font-semibold text-slate-900 dark:text-white">Your booking page</h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Share this link with customers so they can book online.
      </p>

      <p className="mt-3 truncate rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
        {bookingUrl ?? openHref}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {bookingUrl && (
          <button
            type="button"
            onClick={copy}
            className="btn-secondary h-9 px-3.5 text-sm"
          >
            Copy link
          </button>
        )}
        <a
          href={openHref}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary h-9 px-3.5 text-sm no-underline"
        >
          Open booking page
        </a>
        <span role="status" aria-live="polite" className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
          {copied ? "Copied" : ""}
        </span>
      </div>
    </section>
  );
}
