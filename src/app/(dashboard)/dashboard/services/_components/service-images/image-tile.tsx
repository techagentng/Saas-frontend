"use client";

import { ChevronLeft, ChevronRight, RotateCw, Star, X } from "lucide-react";

/**
 * One grid cell in a service's image gallery — shared by the pre-creation
 * picker (unsaved `File` previews) and the existing-service manager
 * (persisted, server-hosted images). A plain `<img>` rather than
 * `next/image`: these are small, transient dashboard thumbnails (often
 * `blob:` object URLs, which `next/image` cannot optimize anyway), not the
 * performance-sensitive public-facing surface — that's `ServiceImageCarousel`,
 * which does use `next/image`.
 */
export function ImageTile({
  src,
  alt,
  isCover,
  status = "idle",
  errorMessage,
  onSetCover,
  onRemove,
  onRetry,
  onMoveLeft,
  onMoveRight,
}: {
  src: string;
  alt: string;
  isCover: boolean;
  status?: "idle" | "uploading" | "error";
  errorMessage?: string | null;
  /** Absent when this is already the cover, or the caller is read-only. */
  onSetCover?: () => void;
  /** Absent when the caller is read-only. */
  onRemove?: () => void;
  onRetry?: () => void;
  /** Absent at the leftmost/rightmost position, or when there's nothing to reorder. */
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
}) {
  const isBusy = status === "uploading";

  return (
    <li
      className={`group relative aspect-square overflow-hidden rounded-xl border bg-slate-100 dark:bg-slate-900 ${
        status === "error"
          ? "border-rose-300 dark:border-rose-900/60"
          : "border-slate-200 dark:border-slate-800"
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- transient dashboard thumbnail, see file doc comment */}
      <img src={src} alt={alt} className="h-full w-full object-cover" />

      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100" />

      {isCover && (
        <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-slate-900/85 px-2 py-0.5 text-[11px] font-medium text-white">
          <Star aria-hidden="true" className="h-2.5 w-2.5 fill-current" />
          Cover
        </span>
      )}

      {onRemove && !isBusy && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${alt}`}
          className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/70 text-white opacity-0 transition-opacity hover:bg-rose-600 focus-visible:opacity-100 group-hover:opacity-100"
        >
          <X aria-hidden="true" className="h-3.5 w-3.5" />
        </button>
      )}

      {isBusy && (
        <div
          role="status"
          aria-live="polite"
          className="absolute inset-0 flex items-center justify-center bg-slate-950/40 text-xs font-medium text-white"
        >
          Uploading…
        </div>
      )}

      {status === "error" && (
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 bg-rose-950/80 p-1.5">
          <p className="text-[11px] leading-tight text-rose-100">{errorMessage ?? "Upload failed"}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1 self-start text-[11px] font-semibold text-white underline underline-offset-2"
            >
              <RotateCw aria-hidden="true" className="h-3 w-3" />
              Retry
            </button>
          )}
        </div>
      )}

      {!isBusy && status !== "error" && (onSetCover || onMoveLeft || onMoveRight) && (
        <div className="absolute inset-x-1.5 bottom-1.5 flex items-center justify-between gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <div className="flex gap-1">
            {onMoveLeft && (
              <button
                type="button"
                onClick={onMoveLeft}
                aria-label={`Move ${alt} earlier`}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/70 text-white hover:bg-slate-900"
              >
                <ChevronLeft aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
            )}
            {onMoveRight && (
              <button
                type="button"
                onClick={onMoveRight}
                aria-label={`Move ${alt} later`}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/70 text-white hover:bg-slate-900"
              >
                <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {onSetCover && (
            <button
              type="button"
              onClick={onSetCover}
              className="rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-medium text-slate-800 hover:bg-white"
            >
              Set as cover
            </button>
          )}
        </div>
      )}
    </li>
  );
}
