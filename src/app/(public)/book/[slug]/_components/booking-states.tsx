import Link from "next/link";

/**
 * The non-catalogue states of the public booking experience.
 *
 * The terminal states (`BookingNotFound`, `UnsupportedVertical`,
 * `BookingErrorState`) render their own single <h1> inside
 * `PublicBookingTerminal`. The in-flow states (`CatalogSkeleton`,
 * `EmptyCatalog`, `InlineRetry`, `InlineLoading`) sit inside the booking
 * column of `PublicBookingLayout`.
 *
 * Copy is written for a customer — never "archived / disabled / onboarding".
 */

/** Skeleton while the tenant identity is still loading, shaped like the catalogue. */
export function BookingSkeleton() {
  return (
    <div aria-hidden="true" className="animate-pulse space-y-8">
      <div className="space-y-3">
        <div className="h-3 w-28 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-9 w-2/3 rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-full max-w-md rounded bg-slate-200 dark:bg-slate-800" />
      </div>
      <div className="space-y-6 border-t border-[#E7DAD0] pt-6 dark:border-slate-800">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-start justify-between gap-6 border-b border-[#E7DAD0] pb-6 dark:border-slate-800">
            <div className="w-full space-y-2">
              <div className="h-5 w-1/2 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-3 w-4/5 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="h-9 w-20 shrink-0 rounded-full bg-slate-200 dark:bg-slate-800" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Skeleton for just the service stack, when the business header has loaded. */
export function CatalogSkeleton() {
  return (
    <div aria-hidden="true" className="animate-pulse space-y-6 border-t border-[#E7DAD0] pt-6 dark:border-slate-800">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-start justify-between gap-6 border-b border-[#E7DAD0] pb-6 dark:border-slate-800">
          <div className="w-full space-y-2">
            <div className="h-5 w-1/2 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-3 w-4/5 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-800" />
          </div>
          <div className="h-9 w-20 shrink-0 rounded-full bg-slate-200 dark:bg-slate-800" />
        </div>
      ))}
    </div>
  );
}

/** Slug does not resolve to a publicly visible business. Intentionally vague. */
export function BookingNotFound() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
        This booking page isn&apos;t available
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        The link may be mistyped, or this business isn&apos;t taking online bookings right now.
      </p>
    </>
  );
}

/**
 * The tenant resolves but its `business_type` is not one online booking
 * supports yet. Never shows service rows or appointment UI.
 */
export function UnsupportedVertical({ businessName }: { businessName: string }) {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
        {businessName}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        Online booking for this business type isn&apos;t available yet.
      </p>
    </>
  );
}

/** A load failure that is not "not found" — offer a retry, keep it calm. */
export function BookingErrorState({
  onRetry,
  title = "Something went wrong",
  message = "We couldn't load this booking page. Please try again.",
}: {
  onRetry: () => void;
  title?: string;
  message?: string;
}) {
  return (
    <div role="alert">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-slate-900 px-6 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
      >
        Try again
      </button>
    </div>
  );
}

/** A NAIL_TECHNICIAN tenant with no ACTIVE services — a normal, deliberate state. */
export function EmptyCatalog() {
  return (
    <div className="rounded-2xl border border-dashed border-[#D9C6BA] bg-white/60 px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-900/40">
      <p className="text-[15px] font-medium text-slate-800 dark:text-slate-200">
        No services are available for online booking yet.
      </p>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
        Check back soon — this page will fill in as the salon publishes its menu.
      </p>
    </div>
  );
}

/**
 * A compact retryable-error row for a single section (technician list, slot
 * grid) — no page-level <h1>, so it can sit inside the flow.
 */
export function InlineRetry({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-sm dark:border-rose-900/50 dark:bg-rose-950/40"
    >
      <p className="text-rose-700 dark:text-rose-300">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex h-9 items-center rounded-full border border-rose-300 px-4 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-100 dark:border-rose-800 dark:text-rose-200 dark:hover:bg-rose-950"
      >
        Try again
      </button>
    </div>
  );
}

/** A quiet inline "loading…" line for a section that loads after the page shell. */
export function InlineLoading({ label }: { label: string }) {
  return (
    <p role="status" aria-live="polite" className="text-sm text-slate-500 dark:text-slate-400">
      {label}
    </p>
  );
}

/** Shared "back to services" affordance for the later steps. */
export function BackToServicesLink({ slug }: { slug: string }) {
  return (
    <Link
      href={`/book/${slug}`}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline dark:text-slate-400 dark:hover:text-white"
    >
      <span aria-hidden="true">&larr;</span> Back to services
    </Link>
  );
}
