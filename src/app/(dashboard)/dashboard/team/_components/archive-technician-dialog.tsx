"use client";

import { useState } from "react";

import { Dialog } from "@/components/ui/Dialog";
import { apiErrorMessage } from "@/lib/api/error-messages";
import { useVerticalExperience } from "@/lib/vertical/use-vertical-experience";
import { useArchiveStaff } from "@/modules/staff/queries";
import type { StaffProfile } from "@/modules/staff/types";

/**
 * Confirmation step before archiving. Called Archive, never Delete or
 * Remove, for the same reason `ArchiveServiceDialog` uses it: the backend
 * never deletes the row, and a future appointment feature will hold a real
 * foreign key to it.
 *
 * The consequence copy states only what is actually true today: the person
 * stops appearing as bookable. It makes no claim about existing
 * appointments, because there is no appointment feature yet to make a claim
 * about (scope guard: S4 does not implement booking).
 *
 * There is no restore action — the backend exposes no un-archive endpoint.
 */
export function ArchiveTechnicianDialog({
  tenantId,
  staff,
  onClose,
}: {
  tenantId: string;
  staff: StaffProfile;
  onClose: () => void;
}) {
  const archiveStaff = useArchiveStaff(tenantId);
  const vertical = useVerticalExperience();
  const [error, setError] = useState<string | null>(null);

  async function handleArchive() {
    setError(null);
    try {
      await archiveStaff.mutateAsync(staff.id);
      onClose();
    } catch (err) {
      setError(
        apiErrorMessage(err, {
          STAFF_NOT_FOUND: "That team member no longer exists. Refresh to see the current roster.",
        })
      );
    }
  }

  return (
    <Dialog
      title={`Archive ${staff.display_name}?`}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={archiveStaff.isPending}
            className="btn-secondary h-10 px-4 text-sm disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleArchive}
            disabled={archiveStaff.isPending}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {archiveStaff.isPending
              ? "Archiving…"
              : `Archive ${vertical.team.singular.toLowerCase()}`}
          </button>
        </>
      }
    >
      <p className="text-sm text-slate-600 dark:text-slate-400">
        {staff.display_name} will no longer appear as bookable. They stay on your team list marked
        as archived.
      </p>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300"
        >
          {error}
        </p>
      )}
    </Dialog>
  );
}
