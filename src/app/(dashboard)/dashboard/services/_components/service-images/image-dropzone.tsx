"use client";

import { Upload } from "lucide-react";
import { useId, useRef, useState } from "react";
import type { DragEvent } from "react";

import { IMAGE_ACCEPT_ATTRIBUTE } from "@/lib/media/image-validation";

/**
 * The click-to-browse / drag-and-drop target for a service's single image
 * slot — shared by the pre-creation picker (`add-service-builder/service-image-picker.tsx`)
 * and the existing service's `ServiceImageManager`. Deliberately compact — a
 * `<label>` wrapping a visually-hidden `<input type="file">` rather than a
 * separate button-plus-input pair, so a click or a keyboard activation
 * anywhere in the area opens the file picker with no extra JavaScript wiring.
 *
 * Always single-file: only the first file of a multi-file drop is ever used,
 * since there is exactly one slot to fill. Emits a plain `File` and does no
 * validation itself — `validateSingleImageFile` is the caller's job.
 */
export function ImageDropzone({
  onFileSelected,
  disabled = false,
  hasImage = false,
}: {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
  /** Whether a photo is already set — swaps the copy from "Add" to "Replace". */
  hasImage?: boolean;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    onFileSelected(fileList[0]);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDraggingOver(false);
    if (disabled) return;
    handleFiles(event.dataTransfer.files);
  }

  return (
    <label
      htmlFor={inputId}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setIsDraggingOver(true);
      }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={handleDrop}
      className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed px-4 py-6 text-center transition-colors ${
        disabled
          ? "cursor-not-allowed border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40"
          : isDraggingOver
            ? "cursor-pointer border-brand-500 bg-brand-50 dark:border-brand-500 dark:bg-brand-950/30"
            : "cursor-pointer border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-slate-900"
      }`}
    >
      <Upload
        aria-hidden="true"
        className={`h-5 w-5 ${disabled ? "text-slate-300 dark:text-slate-700" : "text-slate-400 dark:text-slate-500"}`}
      />
      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {hasImage
          ? "Drag & drop to replace the photo, or click to browse"
          : "Drag & drop a photo, or click to browse"}
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400">JPG, PNG or WebP • max 5 MB</p>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={IMAGE_ACCEPT_ATTRIBUTE}
        disabled={disabled}
        onChange={(event) => {
          handleFiles(event.target.files);
          // Reset so selecting the identical file again still fires onChange.
          event.target.value = "";
        }}
        className="sr-only"
      />
    </label>
  );
}
