"use client";

import { useMemo, useState } from "react";

import { apiErrorMessage } from "@/lib/api/error-messages";
import { useStaffList } from "@/modules/staff/queries";
import type { StaffProfile } from "@/modules/staff/types";
import { useCan } from "@/providers/permissions-provider";

import { ArchiveTechnicianDialog } from "./archive-technician-dialog";
import { ManageServicesDialog } from "./manage-services-dialog";
import { TechnicianFormDialog } from "./technician-form-dialog";
import { TechnicianRow } from "./technician-row";
import { WorkingHoursDialog } from "./working-hours-dialog";

/**
 * The roster itself: loading, empty, error, and loaded states, plus whichever
 * mutation dialog is open. Structured identically to `ServiceCatalog`.
 *
 * Fetches with `status=ALL` rather than the backend's ACTIVE default, so
 * archiving marks a row rather than vanishing it — the honest rendering of
 * archive-not-delete, and an owner can still see who they archived.
 */
export function TeamRoster({ tenantId }: { tenantId: string }) {
  const staffQuery = useStaffList(tenantId, "ALL");

  // Read fresh from PermissionsProvider on every render. Permissions are
  // per-tenant and change when the workspace changes; caching them inside
  // this module would let one workspace's capabilities govern another's
  // controls.
  const canCreate = useCan("staff.create");
  const canUpdate = useCan("staff.update");
  const canArchive = useCan("staff.archive");

  const [isCreating, setIsCreating] = useState(false);
  const [editing, setEditing] = useState<StaffProfile | null>(null);
  const [managingServices, setManagingServices] = useState<StaffProfile | null>(null);
  const [viewingHours, setViewingHours] = useState<StaffProfile | null>(null);
  const [archiving, setArchiving] = useState<StaffProfile | null>(null);

  // Active first, then by name, so the roster reads as a team list rather
  // than insertion order. Archived entries sink to the bottom instead of
  // being interleaved with people actually taking bookings.
  const staff = useMemo(() => {
    const rows = staffQuery.data ?? [];
    return [...rows].sort((a, b) => {
      if (a.status !== b.status) return a.status === "ACTIVE" ? -1 : 1;
      return a.display_name.localeCompare(b.display_name);
    });
  }, [staffQuery.data]);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {staffQuery.isSuccess
            ? `${staff.length} ${staff.length === 1 ? "technician" : "technicians"}`
            : "Your team"}
        </h2>
        {canCreate && staffQuery.isSuccess && staff.length > 0 && (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="btn-primary h-10 px-4 text-sm"
          >
            Add technician
          </button>
        )}
      </div>

      {staffQuery.isPending && (
        <div role="status" aria-live="polite" className="card p-6">
          <span className="text-sm text-slate-500 dark:text-slate-400">Loading team…</span>
        </div>
      )}

      {staffQuery.isError && (
        <div
          role="alert"
          className="flex flex-col items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-6 dark:border-rose-900/50 dark:bg-rose-950/40"
        >
          <p className="text-sm text-rose-700 dark:text-rose-300">
            {apiErrorMessage(staffQuery.error)}
          </p>
          <button
            type="button"
            onClick={() => staffQuery.refetch()}
            className="btn-secondary h-9 px-3.5 text-sm"
          >
            Try again
          </button>
        </div>
      )}

      {staffQuery.isSuccess && staff.length === 0 && (
        <div className="flex flex-col items-start gap-4 rounded-2xl border border-dashed border-slate-300 bg-white p-8 dark:border-slate-700 dark:bg-slate-900">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
              No technicians yet
            </h3>
            <p className="mt-1 max-w-prose text-sm text-slate-600 dark:text-slate-400">
              Add yourself or another team member so customers can book services with them.
            </p>
          </div>
          {canCreate ? (
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="btn-primary h-11 px-5 text-sm"
            >
              Add technician
            </button>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Ask an owner to add the first team member.
            </p>
          )}
        </div>
      )}

      {staffQuery.isSuccess && staff.length > 0 && (
        <ul className="flex flex-col gap-3">
          {staff.map((member) => (
            <TechnicianRow
              key={member.id}
              tenantId={tenantId}
              staff={member}
              onViewHours={() => setViewingHours(member)}
              onEdit={canUpdate ? () => setEditing(member) : undefined}
              onManageServices={canUpdate ? () => setManagingServices(member) : undefined}
              // Archiving an already-archived profile is a no-op server-side,
              // so the control is simply absent there rather than offering an
              // action with no effect.
              onArchive={
                canArchive && member.status === "ACTIVE" ? () => setArchiving(member) : undefined
              }
            />
          ))}
        </ul>
      )}

      {isCreating && <TechnicianFormDialog tenantId={tenantId} onClose={() => setIsCreating(false)} />}

      {editing && (
        <TechnicianFormDialog
          // Remounts per technician, so the form's initial values come from
          // the profile actually being edited rather than whichever one
          // opened the dialog first.
          key={editing.id}
          tenantId={tenantId}
          staff={editing}
          onClose={() => setEditing(null)}
        />
      )}

      {managingServices && (
        <ManageServicesDialog
          key={managingServices.id}
          tenantId={tenantId}
          staff={managingServices}
          onClose={() => setManagingServices(null)}
        />
      )}

      {viewingHours && (
        <WorkingHoursDialog
          key={viewingHours.id}
          tenantId={tenantId}
          staff={viewingHours}
          onClose={() => setViewingHours(null)}
        />
      )}

      {archiving && (
        <ArchiveTechnicianDialog
          key={archiving.id}
          tenantId={tenantId}
          staff={archiving}
          onClose={() => setArchiving(null)}
        />
      )}
    </section>
  );
}
