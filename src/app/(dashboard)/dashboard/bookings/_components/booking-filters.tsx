"use client";

import { fieldInputClass } from "@/components/ui/field";
import { useVerticalExperience } from "@/lib/vertical/use-vertical-experience";
import { useServices } from "@/modules/services/queries";
import { useStaffList } from "@/modules/staff/queries";
import type { BookingListFilter, BookingView } from "@/modules/bookings/types";

const VIEWS: { value: BookingView; label: string }[] = [
  { value: "UPCOMING", label: "Upcoming" },
  { value: "PAST", label: "Past" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "ALL", label: "All" },
];

/**
 * The S11 view switch (backend `?view=`) plus the three supported filters
 * (date, technician, service) — nothing more. No customer-name search, no
 * arbitrary query building: this exists to drive the exact query the backend
 * already supports, never to recreate its filtering logic client-side.
 *
 * Technician/service options come from this tenant's own ACTIVE roster and
 * catalog (`useStaffList`/`useServices`), the same data source Team and
 * Services already use — never a hardcoded list, and never another tenant's
 * options once the caller remounts this on tenant switch (see
 * `BookingList`'s `key={tenantId}`).
 */
export function BookingFilters({
  tenantId,
  filters,
  onChange,
}: {
  tenantId: string;
  filters: BookingListFilter;
  onChange: (next: BookingListFilter) => void;
}) {
  const vertical = useVerticalExperience();
  const staffQuery = useStaffList(tenantId, "ACTIVE");
  const servicesQuery = useServices(tenantId, "ACTIVE");

  const hasActiveFilter = Boolean(filters.staffId || filters.serviceId || filters.date);

  return (
    <div className="flex flex-col gap-4">
      <div
        role="tablist"
        aria-label={`${vertical.terminology.bookings} view`}
        className="flex w-fit flex-wrap gap-1 rounded-full border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-900"
      >
        {VIEWS.map((v) => (
          <button
            key={v.value}
            type="button"
            role="tab"
            aria-selected={filters.view === v.value}
            onClick={() => onChange({ ...filters, view: v.value })}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              filters.view === v.value
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="booking-date-filter" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Date
          </label>
          <input
            id="booking-date-filter"
            type="date"
            value={filters.date ?? ""}
            onChange={(event) => onChange({ ...filters, date: event.target.value || null })}
            className={`${fieldInputClass} h-10`}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="booking-staff-filter" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {vertical.team.singular}
          </label>
          <select
            id="booking-staff-filter"
            value={filters.staffId ?? ""}
            onChange={(event) => onChange({ ...filters, staffId: event.target.value || null })}
            className={`${fieldInputClass} h-10`}
          >
            <option value="">{`All ${vertical.team.memberPlural}`}</option>
            {(staffQuery.data ?? []).map((member) => (
              <option key={member.id} value={member.id}>
                {member.display_name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="booking-service-filter" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {vertical.terminology.service}
          </label>
          <select
            id="booking-service-filter"
            value={filters.serviceId ?? ""}
            onChange={(event) => onChange({ ...filters, serviceId: event.target.value || null })}
            className={`${fieldInputClass} h-10`}
          >
            <option value="">{`All ${vertical.terminology.services.toLowerCase()}`}</option>
            {(servicesQuery.data ?? []).map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
        </div>

        {hasActiveFilter && (
          <button
            type="button"
            onClick={() => onChange({ ...filters, staffId: null, serviceId: null, date: null })}
            className="h-10 rounded-lg px-3 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
