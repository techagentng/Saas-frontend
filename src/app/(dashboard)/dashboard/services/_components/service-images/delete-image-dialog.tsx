"use client";

import { useState } from "react";

import { Dialog } from "@/components/ui/Dialog";
import { apiErrorMessage } from "@/lib/api/error-messages";
import { useDeleteServiceImage } from "@/modules/service-images/queries";
import type { ServiceImage } from "@/modules/service-images/types";

/**
 * Confirmation before deleting an uploaded image — unlike a service or
 * category, an image really is gone once deleted (see `ServiceImage`'s own
 * doc comment: nothing else holds a foreign key to it), so this is a real
 * "are you sure", not the archive-not-delete pattern the rest of the catalog
 * uses. Mirrors `ArchiveServiceDialog`/`ArchiveCategoryDialog`'s shape rather
 * than a browser `confirm()`, for the same reason: an untestable native
 * dialog is exactly the wrong place to hide this.
 */
export function DeleteImageDialog({
  tenantId,
  serviceId,
  image,
  otherImageCount,
  onClose,
}: {
  tenantId: string;
  serviceId: string;
  image: ServiceImage;
  /** How many OTHER images this service has, so the cover-succession copy is accurate. */
  otherImageCount: number;
  onClose: () => void;
}) {
  const deleteImage = useDeleteServiceImage(tenantId, serviceId);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setError(null);
    try {
      await deleteImage.mutateAsync(image.id);
      onClose();
    } catch (err) {
      setError(
        apiErrorMessage(err, {
          IMAGE_NOT_FOUND: "That image no longer exists. Refresh to see the current gallery.",
        })
      );
    }
  }

  return (
    <Dialog
      title="Remove this image?"
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={deleteImage.isPending}
            className="btn-secondary h-10 px-4 text-sm disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteImage.isPending}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleteImage.isPending ? "Removing…" : "Remove image"}
          </button>
        </>
      }
    >
      <p className="text-sm text-slate-600 dark:text-slate-400">
        This permanently removes the image from this service. Customers will no longer see it.
      </p>
      {image.is_primary && otherImageCount > 0 && (
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
          This is the cover image. Another remaining image will automatically become the new
          cover.
        </p>
      )}

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
