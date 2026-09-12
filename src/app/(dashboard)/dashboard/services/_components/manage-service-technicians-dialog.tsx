"use client";

import { useState } from "react";

import { Dialog } from "@/components/ui/Dialog";
import { apiErrorMessage } from "@/lib/api/error-messages";
import { useReplaceServiceStaff, useServiceStaff, useStaffList } from "@/modules/staff/queries";
import type { Service } from "@/modules/services/types";

/**
 * Which technicians can perform one service (SC2's service-side mirror of
 * `ManageServicesDialog`, the existing staff-side `staff_services` UI).
 *
 * Loads the tenant's real roster through `useStaffList` — the same query the
 * Team page uses — rather than duplicating staff data. Only ACTIVE staff are
 * offerable as a NEW assignment (an archived profile cannot be booked at
 * all); an already-assigned technician who has since been archived is still
 * shown, checked, so unchecking them (removing a stale assignment) remains
 * possible — the exact reasoning `ManageServicesDialog` already documents for
 * archived services, mirrored here for archived staff.
 *
 * The full set is loaded first, then edited locally, then sent as one PUT on
 * Save — the backend's own contract (`ReplaceServiceStaff` takes the complete
 * set, not a delta). Cancel discards local edits entirely.
 */
export function ManageServiceTechniciansDialog({
  tenantId,
  service,
  onClose,
}: {
  tenantId: string;
  service: Service;
  onClose: () => void;
}) {
  const staffQuery = useStaffList(tenantId, "ALL");
  const assignedQuery = useServiceStaff(tenantId, service.id);
  const replaceServiceStaff = useReplaceServiceStaff(tenantId, service.id);

  const [selected, setSelected] = useState<Set<string> | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Seeded from the real assignment the moment it loads, not from an empty
  // default — mirrors ManageServicesDialog's own reasoning for avoiding a
  // flash of every checkbox unchecked before snapping to the real state.
  const [seededFrom, setSeededFrom] = useState<string[] | null>(null);
  if (assignedQuery.isSuccess && assignedQuery.data.staff_ids !== seededFrom) {
    setSeededFrom(assignedQuery.data.staff_ids);
    setSelected(new Set(assignedQuery.data.staff_ids));
  }

  function toggle(staffId: string) {
    setSelected((current) => {
      const next = new Set(current ?? []);
      if (next.has(staffId)) next.delete(staffId);
      else next.add(staffId);
      return next;
    });
  }

  async function handleSave() {
    if (!selected) return;
    setFormError(null);
    try {
      await replaceServiceStaff.mutateAsync(Array.from(selected));
      onClose();
    } catch (err) {
      setFormError(
        apiErrorMessage(err, {
          SERVICE_NOT_FOUND: "That service no longer exists. Refresh to see the current catalog.",
        })
      );
    }
  }

  // Archived staff are hidden from the picker UNLESS already assigned to
  // this service before being archived — see the doc comment above.
  const originallyAssigned = assignedQuery.data?.staff_ids ?? [];
  const staff = (staffQuery.data ?? []).filter(
    (member) => member.status === "ACTIVE" || originallyAssigned.includes(member.id)
  );
  const isLoading = staffQuery.isPending || assignedQuery.isPending || selected === null;
  const isError = staffQuery.isError || assignedQuery.isError;

  return (
    <Dialog
      title={`Technicians for ${service.name}`}
      description="Choose which technicians can perform this service."
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={replaceServiceStaff.isPending}
            className="btn-secondary h-10 px-4 text-sm disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={replaceServiceStaff.isPending || isLoading || isError}
            className="btn-primary h-10 px-4 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            {replaceServiceStaff.isPending ? "Saving…" : "Save"}
          </button>
        </>
      }
    >
      {isLoading && !isError && (
        <div role="status" aria-live="polite" className="py-6 text-center">
          <span className="text-sm text-slate-500 dark:text-slate-400">Loading technicians…</span>
        </div>
      )}

      {isError && (
        <div role="alert" className="flex flex-col items-start gap-3">
          <p className="text-sm text-rose-700 dark:text-rose-300">
            {apiErrorMessage(staffQuery.error ?? assignedQuery.error)}
          </p>
          <button
            type="button"
            onClick={() => {
              staffQuery.refetch();
              assignedQuery.refetch();
            }}
            className="btn-secondary h-9 px-3.5 text-sm"
          >
            Try again
          </button>
        </div>
      )}

      {!isLoading && !isError && staff.length === 0 && (
        <p className="text-sm text-slate-600 dark:text-slate-400">
          You haven&apos;t added any technicians yet. Add one from the Team page first, then come
          back here to assign them.
        </p>
      )}

      {!isLoading && !isError && staff.length > 0 && (
        <fieldset className="flex flex-col gap-1" disabled={replaceServiceStaff.isPending}>
          <legend className="sr-only">Technicians for {service.name}</legend>
          {staff.map((member) => {
            const checked = selected?.has(member.id) ?? false;
            return (
              <label
                key={member.id}
                className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(member.id)}
                  className="h-4 w-4 shrink-0 rounded border-slate-300 text-brand-600 focus:ring-2 focus:ring-brand-600/40 dark:border-slate-700 dark:bg-slate-800"
                />
                <span className="text-slate-900 dark:text-slate-100">{member.display_name}</span>
                {member.status === "ARCHIVED" && (
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
