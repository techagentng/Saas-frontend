"use client";

import { useEffect, useRef, useState } from "react";

import { validateImageFiles } from "@/lib/media/image-validation";

import { ImageDropzone } from "../service-images/image-dropzone";
import { ImageTile } from "../service-images/image-tile";
import type { DraftImage } from "./types";

/**
 * The Add Service builder's image section — Customize step, before the
 * service exists. There is no service id yet to upload against, so this
 * holds plain `File` objects and `URL.createObjectURL` previews entirely in
 * local state (owned by the parent draft — see `add-service-builder.tsx`),
 * and never calls the network. The actual upload happens once, right after
 * this draft's service is created (see `handleSubmit`), using these exact
 * files in this exact order.
 *
 * `coverKey === null` means "no explicit choice yet" — the first image is the
 * effective cover, matching the backend's own rule that the first-ever
 * upload becomes primary. Choosing a different one sets `coverKey` and stays
 * sticky across reordering.
 */
export function ServiceImagePicker({
  images,
  coverKey,
  onImagesChange,
  onCoverChange,
  disabled = false,
}: {
  images: DraftImage[];
  coverKey: string | null;
  onImagesChange: (next: DraftImage[]) => void;
  onCoverChange: (key: string | null) => void;
  disabled?: boolean;
}) {
  const [errors, setErrors] = useState<string[]>([]);
  const effectiveCoverKey = coverKey ?? images[0]?.key ?? null;

  // Revokes every preview URL still held by this draft the moment its picker
  // unmounts — whether because the draft was removed, the builder closed, or
  // the whole builder remounted on a tenant switch. Individual removals
  // revoke inline (see handleRemove) so this is specifically the "whatever
  // is left when this stops existing" backstop, not the only revoke path.
  const imagesRef = useRef(images);
  useEffect(() => {
    imagesRef.current = images;
  }, [images]);
  useEffect(
    () => () => {
      for (const image of imagesRef.current) URL.revokeObjectURL(image.previewUrl);
    },
    []
  );

  function handleFilesSelected(files: File[]) {
    const { accepted, rejected } = validateImageFiles(images.length, files);

    if (rejected.length > 0) {
      setErrors(rejected.map((r) => `${r.file.name}: ${r.reason}`));
    }
    if (accepted.length === 0) return;

    const nextImages: DraftImage[] = accepted.map((file) => ({
      key: `img-${Math.random().toString(36).slice(2)}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    onImagesChange([...images, ...nextImages]);
  }

  function handleRemove(key: string) {
    const removed = images.find((image) => image.key === key);
    if (removed) URL.revokeObjectURL(removed.previewUrl);
    onImagesChange(images.filter((image) => image.key !== key));
    if (coverKey === key) onCoverChange(null);
  }

  function handleMove(key: string, direction: -1 | 1) {
    const index = images.findIndex((image) => image.key === key);
    const targetIndex = index + direction;
    if (index === -1 || targetIndex < 0 || targetIndex >= images.length) return;

    const next = [...images];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    onImagesChange(next);
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Service Images</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Add photos that customers will see while booking this service.
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Upload up to 5 images. JPG, PNG or WebP. Maximum 5 MB each.
        </p>
      </div>

      {!disabled && (
        <ImageDropzone
          onFilesSelected={handleFilesSelected}
          maxReached={images.length >= 5}
        />
      )}

      {errors.length > 0 && (
        <ul role="alert" className="flex flex-col gap-0.5 text-xs font-medium text-rose-600 dark:text-rose-400">
          {errors.map((message, index) => (
            <li key={index}>{message}</li>
          ))}
        </ul>
      )}

      {images.length > 0 && (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.map((image, index) => {
            const isCover = image.key === effectiveCoverKey;
            return (
              <ImageTile
                key={image.key}
                src={image.previewUrl}
                alt={image.file.name}
                isCover={isCover}
                onSetCover={
                  images.length > 1 && !isCover ? () => onCoverChange(image.key) : undefined
                }
                onRemove={disabled ? undefined : () => handleRemove(image.key)}
                onMoveLeft={
                  !disabled && index > 0 ? () => handleMove(image.key, -1) : undefined
                }
                onMoveRight={
                  !disabled && index < images.length - 1 ? () => handleMove(image.key, 1) : undefined
                }
              />
            );
          })}
        </ul>
      )}
    </div>
  );
}
