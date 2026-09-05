"use client";

import { useState } from "react";

import { apiErrorMessage } from "@/lib/api/error-messages";
import { validateImageFiles } from "@/lib/media/image-validation";
import {
  useReorderServiceImages,
  useServiceImages,
  useUpdateServiceImage,
  useUploadServiceImages,
} from "@/modules/service-images/queries";
import type { ServiceImage } from "@/modules/service-images/types";
import { useCan } from "@/providers/permissions-provider";

import { DeleteImageDialog } from "./delete-image-dialog";
import { ImageDropzone } from "./image-dropzone";
import { ImageTile } from "./image-tile";

/**
 * The existing service edit dialog's "Service Images" section — the
 * server-backed counterpart of the Add Service builder's
 * `ServiceImagePicker`. Everything here is a real mutation against the
 * already-created service named by `serviceId`, invalidated through
 * `modules/service-images/queries`, never local-only state.
 *
 * `service.read` governs whether this renders at all (the caller only mounts
 * it where the dialog is already visible, i.e. already gated); `service.update`
 * governs every control inside it — with only `service.read`, the gallery is
 * still shown, just with nothing to click.
 */
export function ServiceImageManager({ tenantId, serviceId }: { tenantId: string; serviceId: string }) {
  const canUpdate = useCan("service.update");
  const imagesQuery = useServiceImages(tenantId, serviceId);
  const uploadImages = useUploadServiceImages(tenantId, serviceId);
  const updateImage = useUpdateServiceImage(tenantId, serviceId);
  const reorderImages = useReorderServiceImages(tenantId, serviceId);

  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<ServiceImage | null>(null);

  const images = imagesQuery.data ?? [];

  async function handleFilesSelected(files: File[]) {
    setUploadErrors([]);
    setActionError(null);
    const { accepted, rejected } = validateImageFiles(images.length, files);
    if (rejected.length > 0) {
      setUploadErrors(rejected.map((r) => `${r.file.name}: ${r.reason}`));
    }
    if (accepted.length === 0) return;

    try {
      await uploadImages.mutateAsync(accepted);
    } catch (err) {
      setUploadErrors((prev) => [...prev, apiErrorMessage(err)]);
    }
  }

  async function handleSetCover(imageId: string) {
    setActionError(null);
    try {
      await updateImage.mutateAsync({ imageId, input: { is_primary: true } });
    } catch (err) {
      setActionError(apiErrorMessage(err));
    }
  }

  async function handleMove(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const next = [...images];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    setActionError(null);
    try {
      await reorderImages.mutateAsync(next.map((image) => image.id));
    } catch (err) {
      setActionError(apiErrorMessage(err));
    }
  }

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
      <div>
        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Service Images</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Add photos that customers will see while booking this service.
        </p>
      </div>

      {imagesQuery.isPending && (
        <p className="text-xs text-slate-500 dark:text-slate-400">Loading images…</p>
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
          {images.length > 0 && (
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {images.map((image, index) => (
                <ImageTile
                  key={image.id}
                  src={image.url}
                  alt={image.alt_text ?? "Service image"}
                  isCover={image.is_primary}
                  onSetCover={
                    canUpdate && !image.is_primary ? () => handleSetCover(image.id) : undefined
                  }
                  onRemove={canUpdate ? () => setDeleting(image) : undefined}
                  onMoveLeft={canUpdate && index > 0 ? () => handleMove(index, -1) : undefined}
                  onMoveRight={
                    canUpdate && index < images.length - 1 ? () => handleMove(index, 1) : undefined
                  }
                />
              ))}
            </ul>
          )}

          {canUpdate && (
            <ImageDropzone onFilesSelected={handleFilesSelected} maxReached={images.length >= 5} />
          )}

          {!canUpdate && images.length === 0 && (
            <p className="text-xs text-slate-500 dark:text-slate-400">No images added yet.</p>
          )}
        </>
      )}

      {uploadErrors.length > 0 && (
        <ul role="alert" className="flex flex-col gap-0.5 text-xs font-medium text-rose-600 dark:text-rose-400">
          {uploadErrors.map((message, index) => (
            <li key={index}>{message}</li>
          ))}
        </ul>
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
          otherImageCount={images.length - 1}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
