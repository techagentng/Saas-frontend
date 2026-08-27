"use client";

import { useState } from "react";

import { Dialog } from "@/components/ui/Dialog";
import { apiErrorMessage } from "@/lib/api/error-messages";
import { useArchiveService } from "@/modules/services/queries";
import type { Service } from "@/modules/services/types";

/**
 * Confirmation step before archiving. The action is called Archive, never
 * Delete, because that is what the backend does — rows are never removed, and
 * appointments will hold a real foreign key to them from S10 onward.
 *
 * The consequence copy states only what is actually true today: the service
 * stops being offered for future bookings. It deliberately makes no claim
 * about existing bookings, because there is no booking feature yet to make a
 * claim about.
 *
 * There is no restore action here or anywhere else — the backend exposes no
 * un-archive endpoint, and inventing a client-side one would be a promise the
 * API cannot keep.
 */
export function ArchiveServiceDialog({
  tenantId,
  service,
  onClose,
}: {
  tenantId: string;
  service: Service;
  onClose: () => void;
}) {
  const archiveService = useArchiveService(tenantId);
  const [error, setError] = useState<string | null>(null);

  async function handleArchive() {
    setError(null);
    try {
      await archiveService.mutateAsync(service.id);
      onClose();
    } catch (err) {
      setError(
        apiErrorMessage(err, {
          SERVICE_NOT_FOUND: "That service no longer exists. Refresh to see the current catalog.",
        })
      );
    }
  }

  return (
    <Dialog
      title={`Archive ${service.name}?`}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={archiveService.isPending}
            className="btn-secondary h-10 px-4 text-sm disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleArchive}
            disabled={archiveService.isPending}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {archiveService.isPending ? "Archiving…" : "Archive service"}
          </button>
        </>
      }
    >
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Archived services will no longer be available for future customer booking. They stay in
        your catalog marked as archived.
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
