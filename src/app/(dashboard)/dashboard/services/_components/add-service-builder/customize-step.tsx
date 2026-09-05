"use client";

import { useId } from "react";

import { fieldInputClass } from "@/components/ui/field";
import { currencyPrefix } from "@/lib/money/currency";
import { formatDuration, isValidDurationMinutes } from "@/lib/scheduling/duration";

import { ServiceImagePicker } from "./service-image-picker";
import type { CategoryOption, DraftService } from "./types";

/**
 * Step 3: one editable card per selected/custom service. Suggested values
 * only ever prefilled `name`/`description`/`durationMinutes` at the moment a
 * draft was created (see `add-service-builder.tsx`) — from here on every
 * field, including category, is plain editable state, and price starts (and
 * stays, until typed) empty because no suggestion carries a price.
 */
export function CustomizeStep({
  currency,
  drafts,
  categoryOptions,
  onChange,
  onRemove,
  onRetryImageUpload,
}: {
  currency: string;
  drafts: DraftService[];
  categoryOptions: CategoryOption[];
  onChange: (key: string, patch: Partial<DraftService>) => void;
  onRemove: (key: string) => void;
  onRetryImageUpload: (key: string) => void;
}) {
  if (drafts.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-400">
        Nothing selected yet. Go back and choose at least one service.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
          Customize before creating
        </h3>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Adjust anything, and set the price — priced in {currency}.
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {drafts.map((draft) => (
          <DraftCard
            key={draft.key}
            draft={draft}
            currency={currency}
            categoryOptions={categoryOptions}
            onChange={(patch) => onChange(draft.key, patch)}
            onRemove={() => onRemove(draft.key)}
            onRetryImageUpload={() => onRetryImageUpload(draft.key)}
          />
        ))}
      </ul>
    </div>
  );
}

function DraftCard({
  draft,
  currency,
  categoryOptions,
  onChange,
  onRemove,
  onRetryImageUpload,
}: {
  draft: DraftService;
  currency: string;
  categoryOptions: CategoryOption[];
  onChange: (patch: Partial<DraftService>) => void;
  onRemove: () => void;
  onRetryImageUpload: () => void;
}) {
  const nameId = useId();
  const descriptionId = useId();
  const durationId = useId();
  const priceId = useId();
  const categoryId = useId();

  const isCreated = draft.status === "created";
  const isBusy = draft.status === "creating" || isCreated;
  const durationInvalid = !isValidDurationMinutes(draft.durationMinutes);

  return (
    <li
      className={`card flex flex-col gap-3 p-4 ${isCreated ? "border-emerald-300 bg-emerald-50/60 dark:border-emerald-900/50 dark:bg-emerald-950/20" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="rounded-full border border-slate-200 px-2 py-0.5 text-xs font-medium text-slate-500 dark:border-slate-700 dark:text-slate-400">
          {draft.source === "suggestion" ? "Suggested" : "Custom"}
        </span>
        {isCreated ? (
          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
            Created
          </span>
        ) : (
          <button
            type="button"
            onClick={onRemove}
            disabled={isBusy}
            aria-label={`Remove ${draft.name || "this service"}`}
            className="text-xs font-medium text-slate-500 hover:text-rose-600 disabled:opacity-50 dark:text-slate-400 dark:hover:text-rose-400"
          >
            Remove
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor={nameId} className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Name
          </label>
          <input
            id={nameId}
            type="text"
            required
            value={draft.name}
            disabled={isBusy}
            onChange={(event) => onChange({ name: event.target.value })}
            className={fieldInputClass}
          />
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label
            htmlFor={descriptionId}
            className="text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Description
          </label>
          <textarea
            id={descriptionId}
            rows={2}
            value={draft.description}
            disabled={isBusy}
            onChange={(event) => onChange({ description: event.target.value })}
            className={`${fieldInputClass} resize-y`}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={durationId}
            className="text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Duration (minutes)
          </label>
          <input
            id={durationId}
            type="number"
            inputMode="numeric"
            min={1}
            max={480}
            value={Number.isNaN(draft.durationMinutes) ? "" : draft.durationMinutes}
            disabled={isBusy}
            aria-invalid={durationInvalid ? true : undefined}
            onChange={(event) =>
              onChange({
                durationMinutes: event.target.value === "" ? NaN : Number(event.target.value),
              })
            }
            className={fieldInputClass}
          />
          {!durationInvalid && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {formatDuration(draft.durationMinutes)}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={categoryId} className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Category
          </label>
          <select
            id={categoryId}
            value={draft.categoryKey}
            disabled={isBusy}
            onChange={(event) => onChange({ categoryKey: event.target.value })}
            className={fieldInputClass}
          >
            {categoryOptions.map((option) => (
              <option key={option.key} value={option.key}>
                {option.name}
                {!option.existingCategoryId && option.key !== "__uncategorized__"
                  ? " (will be created)"
                  : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor={priceId} className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Price
          </label>
          <div className="flex items-stretch">
            <span
              aria-hidden="true"
              className="inline-flex shrink-0 items-center rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
            >
              {currencyPrefix(currency).trim() || currency}
            </span>
            <input
              id={priceId}
              type="text"
              inputMode="decimal"
              required
              value={draft.price}
              disabled={isBusy}
              placeholder="0.00"
              onChange={(event) => onChange({ price: event.target.value })}
              className={`${fieldInputClass} rounded-l-none`}
            />
          </div>
        </div>
      </div>

      <ServiceImagePicker
        images={draft.images}
        coverKey={draft.coverImageKey}
        onImagesChange={(images) => onChange({ images })}
        onCoverChange={(coverImageKey) => onChange({ coverImageKey })}
        disabled={isBusy}
      />

      {isCreated && draft.imageUploadStatus !== "idle" && (
        <ImageUploadStatusBanner
          status={draft.imageUploadStatus}
          error={draft.imageUploadError}
          onRetry={onRetryImageUpload}
        />
      )}

      {draft.error && (
        <p role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-400">
          {draft.error}
        </p>
      )}
    </li>
  );
}

function ImageUploadStatusBanner({
  status,
  error,
  onRetry,
}: {
  status: DraftService["imageUploadStatus"];
  error: string | null;
  onRetry: () => void;
}) {
  if (status === "uploading") {
    return (
      <p role="status" aria-live="polite" className="text-xs font-medium text-slate-500 dark:text-slate-400">
        Uploading images…
      </p>
    );
  }

  if (status === "error") {
    return (
      <div role="alert" className="flex flex-wrap items-center gap-2 text-xs font-medium text-rose-600 dark:text-rose-400">
        <span>
          Service created, but some images could not be uploaded
          {error ? `: ${error}` : "."}
        </span>
        <button type="button" onClick={onRetry} className="underline underline-offset-2">
          Retry image upload
        </button>
      </div>
    );
  }

  return null;
}
