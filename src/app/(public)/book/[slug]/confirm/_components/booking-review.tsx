"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { isApiError } from "@/lib/api/errors";
import {
  useCreatePublicBooking,
  usePublicServiceCatalog,
  usePublicServiceStaff,
  usePublicTenant,
} from "@/modules/public-booking/queries";

import { BookingConfirmation } from "../../_components/booking-confirmation";
import { BookingProgress } from "../../_components/booking-progress";
import { BookingSummary } from "../../_components/booking-summary";
import { BackToServicesLink, BookingNotFound, BookingSkeleton } from "../../_components/booking-states";
import { CustomerDetailsForm, type CustomerDetails } from "../../_components/customer-details-form";
import {
  PublicBookingLayout,
  PublicBookingTerminal,
} from "../../_components/public-booking-layout";

/**
 * The S10 booking-creation step: review → customer details → real submit →
 * persisted confirmation.
 *
 *   - selection (service/staff/date/start/end) comes from the URL, exactly as
 *     S9 left it — never customer PII
 *   - the summary and prices come from the already-cached public data
 *   - `useCreatePublicBooking` POSTs to `/api/v1/public/tenants/{slug}/bookings`
 *   - a `201` renders `<BookingConfirmation>` (and only then)
 *   - a `409 BOOKING_SLOT_UNAVAILABLE` invalidates availability and sends the
 *     customer back to slot selection with service/staff/date intact
 *
 * Anonymous throughout. No dashboard context.
 */
export function BookingReview({ slug }: { slug: string }) {
  const params = useSearchParams();
  const router = useRouter();

  const serviceId = params.get("service_id");
  const staffId = params.get("staff_id");
  const date = params.get("date");
  const start = params.get("start");
  const end = params.get("end");

  const tenantQuery = usePublicTenant(slug);
  const tenant = tenantQuery.data;
  const isNailTenant = tenant?.business_type === "NAIL_TECHNICIAN";
  const catalogQuery = usePublicServiceCatalog(slug, isNailTenant);
  const staffQuery = usePublicServiceStaff(slug, isNailTenant ? serviceId : null);

  const mutation = useCreatePublicBooking(slug);

  if (tenantQuery.isPending || (isNailTenant && (catalogQuery.isPending || staffQuery.isPending))) {
    return (
      <PublicBookingLayout tenant={tenant ?? null}>
        <BookingSkeleton />
      </PublicBookingLayout>
    );
  }

  if (tenantQuery.isError || !tenant || isPublicNotFound(tenantQuery.error)) {
    return (
      <PublicBookingTerminal>
        <BookingNotFound />
      </PublicBookingTerminal>
    );
  }

  const service = isNailTenant
    ? (catalogQuery.data?.services.find((s) => s.id === serviceId) ?? null)
    : null;
  const technician = isNailTenant
    ? (staffQuery.data?.staff.find((s) => s.id === staffId) ?? null)
    : null;
  const currency = catalogQuery.data?.currency ?? null;

  if (!service || !technician || !date || !start || !end) {
    return (
      <PublicBookingTerminal>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Something&apos;s missing from your booking
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          Start again and pick a service, technician and time.
        </p>
        <p className="mt-6">
          <BackToServicesLink slug={slug} />
        </p>
      </PublicBookingTerminal>
    );
  }

  // Only after the backend has persisted the booking.
  if (mutation.isSuccess) {
    return (
      <PublicBookingLayout tenant={tenant}>
        <BookingConfirmation
          booking={mutation.data.booking}
          businessName={tenant.name}
          priceMinor={service.price_minor}
          currency={currency}
          durationMinutes={service.duration_minutes}
        />
      </PublicBookingLayout>
    );
  }

  // A 409 has already invalidated availability (in the hook) and we're about to
  // route back to slot selection — show a calm hand-off, not the form flashing.
  const isConflict =
    mutation.isError && isApiError(mutation.error) && mutation.error.code === "BOOKING_SLOT_UNAVAILABLE";
  if (isConflict) {
    return (
      <PublicBookingLayout tenant={tenant}>
        <p role="status" className="text-sm text-slate-600 dark:text-slate-400">
          That time is no longer available. Taking you back to choose another…
        </p>
      </PublicBookingLayout>
    );
  }

  function handleSubmit(customer: CustomerDetails) {
    mutation.mutate(
      { service_id: serviceId!, staff_id: staffId!, date: date!, start: start!, customer },
      {
        onError: (error) => {
          if (isApiError(error) && error.code === "BOOKING_SLOT_UNAVAILABLE") {
            router.replace(
              `/book/${slug}/availability?${new URLSearchParams({
                service_id: serviceId!,
                staff_id: staffId!,
                date: date!,
                unavailable: "1",
              }).toString()}`
            );
          }
        },
      }
    );
  }

  const changeTimeHref = `/book/${slug}/availability?${new URLSearchParams({
    service_id: service.id,
    staff_id: technician.id,
    date,
  }).toString()}`;

  return (
    <PublicBookingLayout tenant={tenant}>
      <div className="space-y-8">
        <header className="space-y-4">
          <BookingProgress current="review" />
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-[2rem] dark:text-white">
            Almost done
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Check your appointment and add your details. Your time isn&apos;t reserved until you book.
          </p>
        </header>

        <BookingSummary
          data={{
            businessName: tenant.name,
            serviceName: service.name,
            durationMinutes: service.duration_minutes,
            technicianName: technician.name,
            date,
            start,
            end,
            priceMinor: service.price_minor,
            currency,
          }}
        />

        <div className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
            Your details
          </h2>
          <CustomerDetailsForm
            onSubmit={handleSubmit}
            isPending={mutation.isPending}
            serverError={serverErrorMessage(mutation.error)}
          />
        </div>

        <Link
          href={changeTimeHref}
          className="inline-flex text-sm font-medium text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline dark:text-slate-400 dark:hover:text-white"
        >
          Change time
        </Link>
      </div>
    </PublicBookingLayout>
  );
}

/** Customer-safe wording for a booking failure that is not field-level. Never the raw backend body. */
function serverErrorMessage(error: unknown): string | null {
  if (!error) return null;
  if (isApiError(error)) {
    switch (error.code) {
      case "BOOKING_SLOT_UNAVAILABLE":
        return null; // handled by navigation
      case "VALIDATION_FAILED":
        return "Please check your details and try again.";
      case "SERVICE_NOT_FOUND":
      case "STAFF_NOT_FOUND":
      case "RESOURCE_NOT_FOUND":
        return "This service is no longer available for online booking. Please start again.";
      case "TENANT_NOT_FOUND":
      case "TENANT_SLUG_INVALID":
        return "This booking page is no longer available.";
      default:
        return "We couldn't complete your booking. Please try again.";
    }
  }
  return "We couldn't complete your booking. Please try again.";
}

function isPublicNotFound(error: unknown): boolean {
  if (!isApiError(error)) return false;
  return (
    error.status === 404 ||
    error.code === "TENANT_NOT_FOUND" ||
    error.code === "TENANT_SLUG_INVALID"
  );
}
