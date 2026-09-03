"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import { isApiError } from "@/lib/api/errors";
import { formatDuration } from "@/lib/scheduling/duration";
import { usePublicServiceCatalog, usePublicTenant } from "@/modules/public-booking/queries";
import type { PublicAvailabilitySlot, PublicService } from "@/modules/public-booking/types";

import {
  BackToServicesLink,
  BookingErrorState,
  BookingNotFound,
  BookingSkeleton,
  CatalogSkeleton,
} from "./booking-states";
import { BookingProgress, type BookingStep } from "./booking-progress";
import { DatePicker } from "./date-picker";
import { formatServicePrice } from "./format";
import { PublicBookingLayout, PublicBookingTerminal } from "./public-booking-layout";
import { SlotPicker } from "./slot-picker";
import { TechnicianPicker } from "./technician-picker";

/**
 * The public availability flow (Scheduling S9): technician → date → real slot,
 * then hand off to the review shell.
 *
 * Redesign: the same premium two-column frame as the catalogue
 * (`PublicBookingLayout`) with a `BookingProgress` indicator, so the customer
 * stays inside one coherent experience. All flow logic is untouched — state
 * lives in the URL query string (`service_id`, `staff_id`, `date`), no
 * authentication, and every technician and slot comes from the real S9/S7
 * endpoints.
 */
export function AvailabilityFlow({ slug }: { slug: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const serviceId = params.get("service_id");
  const staffId = params.get("staff_id");
  const date = params.get("date");
  // Set by the S10 review step when the chosen slot was taken between viewing
  // and booking — show the conflict message and the freshly-refetched list.
  const slotWasTaken = params.get("unavailable") === "1";

  const setParams = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString());
      // Any change to the selection makes the "that slot was taken" notice
      // stale — clear it.
      next.delete("unavailable");
      for (const [key, value] of Object.entries(updates)) {
        if (value === null) next.delete(key);
        else next.set(key, value);
      }
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [params, pathname, router]
  );

  const goToConfirm = useCallback(
    (slot: PublicAvailabilitySlot) => {
      if (!serviceId || !staffId || !date) return;
      const query = new URLSearchParams({
        service_id: serviceId,
        staff_id: staffId,
        date,
        start: slot.start,
        end: slot.end,
      });
      router.push(`/book/${slug}/confirm?${query.toString()}`);
    },
    [router, slug, serviceId, staffId, date]
  );

  const tenantQuery = usePublicTenant(slug);
  const tenant = tenantQuery.data;
  const isNailTenant = tenant?.business_type === "NAIL_TECHNICIAN";
  const catalogQuery = usePublicServiceCatalog(slug, isNailTenant);

  if (tenantQuery.isPending) {
    return (
      <PublicBookingLayout tenant={null}>
        <BookingSkeleton />
      </PublicBookingLayout>
    );
  }

  if (tenantQuery.isError || !tenant) {
    return (
      <PublicBookingTerminal>
        {isPublicNotFound(tenantQuery.error) ? (
          <BookingNotFound />
        ) : (
          <BookingErrorState onRetry={() => tenantQuery.refetch()} />
        )}
      </PublicBookingTerminal>
    );
  }

  if (!isNailTenant) {
    return (
      <PublicBookingTerminal>
        <TerminalMessage
          slug={slug}
          heading="This booking page isn't available"
          message="Online booking isn't available for this business."
        />
      </PublicBookingTerminal>
    );
  }

  if (catalogQuery.isPending) {
    return (
      <PublicBookingLayout tenant={tenant}>
        <CatalogSkeleton />
      </PublicBookingLayout>
    );
  }

  if (catalogQuery.isError) {
    return (
      <PublicBookingTerminal>
        <BookingErrorState
          onRetry={() => catalogQuery.refetch()}
          title="We couldn't load this booking page"
        />
      </PublicBookingTerminal>
    );
  }

  const service = serviceId
    ? (catalogQuery.data?.services.find((s) => s.id === serviceId) ?? null)
    : null;

  if (!service) {
    return (
      <PublicBookingTerminal>
        <TerminalMessage
          slug={slug}
          heading="Choose a service to continue"
          message={
            serviceId
              ? "That service is no longer available. Pick another to continue."
              : "No service was selected yet."
          }
        />
      </PublicBookingTerminal>
    );
  }

  const step: BookingStep = staffId ? "time" : "technician";

  return (
    <PublicBookingLayout tenant={tenant}>
      <div className="space-y-8">
        <header className="space-y-4">
          <BookingProgress current={step} />
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-[2rem] dark:text-white">
            Book with {tenant.name}
          </h1>
        </header>

        <SelectedServiceSummary service={service} currency={catalogQuery.data?.currency ?? null} />

        <TechnicianPicker
          slug={slug}
          serviceId={service.id}
          selectedStaffId={staffId}
          // Changing technician invalidates the date's slot list, so drop it.
          onSelect={(id) => setParams({ staff_id: id, date: null })}
        />

        {staffId && <DatePicker value={date} onChange={(next) => setParams({ date: next })} />}

        {staffId && date && (
          <SlotPicker
            slug={slug}
            serviceId={service.id}
            staffId={staffId}
            date={date}
            slotWasTaken={slotWasTaken}
            onSelect={goToConfirm}
          />
        )}

        <BackToServicesLink slug={slug} />
      </div>
    </PublicBookingLayout>
  );
}

/** The chosen service, from public catalogue data — never a dashboard refetch. */
function SelectedServiceSummary({
  service,
  currency,
}: {
  service: PublicService;
  currency: string | null;
}) {
  const price = formatServicePrice(service.price_minor, currency);
  return (
    <section
      aria-labelledby="chosen-service-heading"
      className="rounded-2xl border border-[#E7DAD0] bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-900/50 sm:p-5"
    >
      <h2 id="chosen-service-heading" className="sr-only">
        Chosen service
      </h2>
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold tracking-tight text-slate-900 dark:text-white">{service.name}</p>
        <span
          aria-hidden="true"
          className="shrink-0 font-medium text-slate-900 dark:text-white"
        >
          {price.display}
        </span>
      </div>
      {service.description && (
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          {service.description}
        </p>
      )}
      <p className="mt-1.5 text-[13px] text-slate-500 dark:text-slate-400">
        {formatDuration(service.duration_minutes)}
        <span className="sr-only"> · {price.accessible}</span>
      </p>
    </section>
  );
}

function TerminalMessage({
  slug,
  heading,
  message,
}: {
  slug: string;
  heading: string;
  message: string;
}) {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
        {heading}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{message}</p>
      <p className="mt-6">
        <BackToServicesLink slug={slug} />
      </p>
    </>
  );
}

function isPublicNotFound(error: unknown): boolean {
  if (!isApiError(error)) return false;
  return (
    error.status === 404 ||
    error.code === "TENANT_NOT_FOUND" ||
    error.code === "TENANT_SLUG_INVALID"
  );
}
