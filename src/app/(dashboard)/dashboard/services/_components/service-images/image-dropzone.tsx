"use client";

import { Upload } from "lucide-react";
import { useId, useRef, useState } from "react";
import type { DragEvent } from "react";

import { IMAGE_ACCEPT_ATTRIBUTE } from "@/lib/media/image-validation";

/**
 * The click-to-browse / drag-and-drop target, shared by the pre-creation
 * picker (`add-service-builder/service-image-picker.tsx`) and the existing
 * service's `ServiceImageManager`. Deliberately compact — a `<label>`
 * wrapping a visually-hidden `<input type="file">` rather than a separate
 * button-plus-input pair, so a click or a keyboard activation anywhere in the
 * area opens the file picker with no extra JavaScript wiring.
 *
 * Emits plain `File[]` and does no validation itself — `validateImageFiles`
 * is the caller's job, because only the caller knows how many images already
 * exist to check the count ceiling against.
 */
export function ImageDropzone({
  onFilesSelected,
  disabled = false,
  maxReached = false,
}: {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  maxReached?: boolean;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const isDisabled = disabled || maxReached;

  function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    onFilesSelected(Array.from(fileList));
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDraggingOver(false);
    if (isDisabled) return;
    handleFiles(event.dataTransfer.files);
  }

  return (
    <label
      htmlFor={inputId}
      onDragOver={(event) => {
        event.preventDefault();
        if (!isDisabled) setIsDraggingOver(true);
      }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={handleDrop}
      className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed px-4 py-6 text-center transition-colors ${
        isDisabled
          ? "cursor-not-allowed border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40"
          : isDraggingOver
            ? "cursor-pointer border-brand-500 bg-brand-50 dark:border-brand-500 dark:bg-brand-950/30"
            : "cursor-pointer border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-slate-900"
      }`}
    >
      <Upload
        aria-hidden="true"
        className={`h-5 w-5 ${isDisabled ? "text-slate-300 dark:text-slate-700" : "text-slate-400 dark:text-slate-500"}`}
      />
      {maxReached ? (
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Maximum of 5 images reached.
        </p>
      ) : (
        <>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Drag &amp; drop service images, or click to browse
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            JPG, PNG or WebP • max 5 MB each
          </p>
        </>
      )}
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={IMAGE_ACCEPT_ATTRIBUTE}
        multiple
        disabled={isDisabled}
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
