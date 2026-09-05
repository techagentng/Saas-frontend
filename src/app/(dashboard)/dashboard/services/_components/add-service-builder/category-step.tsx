"use client";

import { useId, useState } from "react";
import type { FormEvent } from "react";

import { fieldInputClass } from "@/components/ui/field";
import { apiErrorMessage } from "@/lib/api/error-messages";
import { useCreateServiceCategory } from "@/modules/service-categories/queries";
import type { ServiceCategory } from "@/modules/service-categories/types";

import type { CategoryOption } from "./types";

/**
 * Step 1: pick a category to build under.
 *
 * Every tile comes from `buildCategoryOptions` — real suggestion data plus
 * the tenant's own real categories, never a hardcoded list. Selecting a tile
 * that already has a real `existingCategoryId` means Step 4 will reuse it;
 * selecting a suggestion-only tile means Step 4 creates it once, the first
 * time a service is actually persisted under it.
 */
export function CategoryStep({
  tenantId,
  options,
  selectedKey,
  onSelect,
  onCategoryCreated,
}: {
  tenantId: string;
  options: CategoryOption[];
  selectedKey: string | null;
  onSelect: (option: CategoryOption) => void;
  /** Fires once a custom category is actually persisted, so the builder can select it and move on. */
  onCategoryCreated: (category: ServiceCategory) => void;
}) {
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
          Choose a category
        </h3>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Start from a suggested category, or one you&apos;ve already set up.
        </p>
      </div>

      {options.length === 0 && !isCreatingCategory && (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No suggestions are available for this workspace yet. Create a custom category to get
          started.
        </p>
      )}

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {options.map((option) => {
          const isSelected = option.key === selectedKey;
          return (
            <button
              key={option.key}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelect(option)}
              className={`flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition-colors ${
                isSelected
                  ? "border-brand-600 bg-brand-50 dark:border-brand-500 dark:bg-brand-950/30"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900"
              }`}
            >
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                {option.name}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {option.suggestionCount > 0
                  ? `${option.suggestionCount} suggested ${option.suggestionCount === 1 ? "service" : "services"}`
                  : option.existingCategoryId
                    ? "Your category"
                    : "No suggestions yet"}
              </span>
            </button>
          );
        })}

        {!isCreatingCategory && (
          <button
            type="button"
            onClick={() => setIsCreatingCategory(true)}
            className="flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-300 p-4 text-sm font-medium text-slate-600 transition-colors hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
          >
            + Create custom category
          </button>
        )}
      </div>

      {isCreatingCategory && (
        <CustomCategoryForm
          tenantId={tenantId}
          onCancel={() => setIsCreatingCategory(false)}
          onCreated={(category) => {
            setIsCreatingCategory(false);
            onCategoryCreated(category);
          }}
        />
      )}
    </div>
  );
}

function CustomCategoryForm({
  tenantId,
  onCancel,
  onCreated,
}: {
  tenantId: string;
  onCancel: () => void;
  onCreated: (category: ServiceCategory) => void;
}) {
  const createCategory = useCreateServiceCategory(tenantId);
  const nameId = useId();
  const sortOrderId = useId();

  const [name, setName] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (trimmedName === "") {
      setError("Enter a category name.");
      return;
    }

    const parsedSortOrder = sortOrder.trim() === "" ? undefined : Number(sortOrder);
    if (parsedSortOrder !== undefined && !Number.isInteger(parsedSortOrder)) {
      setError("Sort order must be a whole number.");
      return;
    }

    try {
      const created = await createCategory.mutateAsync({
        name: trimmedName,
        sort_order: parsedSortOrder,
      });
      onCreated(created);
    } catch (err) {
      setError(
        apiErrorMessage(err, {
          VALIDATION_FAILED: "Check the category name and try again.",
        })
      );
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60"
      noValidate
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor={nameId} className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Category name
        </label>
        <input
          id={nameId}
          type="text"
          required
          maxLength={120}
          value={name}
          placeholder="Nail Art"
          disabled={createCategory.isPending}
          onChange={(event) => {
            setName(event.target.value);
            setError(null);
          }}
          className={fieldInputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={sortOrderId}
          className="text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Sort order <span className="text-xs font-normal text-slate-400">(optional)</span>
        </label>
        <input
          id={sortOrderId}
          type="number"
          step={1}
          value={sortOrder}
          disabled={createCategory.isPending}
          onChange={(event) => setSortOrder(event.target.value)}
          className={`${fieldInputClass} w-28`}
        />
      </div>

      {error && (
        <p role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-400">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={createCategory.isPending}
          className="btn-secondary h-9 px-3.5 text-sm disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={createCategory.isPending}
          className="btn-primary h-9 px-3.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          {createCategory.isPending ? "Creating…" : "Create category"}
        </button>
      </div>
    </form>
  );
}
