"use client";

import { isApiError } from "@/lib/api/errors";
import { usePublicServiceCatalog, usePublicTenant } from "@/modules/public-booking/queries";
import type { PublicService } from "@/modules/public-booking/types";

import { BusinessHeader } from "./business-header";
import {
  BookingErrorState,
  BookingNotFound,
  BookingSkeleton,
  CatalogSkeleton,
  EmptyCatalog,
  InlineRetry,
  UnsupportedVertical,
} from "./booking-states";
import { PublicBookingLayout, PublicBookingTerminal } from "./public-booking-layout";
import { ServiceCatalogue } from "./service-catalogue";

/**
 * The public nail-business booking catalogue (Scheduling S8) — step 1 of the
 * customer journey, redesigned as a premium storefront:
 *
 *   PublicBookingLayout   — 60/40 split, editorial panel on the right
 *   BusinessHeader        — real name + description
 *   ServiceCatalogue      — category tabs + elegant service rows
 *
 * All backend integration is unchanged: same `usePublicTenant` /
 * `usePublicServiceCatalog` hooks, same `business_type` vertical guard (never
 * inferred from a 404), same null-safe currency, same anonymous access, and
 * selecting a service is still a plain link into the existing S9 flow.
 */
export function BookingExperience({ slug }: { slug: string }) {
  const tenantQuery = usePublicTenant(slug);
  const tenant = tenantQuery.data;
  const isNailTenant = tenant?.business_type === "NAIL_TECHNICIAN";

  // Only fires once the identity endpoint has confirmed the nail vertical.
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
        {isNotFound(tenantQuery.error) ? (
          <BookingNotFound />
        ) : (
          <BookingErrorState onRetry={() => tenantQuery.refetch()} />
        )}
      </PublicBookingTerminal>
    );
  }

  if (tenant.business_type !== "NAIL_TECHNICIAN") {
    // Driven by business_type, never by a catalogue 404.
    return (
      <PublicBookingTerminal>
        <UnsupportedVertical businessName={tenant.name} />
      </PublicBookingTerminal>
    );
  }

  return (
    <PublicBookingLayout tenant={tenant}>
      <div className="space-y-9">
        <BusinessHeader tenant={tenant} />

        <section aria-labelledby="choose-a-service-heading" className="space-y-5">
          <div className="space-y-1.5">
            <h2
              id="choose-a-service-heading"
              className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white"
            >
              Choose a service
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Select a service to begin. You&apos;ll pick your date and time next.
            </p>
          </div>

          <CatalogSection
            slug={slug}
            isPending={catalogQuery.isPending}
            isError={catalogQuery.isError}
            onRetry={() => catalogQuery.refetch()}
            services={catalogQuery.data?.services ?? []}
            currency={catalogQuery.data?.currency ?? null}
          />
        </section>
      </div>
    </PublicBookingLayout>
  );
}

function CatalogSection({
  slug,
  isPending,
  isError,
  onRetry,
  services,
  currency,
}: {
  slug: string;
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
  services: PublicService[];
  currency: string | null;
}) {
  if (isPending) return <CatalogSkeleton />;

  if (isError) {
    return (
      <InlineRetry
        message="We couldn't load the services. The rest of the page is fine — please try again."
        onRetry={onRetry}
      />
    );
  }

  if (services.length === 0) return <EmptyCatalog />;

  return <ServiceCatalogue slug={slug} services={services} currency={currency} />;
}

/** A slug that does not resolve to a publicly visible tenant, in any of its guises. */
function isNotFound(error: unknown): boolean {
  if (!isApiError(error)) return false;
  return (
    error.status === 404 ||
    error.code === "TENANT_NOT_FOUND" ||
    error.code === "TENANT_SLUG_INVALID"
  );
}
