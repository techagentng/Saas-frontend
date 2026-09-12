"use client";

import { useEffect, useRef, useState } from "react";

import { validateSingleImageFile } from "@/lib/media/image-validation";

import { ImageDropzone } from "../service-images/image-dropzone";
import { ImageTile } from "../service-images/image-tile";
import type { DraftImage } from "./types";

/**
 * The Add Service builder's image section — Customize step, before the
 * service exists. There is no service id yet to upload against, so this
 * holds a single plain `File` and a `URL.createObjectURL` preview entirely in
 * local state (owned by the parent draft — see `add-service-builder.tsx`),
 * and never calls the network. The actual upload happens once, right after
 * this draft's service is created (see `handleSubmit`), using this exact
 * file.
 *
 * One photo per service: picking a new file replaces whatever was already
 * chosen rather than adding to it.
 */
export function ServiceImagePicker({
  image,
  onImageChange,
  disabled = false,
  serviceName,
}: {
  image: DraftImage | null;
  onImageChange: (next: DraftImage | null) => void;
  disabled?: boolean;
  /**
   * Named on the caller's draft, so when several services are being
   * customized at once each one's image section reads as "Photo for X"
   * rather than an identical, unlabelled "Service Image" repeated once per
   * card — which otherwise looks like the same section duplicated.
   */
  serviceName?: string;
}) {
  const [error, setError] = useState<string | null>(null);

  // Revokes the preview URL still held by this draft the moment its picker
  // unmounts — whether because the draft was removed, the builder closed, or
  // the whole builder remounted on a tenant switch. Replacing/removing the
  // image revokes inline (see handleFileSelected/handleRemove) so this is
  // specifically the "whatever is left when this stops existing" backstop.
  const imageRef = useRef(image);
  useEffect(() => {
    imageRef.current = image;
  }, [image]);
  useEffect(
    () => () => {
      if (imageRef.current) URL.revokeObjectURL(imageRef.current.previewUrl);
    },
    []
  );

  function handleFileSelected(file: File) {
    setError(null);
    const { file: validFile, reason } = validateSingleImageFile(file);
    if (!validFile) {
      setError(reason);
      return;
    }

    if (image) URL.revokeObjectURL(image.previewUrl);
    onImageChange({
      key: `img-${Math.random().toString(36).slice(2)}`,
      file: validFile,
      previewUrl: URL.createObjectURL(validFile),
    });
  }

  function handleRemove() {
    if (image) URL.revokeObjectURL(image.previewUrl);
    onImageChange(null);
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {serviceName ? `Photo for ${serviceName}` : "Service Image"}
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Add a photo customers will see while booking this service.
        </p>
      </div>

      {image && (
        <ul className="flex flex-wrap gap-2">
          <ImageTile
            src={image.previewUrl}
            alt={image.file.name}
            isCover={false}
            onRemove={disabled ? undefined : handleRemove}
          />
        </ul>
      )}

      {!disabled && <ImageDropzone onFileSelected={handleFileSelected} hasImage={Boolean(image)} />}

      {error && (
        <p role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-400">
          {error}
        </p>
      )}
    </div>
  );
}
