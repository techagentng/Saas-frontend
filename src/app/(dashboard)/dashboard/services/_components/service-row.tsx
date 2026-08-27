"use client";

import { formatMinorAsMajor, formatPrice } from "@/lib/money/money";
import { formatDuration } from "@/lib/scheduling/duration";
import type { Service } from "@/modules/services/types";

/**
 * One catalog entry.
 *
 * Shows only what an owner needs to recognize and price the service. The
 * backend also returns `created_at`/`updated_at`; they are not rendered
 * because they answer no question this screen asks, and `tenant_id` is not
 * returned at all.
 *
 * Archived state is carried by a text label and a dimmed row, never by colour
 * alone — the badge reads "Archived" whether or not colour is perceivable.
 */
export function ServiceRow({
  service,
  currency,
  onEdit,
  onArchive,
}: {
  service: Service;
  currency: string;
  /** Omitted when the user lacks `service.update` — the control is then absent, not disabled. */
  onEdit?: () => void;
  /** Omitted when the user lacks `service.archive`, or when the service is already archived. */
  onArchive?: () => void;
}) {
  const isArchived = service.status === "ARCHIVED";

  return (
    <li
      className={`flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 sm:flex-row sm:items-start sm:gap-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-950 ${
        isArchived ? "opacity-70" : ""
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{service.name}</h3>
          {isArchived && (
            <span className="rounded-full border border-zinc-300 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
              Archived
            </span>
          )}
        </div>

        {service.description && (
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{service.description}</p>
        )}

        <dl className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
          <div className="flex items-baseline gap-1.5">
            <dt className="sr-only">Duration</dt>
            <dd className="text-zinc-600 dark:text-zinc-400">
              {formatDuration(service.duration_minutes)}
            </dd>
          </div>
          <div className="flex items-baseline gap-1.5">
            <dt className="sr-only">Price</dt>
            <dd className="font-medium text-zinc-900 dark:text-zinc-100">
              {/* The symbol is decorative; screen readers get the amount with
                  its currency code spelled out instead. Adjacent visible text
                  and a visually-hidden suffix concatenate without a separator
                  in the accessible-name algorithm, so the two are kept as
                  whole alternatives rather than assembled from fragments. */}
              <span aria-hidden="true">{formatPrice(service.price_minor, currency)}</span>
              <span className="sr-only">
                {formatMinorAsMajor(service.price_minor)} {currency}
              </span>
            </dd>
          </div>
        </dl>
      </div>

      {(onEdit || onArchive) && (
        <div className="flex shrink-0 gap-2">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              // Named for the row it acts on: a column of identical "Edit"
              // buttons is unusable from a screen reader's element list.
              aria-label={`Edit ${service.name}`}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              Edit
            </button>
          )}
          {onArchive && (
            <button
              type="button"
              onClick={onArchive}
              aria-label={`Archive ${service.name}`}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-rose-900 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
            >
              Archive
            </button>
          )}
        </div>
      )}
    </li>
  );
}
