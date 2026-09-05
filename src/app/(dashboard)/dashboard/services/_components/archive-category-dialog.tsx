"use client";

import { useState } from "react";

import { Dialog } from "@/components/ui/Dialog";
import { apiErrorMessage } from "@/lib/api/error-messages";
import { useArchiveServiceCategory } from "@/modules/service-categories/queries";
import type { ServiceCategory } from "@/modules/service-categories/types";

/**
 * Confirmation before archiving a category (SC1). Mirrors
 * `ArchiveServiceDialog`'s shape exactly, for the identical reason: archiving
 * is a real, honest state transition, never a delete, and the services filed
 * under this category are untouched — they keep their `category_id` and stay
 * individually bookable. The copy says only that, and nothing about services
 * being removed or reassigned, because the backend makes neither claim.
 */
export function ArchiveCategoryDialog({
  tenantId,
  category,
  onClose,
}: {
  tenantId: string;
  category: ServiceCategory;
  onClose: () => void;
}) {
  const archiveCategory = useArchiveServiceCategory(tenantId);
  const [error, setError] = useState<string | null>(null);

  async function handleArchive() {
    setError(null);
    try {
      await archiveCategory.mutateAsync(category.id);
      onClose();
    } catch (err) {
      setError(
        apiErrorMessage(err, {
          CATEGORY_NOT_FOUND: "That category no longer exists. Refresh to see the current catalog.",
        })
      );
    }
  }

  return (
    <Dialog
      title={`Archive ${category.name}?`}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={archiveCategory.isPending}
            className="btn-secondary h-10 px-4 text-sm disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleArchive}
            disabled={archiveCategory.isPending}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {archiveCategory.isPending ? "Archiving…" : "Archive category"}
          </button>
        </>
      }
    >
      <p className="text-sm text-slate-600 dark:text-slate-400">
        This hides &quot;{category.name}&quot; from the category picker and the public booking
        page. Services already filed under it are not archived, deleted or moved — they stay
        exactly as they are and remain individually bookable.
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
