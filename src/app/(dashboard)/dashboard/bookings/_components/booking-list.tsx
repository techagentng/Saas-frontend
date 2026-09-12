"use client";

import { useState } from "react";

import { apiErrorMessage } from "@/lib/api/error-messages";
import { useVerticalExperience } from "@/lib/vertical/use-vertical-experience";
import { useBookings } from "@/modules/bookings/queries";
import type { BookingListFilter } from "@/modules/bookings/types";

import { BookingDetailDialog } from "./booking-detail-dialog";
import { BookingFilters } from "./booking-filters";
import { BookingRow } from "./booking-row";

const DEFAULT_FILTERS: BookingListFilter = {
  view: "UPCOMING",
  staffId: null,
  serviceId: null,
  date: null,
};

/**
 * The bookings list itself: view switch, filters, loading/empty/error/loaded
 * states, and the detail dialog — structured identically to
 * `ServiceCatalog`/`TeamRoster`.
 *
 * `tenantId` is given `key={tenantId}` by the caller (`BookingsPage`), so a
 * tenant switch fully remounts this component: local filter state resets to
 * the UPCOMING default rather than leaking a previous workspace's technician
 * or service selection into the new one, and `useBookings`' tenant-scoped
 * query key means there is no cached list from another tenant to flash
 * before the new one loads either way.
 */
export function BookingList({ tenantId, timezone }: { tenantId: string; timezone: string | null }) {
  const [filters, setFilters] = useState<BookingListFilter>(DEFAULT_FILTERS);
  const [openBookingId, setOpenBookingId] = useState<string | null>(null);
  const vertical = useVerticalExperience();

  const bookingsQuery = useBookings(tenantId, filters);
  const bookings = bookingsQuery.data ?? [];
  const hasActiveFilter = Boolean(filters.staffId || filters.serviceId || filters.date);

  const emptyMessage = hasActiveFilter
    ? "No bookings match these filters."
    : filters.view === "CANCELLED"
      ? `No cancelled ${vertical.terminology.bookings.toLowerCase()}`
      : filters.view === "PAST"
        ? `No past ${vertical.terminology.bookings.toLowerCase()}`
        : filters.view === "ALL"
          ? `No ${vertical.terminology.bookings.toLowerCase()} yet`
          : `No upcoming ${vertical.terminology.bookings.toLowerCase()}`;

  return (
    <section className="flex flex-col gap-4">
      <BookingFilters tenantId={tenantId} filters={filters} onChange={setFilters} />

      {bookingsQuery.isPending && (
        <div role="status" aria-live="polite" className="card p-6">
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Loading {vertical.terminology.bookings.toLowerCase()}…
          </span>
        </div>
      )}

      {bookingsQuery.isError && (
        <div
          role="alert"
          className="flex flex-col items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-6 dark:border-rose-900/50 dark:bg-rose-950/40"
        >
          <p className="text-sm text-rose-700 dark:text-rose-300">{apiErrorMessage(bookingsQuery.error)}</p>
          <button
            type="button"
            onClick={() => bookingsQuery.refetch()}
            className="btn-secondary h-9 px-3.5 text-sm"
          >
            Try again
          </button>
        </div>
      )}

      {bookingsQuery.isSuccess && bookings.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-600 dark:text-slate-400">{emptyMessage}</p>
        </div>
      )}

      {bookingsQuery.isSuccess && bookings.length > 0 && (
        <ul className="flex flex-col gap-3">
          {bookings.map((booking) => (
            <BookingRow
              key={booking.id}
              booking={booking}
              timezone={timezone}
              onOpenDetail={() => setOpenBookingId(booking.id)}
            />
          ))}
        </ul>
      )}

      {openBookingId && (
        <BookingDetailDialog
          key={openBookingId}
          tenantId={tenantId}
          bookingId={openBookingId}
          onClose={() => setOpenBookingId(null)}
        />
      )}
    </section>
  );
}
