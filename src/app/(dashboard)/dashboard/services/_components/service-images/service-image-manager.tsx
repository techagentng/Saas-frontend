"use client";

import { useState } from "react";

import { apiErrorMessage } from "@/lib/api/error-messages";
import { validateSingleImageFile } from "@/lib/media/image-validation";
import { useDeleteServiceImage, useServiceImages, useUploadServiceImages } from "@/modules/service-images/queries";
import type { ServiceImage } from "@/modules/service-images/types";
import { useCan } from "@/providers/permissions-provider";

import { DeleteImageDialog } from "./delete-image-dialog";
import { ImageDropzone } from "./image-dropzone";
import { ImageTile } from "./image-tile";

/**
 * The existing service edit dialog's "Service Image" section — the
 * server-backed counterpart of the Add Service builder's
 * `ServiceImagePicker`. Everything here is a real mutation against the
 * already-created service named by `serviceId`, invalidated through
 * `modules/service-images/queries`, never local-only state.
 *
 * One photo per service: picking a new file replaces whatever is already
 * there (delete the old one, then upload the new one) rather than adding to
 * a gallery.
 *
 * `service.read` governs whether this renders at all (the caller only mounts
 * it where the dialog is already visible, i.e. already gated); `service.update`
 * governs every control inside it — with only `service.read`, the photo is
 * still shown, just with nothing to click.
 */
export function ServiceImageManager({ tenantId, serviceId }: { tenantId: string; serviceId: string }) {
  const canUpdate = useCan("service.update");
  const imagesQuery = useServiceImages(tenantId, serviceId);
  const uploadImages = useUploadServiceImages(tenantId, serviceId);
  const deleteImage = useDeleteServiceImage(tenantId, serviceId);

  const [uploadError, setUploadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<ServiceImage | null>(null);
  const [isReplacing, setIsReplacing] = useState(false);

  const images = imagesQuery.data ?? [];
  const cover = images.find((image) => image.is_primary) ?? images[0] ?? null;

  async function handleFileSelected(file: File) {
    setUploadError(null);
    setActionError(null);

    const { file: validFile, reason } = validateSingleImageFile(file);
    if (!validFile) {
      setUploadError(reason);
      return;
    }

    setIsReplacing(true);
    try {
      if (cover) await deleteImage.mutateAsync(cover.id);
      await uploadImages.mutateAsync([validFile]);
    } catch (err) {
      setActionError(apiErrorMessage(err));
    } finally {
      setIsReplacing(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
      <div>
        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Service Image</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          The photo customers see while booking this service.
        </p>
      </div>

      {imagesQuery.isPending && (
        <p className="text-xs text-slate-500 dark:text-slate-400">Loading image…</p>
      )}

      {imagesQuery.isError && (
        <div role="alert" className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400">
          <span>{apiErrorMessage(imagesQuery.error)}</span>
          <button type="button" onClick={() => imagesQuery.refetch()} className="underline underline-offset-2">
            Try again
          </button>
        </div>
      )}

      {imagesQuery.isSuccess && (
        <>
          {cover && (
            <ul className="flex flex-wrap gap-2">
              <ImageTile
                src={cover.url}
                alt={cover.alt_text ?? "Service image"}
                isCover={false}
                status={isReplacing ? "uploading" : "idle"}
                onRemove={canUpdate && !isReplacing ? () => setDeleting(cover) : undefined}
              />
            </ul>
          )}

          {canUpdate && (
            <ImageDropzone
              onFileSelected={handleFileSelected}
              hasImage={Boolean(cover)}
              disabled={isReplacing}
            />
          )}

          {!canUpdate && !cover && (
            <p className="text-xs text-slate-500 dark:text-slate-400">No image added yet.</p>
          )}
        </>
      )}

      {uploadError && (
        <p role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-400">
          {uploadError}
        </p>
      )}

      {actionError && (
        <p role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-400">
          {actionError}
        </p>
      )}

      {deleting && (
        <DeleteImageDialog
          key={deleting.id}
          tenantId={tenantId}
          serviceId={serviceId}
          image={deleting}
          otherImageCount={0}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
