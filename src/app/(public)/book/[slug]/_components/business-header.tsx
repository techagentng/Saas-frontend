import type { PublicTenant } from "@/modules/public-booking/types";

/**
 * The business identity at the top of the booking column.
 *
 * Renders only fields the public tenant endpoint returns — name and, when
 * present, description. There are no backend branding fields (logo, colours)
 * yet, so none are invented; the editorial panel (`BookingVisualPanel`)
 * provides the visual warmth from product-owned assets.
 */
export function BusinessHeader({ tenant }: { tenant: PublicTenant }) {
  return (
    <header className="space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
        Online booking
      </p>
      <h1 className="text-3xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-4xl dark:text-white">
        {tenant.name}
      </h1>
      {tenant.description && (
        <p className="max-w-prose text-[15px] leading-relaxed text-slate-600 dark:text-slate-300">
          {tenant.description}
        </p>
      )}
    </header>
  );
}
