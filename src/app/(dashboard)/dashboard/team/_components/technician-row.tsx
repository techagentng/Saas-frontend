"use client";

import { useStaffCapabilities } from "@/modules/staff/queries";
import type { StaffProfile } from "@/modules/staff/types";

/**
 * How many services a staff member can perform, loaded from the real
 * per-staff capability endpoint — S3's list DTO carries no count, and one is
 * not invented here. A quiet failure (or the pending state) renders nothing
 * rather than a wrong number or an alarming error inline in a list row; the
 * roster's own error banner is where a real fetch failure is surfaced.
 */
function ServiceCount({ tenantId, staffId }: { tenantId: string; staffId: string }) {
  const capabilitiesQuery = useStaffCapabilities(tenantId, staffId);

  if (!capabilitiesQuery.isSuccess) return null;

  const count = capabilitiesQuery.data.service_ids.length;
  return (
    <span className="text-slate-600 dark:text-slate-400">
      {count === 0 ? "No services assigned" : count === 1 ? "1 service" : `${count} services`}
    </span>
  );
}

/**
 * One roster entry.
 *
 * Shows only what an owner needs to recognize the person and act on their
 * profile. `user_id` itself is never rendered — only whether it is set — and
 * `bio` is shown because it is the one free-text field an owner wrote on
 * purpose; `created_at`/`updated_at` answer no question this screen asks, the
 * same reasoning `ServiceRow` documents for the catalog.
 *
 * Archived state is carried by a text label and a dimmed row, never colour
 * alone. "Not bookable" gets the same treatment — a technician on leave is a
 * real, visible state, not a silently vanished row.
 */
export function TechnicianRow({
  tenantId,
  staff,
  onViewHours,
  onEdit,
  onManageServices,
  onArchive,
}: {
  tenantId: string;
  staff: StaffProfile;
  /**
   * Never omitted — reaching the roster at all already requires
   * `staff.read` (enforced by `TeamPage`), and a schedule has genuine
   * read-only value. `WorkingHoursDialog` itself gates editing on
   * `staff.update`, unlike `onEdit`/`onManageServices`/`onArchive` below,
   * which are pure mutation entry points and are simply absent without the
   * matching permission.
   */
  onViewHours: () => void;
  /** Omitted when the user lacks `staff.update` — the control is then absent, not disabled. */
  onEdit?: () => void;
  /** Omitted when the user lacks `staff.update`. Available regardless of archive state — capability assignment is not a lifecycle action. */
  onManageServices?: () => void;
  /** Omitted when the user lacks `staff.archive`, or when the profile is already archived. */
  onArchive?: () => void;
}) {
  const isArchived = staff.status === "ARCHIVED";

  return (
    <li
      className={`card flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:gap-4 sm:p-5 ${
        isArchived ? "opacity-60" : ""
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            {staff.display_name}
          </h3>
          {isArchived && (
            <span className="rounded-full border border-slate-300 px-2 py-0.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:text-slate-400">
              Archived
            </span>
          )}
          {!isArchived && !staff.is_bookable && (
            <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
              Not bookable
            </span>
          )}
          {staff.user_id && (
            <span className="inline-flex items-center gap-1 rounded-full border border-brand-200 bg-brand-50/60 px-2 py-0.5 text-xs font-medium text-brand-700 dark:border-brand-900 dark:bg-brand-950/30 dark:text-brand-300">
              Linked account
            </span>
          )}
        </div>

        {staff.bio && <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{staff.bio}</p>}

        <div className="mt-2 text-sm">
          <ServiceCount tenantId={tenantId} staffId={staff.id} />
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap gap-2">
        <button
          type="button"
          onClick={onViewHours}
          aria-label={`Working hours for ${staff.display_name}`}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
        >
          Working hours
        </button>
        {(onEdit || onManageServices || onArchive) && (
          <>
          {onManageServices && (
            <button
              type="button"
              onClick={onManageServices}
              aria-label={`Manage services for ${staff.display_name}`}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
            >
              Manage services
            </button>
          )}
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              // Named for the row it acts on: a column of identical "Edit"
              // buttons is unusable from a screen reader's element list.
              aria-label={`Edit ${staff.display_name}`}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
            >
              Edit
            </button>
          )}
          {onArchive && (
            <button
              type="button"
              onClick={onArchive}
              aria-label={`Archive ${staff.display_name}`}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 dark:border-slate-800 dark:text-slate-300 dark:hover:border-rose-900 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
            >
              Archive
            </button>
          )}
          </>
        )}
      </div>
    </li>
  );
}
