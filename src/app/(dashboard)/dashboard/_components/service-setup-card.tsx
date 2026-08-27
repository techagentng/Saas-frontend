"use client";

import Link from "next/link";

import { isSchedulingBusinessType } from "@/lib/tenant/scheduling";
import { useServices } from "@/modules/services/queries";
import { useCan } from "@/providers/permissions-provider";
import { useTenant } from "@/providers/tenant-provider";

/**
 * The post-onboarding next step: onboarding ends at /dashboard, and until now
 * nothing there pointed at the configuration the owner still has to do.
 *
 * Deliberately the smallest change that makes the catalog discoverable — one
 * card, no metrics, no completion checklist, no vertical dashboard. The
 * broader Business Owner Dashboard Foundation (onboarding plan F7) remains a
 * separate, unstarted feature.
 *
 * Renders nothing at all unless every condition holds: a resolved workspace,
 * a business type that uses the scheduling model, and `service.read` from the
 * backend's own effective-permissions response. A CTA the user cannot act on
 * is worse than no CTA, so the `service.create` case is distinguished too —
 * someone with read-only access is offered "View services", never "Add your
 * services".
 */
export function ServiceSetupCard() {
  const { currentTenant } = useTenant();
  const canReadServices = useCan("service.read");
  const canCreateServices = useCan("service.create");

  const isEligible =
    currentTenant !== null &&
    isSchedulingBusinessType(currentTenant.business_type) &&
    canReadServices;

  // Same tenant-scoped key the Services page uses, so arriving there is a
  // cache hit rather than a second fetch of the same catalog.
  const servicesQuery = useServices(isEligible ? currentTenant.id : undefined, "ALL");

  if (!isEligible) return null;

  // Nothing is claimed about the catalog until it is actually known. Showing
  // "Add your services" to a workspace that already has some would be wrong,
  // and guessing while the query is in flight is how that happens.
  if (!servicesQuery.isSuccess) return null;

  const activeCount = servicesQuery.data.filter((service) => service.status === "ACTIVE").length;
  const hasServices = activeCount > 0;

  if (hasServices) {
    return (
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Services</h2>
            <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">
              {activeCount} {activeCount === 1 ? "service" : "services"} customers will be able to
              book.
            </p>
          </div>
          <Link
            href="/dashboard/services"
            className="btn-secondary h-10 shrink-0 px-4 text-sm no-underline"
          >
            Manage services
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-xs font-medium uppercase tracking-wider text-brand-600 dark:text-brand-400">
        Next step
      </p>
      <h2 className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        {canCreateServices ? "Add your services" : "No services yet"}
      </h2>
      <p className="mt-1 max-w-prose text-sm text-zinc-600 dark:text-zinc-400">
        {canCreateServices
          ? "Create the treatments and services customers will be able to book."
          : "This workspace hasn't added any bookable services yet."}
      </p>
      <Link
        href="/dashboard/services"
        className="btn-primary mt-4 h-11 px-5 text-sm no-underline"
      >
        {canCreateServices ? "Set up services" : "View services"}
      </Link>
    </section>
  );
}
