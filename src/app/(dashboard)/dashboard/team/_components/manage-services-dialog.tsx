"use client";

import { useState } from "react";

import { Dialog } from "@/components/ui/Dialog";
import { apiErrorMessage } from "@/lib/api/error-messages";
import { useServices } from "@/modules/services/queries";
import { useReplaceStaffCapabilities, useStaffCapabilities } from "@/modules/staff/queries";
import type { StaffProfile } from "@/modules/staff/types";

/**
 * Which services a technician can perform (Scheduling S3's `staff_services`).
 *
 * Loads the tenant's real service catalog through `useServices` — the same
 * S2 query the Services page uses — rather than duplicating service data.
 * Only ACTIVE services are offerable as a NEW capability (an archived
 * service cannot be booked at all, so assigning it to someone would be
 * meaningless); an already-assigned service that has since been archived is
 * still shown, checked, so unchecking it (removing a stale capability)
 * remains possible, matching "removing a service capability" from the spec.
 *
 * The full set is loaded first, then edited locally, then sent as one PUT on
 * Save — mirroring the backend's own contract (`ReplaceCapabilities` takes
 * the complete set, not a delta). Cancel discards local edits entirely.
 *
 * Never renders another tenant's services: `useServices(tenantId, ...)` is
 * itself tenant-scoped, so there is no code path that could show or submit a
 * foreign service id — and if a stale local id somehow named one, the
 * backend's own composite foreign key rejects it as VALIDATION_FAILED, per
 * `StaffService.ReplaceCapabilities`.
 */
export function ManageServicesDialog({
  tenantId,
  staff,
  onClose,
}: {
  tenantId: string;
  staff: StaffProfile;
  onClose: () => void;
}) {
  const servicesQuery = useServices(tenantId, "ALL");
  const capabilitiesQuery = useStaffCapabilities(tenantId, staff.id);
  const replaceCapabilities = useReplaceStaffCapabilities(tenantId, staff.id);

  const [selected, setSelected] = useState<Set<string> | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Seeded from the real assignment the moment it loads, not from an empty
  // default — an empty Set here would render every checkbox unchecked for a
  // moment before snapping to the real state, which is exactly the flash the
  // loading guard below exists to prevent.
  //
  // Adjusted during render (React's documented pattern for resetting state
  // when an input changes, the same one `DashboardShell` uses for
  // `renderedPathname`) rather than in an effect, which would cost an extra
  // render and, per the rules of hooks, cannot call setState synchronously in
  // its body.
  const [seededFrom, setSeededFrom] = useState<string[] | null>(null);
  if (capabilitiesQuery.isSuccess && capabilitiesQuery.data.service_ids !== seededFrom) {
    setSeededFrom(capabilitiesQuery.data.service_ids);
    setSelected(new Set(capabilitiesQuery.data.service_ids));
  }

  function toggle(serviceId: string) {
    setSelected((current) => {
      const next = new Set(current ?? []);
      if (next.has(serviceId)) next.delete(serviceId);
      else next.add(serviceId);
      return next;
    });
  }

  async function handleSave() {
    if (!selected) return;
    setFormError(null);
    try {
      await replaceCapabilities.mutateAsync(Array.from(selected));
      onClose();
    } catch (err) {
      setFormError(
        apiErrorMessage(err, {
          STAFF_NOT_FOUND: "That team member no longer exists. Refresh to see the current roster.",
        })
      );
    }
  }

  // Archived services are hidden from the picker UNLESS this technician was
  // already assigned to one before it was archived — that row must stay
  // visible so removing a now-stale capability is possible, matching the
  // filter's own doc comment above. Filtered against the assignment as
  // originally loaded, not the live `selected` edits, so unchecking one
  // doesn't make it vanish mid-edit and become impossible to re-check.
  const originallyAssigned = capabilitiesQuery.data?.service_ids ?? [];
  const services = (servicesQuery.data ?? []).filter(
    (service) => service.status === "ACTIVE" || originallyAssigned.includes(service.id)
  );
  const isLoading = servicesQuery.isPending || capabilitiesQuery.isPending || selected === null;
  const isError = servicesQuery.isError || capabilitiesQuery.isError;

  return (
    <Dialog
      title={`Services ${staff.display_name} can perform`}
      description="Choose which of your services this person is qualified to deliver."
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={replaceCapabilities.isPending}
            className="btn-secondary h-10 px-4 text-sm disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={replaceCapabilities.isPending || isLoading || isError}
            className="btn-primary h-10 px-4 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            {replaceCapabilities.isPending ? "Saving…" : "Save"}
          </button>
        </>
      }
    >
      {isLoading && !isError && (
        <div role="status" aria-live="polite" className="py-6 text-center">
          <span className="text-sm text-slate-500 dark:text-slate-400">Loading services…</span>
        </div>
      )}

      {isError && (
        <div role="alert" className="flex flex-col items-start gap-3">
          <p className="text-sm text-rose-700 dark:text-rose-300">
            {apiErrorMessage(servicesQuery.error ?? capabilitiesQuery.error)}
          </p>
          <button
            type="button"
            onClick={() => {
              servicesQuery.refetch();
              capabilitiesQuery.refetch();
            }}
            className="btn-secondary h-9 px-3.5 text-sm"
          >
            Try again
          </button>
        </div>
      )}

      {!isLoading && !isError && services.length === 0 && (
        <p className="text-sm text-slate-600 dark:text-slate-400">
          You haven&apos;t added any services yet. Add a service from the Services page first, then
          come back here to assign it.
        </p>
      )}

      {!isLoading && !isError && services.length > 0 && (
        <fieldset className="flex flex-col gap-1" disabled={replaceCapabilities.isPending}>
          <legend className="sr-only">Services {staff.display_name} can perform</legend>
          {services.map((service) => {
            const checked = selected?.has(service.id) ?? false;
            return (
              <label
                key={service.id}
                className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(service.id)}
                  className="h-4 w-4 shrink-0 rounded border-slate-300 text-brand-600 focus:ring-2 focus:ring-brand-600/40 dark:border-slate-700 dark:bg-slate-800"
                />
                <span className="text-slate-900 dark:text-slate-100">{service.name}</span>
                {service.status === "ARCHIVED" && (
                  <span className="ml-auto rounded-full border border-slate-300 px-2 py-0.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:text-slate-400">
                    Archived
                  </span>
                )}
              </label>
            );
          })}
        </fieldset>
      )}

      {formError && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300"
        >
          {formError}
        </p>
      )}
    </Dialog>
  );
}
