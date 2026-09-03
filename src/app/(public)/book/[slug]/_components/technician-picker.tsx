"use client";

import { useEffect, useMemo } from "react";

import { apiErrorMessage } from "@/lib/api/error-messages";
import { usePublicServiceStaff } from "@/modules/public-booking/queries";

import { InlineLoading, InlineRetry } from "./booking-states";

/** First letters of up to two words — a quiet avatar stand-in, decorative only. */
function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

/**
 * Step 2 — choose a technician (Scheduling S9).
 *
 * Lists the real, capable, bookable technicians for the chosen service from
 * the public S9 endpoint. No dashboard staff components (those expose
 * owner-management UI); no "Any technician" (the backend has no cross-staff
 * aggregation contract). If exactly one technician can perform the service,
 * they are selected automatically — the customer has no meaningful choice to
 * make there.
 */
export function TechnicianPicker({
  slug,
  serviceId,
  selectedStaffId,
  onSelect,
}: {
  slug: string;
  serviceId: string;
  selectedStaffId: string | null;
  onSelect: (staffId: string) => void;
}) {
  const query = usePublicServiceStaff(slug, serviceId);
  const staff = useMemo(() => query.data?.staff ?? [], [query.data]);

  // Auto-select the only option. Guarded on "nothing selected yet" so it does
  // not fight a customer who later navigates back to change their mind on a
  // multi-technician service — and it only ever runs for a genuine list of one.
  useEffect(() => {
    if (query.isSuccess && staff.length === 1 && selectedStaffId === null) {
      onSelect(staff[0].id);
    }
  }, [query.isSuccess, staff, selectedStaffId, onSelect]);

  return (
    <section aria-labelledby="technician-heading" className="space-y-4">
      <h2
        id="technician-heading"
        className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white"
      >
        Choose a technician
      </h2>

      {query.isPending && <InlineLoading label="Loading technicians…" />}

      {query.isError && (
        <InlineRetry
          message={apiErrorMessage(query.error, {
            SERVICE_NOT_FOUND: "That service is no longer available for online booking.",
          })}
          onRetry={() => query.refetch()}
        />
      )}

      {query.isSuccess && staff.length === 0 && (
        <p className="rounded-2xl border border-dashed border-[#D9C6BA] bg-white/60 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
          No technicians are currently available for this service.
        </p>
      )}

      {query.isSuccess && staff.length > 0 && (
        <ul className="grid gap-2.5 sm:grid-cols-2">
          {staff.map((technician) => {
            const isSelected = technician.id === selectedStaffId;
            return (
              <li key={technician.id}>
                <button
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onSelect(technician.id)}
                  className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left text-sm font-medium transition-colors ${
                    isSelected
                      ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900"
                      : "border-[#E0D0C5] bg-white/70 text-slate-800 hover:border-slate-400 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-200 dark:hover:border-slate-600"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                      isSelected
                        ? "bg-white/20 text-white dark:bg-slate-900/15 dark:text-slate-900"
                        : "bg-[#EFE3DA] text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {initials(technician.name)}
                  </span>
                  {technician.name}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
