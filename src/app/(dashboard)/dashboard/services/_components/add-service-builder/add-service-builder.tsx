"use client";

import { useMemo, useState } from "react";

import { Dialog } from "@/components/ui/Dialog";
import { apiErrorMessage } from "@/lib/api/error-messages";
import { MONEY_PARSE_MESSAGES, parseMajorAmountToMinor } from "@/lib/money/money";
import {
  MAX_DURATION_MINUTES,
  MIN_DURATION_MINUTES,
  isValidDurationMinutes,
} from "@/lib/scheduling/duration";
import { useCreateServiceCategory, useServiceCategories } from "@/modules/service-categories/queries";
import type { ServiceCategory } from "@/modules/service-categories/types";
import { listServiceImages, updateServiceImage, uploadServiceImages } from "@/modules/service-images/api";
import { useServiceSuggestions } from "@/modules/service-suggestions/queries";
import type { ServiceSuggestion } from "@/modules/service-suggestions/types";
import { useCreateService } from "@/modules/services/queries";

import { CategoryStep } from "./category-step";
import { CustomizeStep } from "./customize-step";
import { SuggestionStep } from "./suggestion-step";
import type { BuilderStep, CategoryOption, DraftService } from "./types";
import { UNCATEGORIZED_KEY, UNCATEGORIZED_OPTION, buildCategoryOptions, suggestionKey } from "./types";

let draftKeyCounter = 0;
function nextDraftKey(): string {
  draftKeyCounter += 1;
  return `draft-${draftKeyCounter}`;
}

function makeDraft(input: {
  source: DraftService["source"];
  name: string;
  description: string;
  durationMinutes: number;
  categoryKey: string;
}): DraftService {
  return {
    key: nextDraftKey(),
    source: input.source,
    name: input.name,
    description: input.description,
    durationMinutes: input.durationMinutes,
    price: "",
    categoryKey: input.categoryKey,
    status: "editing",
    error: null,
    images: [],
    coverImageKey: null,
    createdServiceId: null,
    imageUploadStatus: "idle",
    imageUploadError: null,
  };
}

function normalize(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Uploads one draft's locally-picked files to its now-real service, in the
 * exact visible order — the backend assigns `sort_order` by that array
 * position and, since this is a brand-new service with no images yet, makes
 * the FIRST file in the batch the cover automatically. If the owner had
 * instead chosen a LATER image as cover, that one extra `is_primary` call
 * corrects it after the fact — cheaper than reordering the upload itself,
 * and it keeps the stored order identical to what the owner actually arranged.
 *
 * Retry-safe by construction: it first asks the server how many images this
 * service already has and only ever sends the remainder of `draft.images`.
 * This is what makes "retry image upload" safe to call blindly after a
 * PARTIAL failure — e.g. the files themselves uploaded fine but the
 * follow-up cover promotion below is what threw — without a naive retry
 * re-uploading (and duplicating) files the first attempt already stored.
 */
async function uploadDraftImages(tenantId: string, serviceId: string, draft: DraftService): Promise<void> {
  if (draft.images.length === 0) return;

  const alreadyUploaded = await listServiceImages(tenantId, serviceId);
  const startIndex = alreadyUploaded.length;
  const remaining = draft.images.slice(startIndex);

  let uploaded: { id: string }[] = [];
  if (remaining.length > 0) {
    const response = await uploadServiceImages(
      tenantId,
      serviceId,
      remaining.map((image) => image.file)
    );
    uploaded = response.images;
  }

  const coverKey = draft.coverImageKey ?? draft.images[0]?.key ?? null;
  const coverIndex = draft.images.findIndex((image) => image.key === coverKey);
  // Index 0 needs no promotion: it's already primary, either automatically
  // (the very first image this service ever received) or from a previous
  // successful call this retry-safety logic is aware of.
  if (coverIndex > 0 && coverIndex >= startIndex) {
    const coverUpload = uploaded[coverIndex - startIndex];
    if (coverUpload) {
      await updateServiceImage(tenantId, serviceId, coverUpload.id, { is_primary: true });
    }
  }
}

const STEP_LABELS: Record<BuilderStep, string> = {
  category: "Step 1 of 3 — Choose category",
  suggestions: "Step 2 of 3 — Choose services",
  customize: "Step 3 of 3 — Customize & create",
};

/**
 * The interactive Add Service builder (SC1): Choose category → Choose
 * suggested services → Customize → Create.
 *
 * Lives entirely behind the existing "Add service" control in
 * `ServiceCatalog` — no second page, no second shell. `tenantId`/`currency`
 * come from the same `currentTenant` the Services page already resolved, so
 * there is no independent tenant or currency lookup here to drift from it.
 *
 * Category and suggestion data are fetched fresh every time this mounts;
 * giving this component `key={tenantId}` at the call site (see
 * `service-catalog.tsx`) is what actually guarantees a tenant switch can
 * never leave a previous workspace's selection or drafts on screen — a prop
 * change alone would update `tenantId` without discarding this component's
 * own step/draft state.
 */
export function AddServiceBuilder({
  tenantId,
  currency,
  onClose,
}: {
  tenantId: string;
  currency: string;
  onClose: () => void;
}) {
  const suggestionsQuery = useServiceSuggestions(tenantId);
  const categoriesQuery = useServiceCategories(tenantId, "ACTIVE");
  const createCategory = useCreateServiceCategory(tenantId);
  const createService = useCreateService(tenantId);

  const [step, setStep] = useState<BuilderStep>("category");
  const [selectedCategory, setSelectedCategory] = useState<CategoryOption | null>(null);
  const [selectedSuggestionKeys, setSelectedSuggestionKeys] = useState<Set<string>>(new Set());
  const [stepTwoCustomDrafts, setStepTwoCustomDrafts] = useState<DraftService[]>([]);
  const [drafts, setDrafts] = useState<DraftService[]>([]);
  const [createdCategories, setCreatedCategories] = useState<ServiceCategory[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const suggestions = useMemo(() => suggestionsQuery.data ?? [], [suggestionsQuery.data]);
  const allCategories = useMemo(
    () => [...(categoriesQuery.data ?? []), ...createdCategories],
    [categoriesQuery.data, createdCategories]
  );

  const categoryOptions = useMemo(
    () => buildCategoryOptions(suggestions, allCategories),
    [suggestions, allCategories]
  );
  const customizeCategoryOptions = useMemo(
    () => [...categoryOptions, UNCATEGORIZED_OPTION],
    [categoryOptions]
  );

  const suggestionsForSelectedCategory = useMemo(() => {
    if (!selectedCategory) return [];
    const norm = normalize(selectedCategory.name);
    return suggestions.filter((s) => normalize(s.category) === norm);
  }, [suggestions, selectedCategory]);

  function handleSelectCategory(option: CategoryOption) {
    setSelectedCategory(option);
    setSelectedSuggestionKeys(new Set());
    setStepTwoCustomDrafts([]);
    setStep("suggestions");
  }

  function handleCategoryCreated(category: ServiceCategory) {
    setCreatedCategories((prev) => [...prev, category]);
    handleSelectCategory({
      key: category.id,
      name: category.name,
      suggestionCount: 0,
      existingCategoryId: category.id,
    });
  }

  function handleToggleSuggestion(suggestion: ServiceSuggestion) {
    const key = suggestionKey(suggestion);
    setSelectedSuggestionKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function handleAddCustomServiceInSuggestions(name: string) {
    if (!selectedCategory) return;
    setStepTwoCustomDrafts((prev) => [
      ...prev,
      makeDraft({
        source: "custom",
        name,
        description: "",
        durationMinutes: 60,
        categoryKey: selectedCategory.key,
      }),
    ]);
  }

  function handleContinueToCustomize() {
    const fromSuggestions = suggestionsForSelectedCategory
      .filter((s) => selectedSuggestionKeys.has(suggestionKey(s)))
      .map((s) =>
        makeDraft({
          source: "suggestion",
          name: s.name,
          description: s.description,
          durationMinutes: s.suggested_duration_minutes,
          categoryKey: selectedCategory!.key,
        })
      );
    setDrafts([...fromSuggestions, ...stepTwoCustomDrafts]);
    setSubmitError(null);
    setStep("customize");
  }

  function handleDraftChange(key: string, patch: Partial<DraftService>) {
    setDrafts((prev) => prev.map((d) => (d.key === key ? { ...d, ...patch, error: null } : d)));
  }

  function handleDraftRemove(key: string) {
    setDrafts((prev) => prev.filter((d) => d.key !== key));
  }

  async function handleSubmit() {
    setSubmitError(null);

    let hasValidationError = false;
    const validated = drafts.map((draft) => {
      if (draft.status === "created") return draft;

      const trimmedName = draft.name.trim();
      const parsedPrice = parseMajorAmountToMinor(draft.price);
      let error: string | null = null;
      if (trimmedName === "") error = "Enter a service name.";
      else if (!isValidDurationMinutes(draft.durationMinutes)) {
        error = `Enter a duration between ${MIN_DURATION_MINUTES} and ${MAX_DURATION_MINUTES} minutes.`;
      } else if (!parsedPrice.ok) error = MONEY_PARSE_MESSAGES[parsedPrice.error];

      if (error) hasValidationError = true;
      return { ...draft, error };
    });
    setDrafts(validated);
    if (hasValidationError || validated.length === 0) return;

    setIsSubmitting(true);

    // Resolve every category a not-yet-created draft references, creating
    // each distinct pending one exactly once — never per-draft.
    const pendingKeys = new Set(
      validated.filter((d) => d.status !== "created").map((d) => d.categoryKey)
    );
    const resolvedCategoryIds = new Map<string, string | null>();
    resolvedCategoryIds.set(UNCATEGORIZED_KEY, null);
    for (const option of categoryOptions) {
      if (option.existingCategoryId) resolvedCategoryIds.set(option.key, option.existingCategoryId);
    }

    const categoryErrors = new Map<string, string>();

    for (const key of pendingKeys) {
      if (resolvedCategoryIds.has(key)) continue;
      const option = categoryOptions.find((o) => o.key === key);
      if (!option) continue;

      // A fresh, race-safe check: if a matching ACTIVE category was created
      // (by this session or another) since this builder last loaded, reuse
      // it rather than creating a duplicate.
      const freshMatch = (categoriesQuery.data ?? []).find(
        (c) => c.status === "ACTIVE" && normalize(c.name) === normalize(option.name)
      );
      if (freshMatch) {
        resolvedCategoryIds.set(key, freshMatch.id);
        continue;
      }

      try {
        const created = await createCategory.mutateAsync({ name: option.name });
        setCreatedCategories((prev) => [...prev, created]);
        resolvedCategoryIds.set(key, created.id);
      } catch (err) {
        categoryErrors.set(key, apiErrorMessage(err));
      }
    }

    let succeeded = 0;
    let working = validated;

    for (const draft of validated) {
      if (draft.status === "created") {
        succeeded += 1;
        continue;
      }

      const categoryError = categoryErrors.get(draft.categoryKey);
      if (categoryError) {
        working = working.map((d) =>
          d.key === draft.key
            ? { ...d, status: "editing", error: `Category couldn't be created: ${categoryError}` }
            : d
        );
        setDrafts(working);
        continue;
      }

      working = working.map((d) => (d.key === draft.key ? { ...d, status: "creating" } : d));
      setDrafts(working);

      const parsedPrice = parseMajorAmountToMinor(draft.price);
      let createdServiceId: string | null = null;
      try {
        const created = await createService.mutateAsync({
          name: draft.name.trim(),
          description: draft.description.trim() === "" ? null : draft.description.trim(),
          duration_minutes: draft.durationMinutes,
          price_minor: parsedPrice.ok ? parsedPrice.minor : 0,
          category_id: resolvedCategoryIds.get(draft.categoryKey) ?? null,
        });
        createdServiceId = created.id;
        succeeded += 1;
        working = working.map((d) =>
          d.key === draft.key ? { ...d, status: "created", error: null, createdServiceId: created.id } : d
        );
      } catch (err) {
        working = working.map((d) =>
          d.key === draft.key ? { ...d, status: "editing", error: apiErrorMessage(err) } : d
        );
      }
      setDrafts(working);

      // The service exists now — a failure from here on must never trigger
      // another createService call. `createdServiceId` is what makes that
      // true: it is set once, above, and reused by every retry.
      if (createdServiceId && draft.images.length > 0) {
        working = working.map((d) =>
          d.key === draft.key ? { ...d, imageUploadStatus: "uploading" } : d
        );
        setDrafts(working);
        try {
          await uploadDraftImages(tenantId, createdServiceId, draft);
          working = working.map((d) =>
            d.key === draft.key ? { ...d, imageUploadStatus: "done" } : d
          );
        } catch (err) {
          working = working.map((d) =>
            d.key === draft.key
              ? { ...d, imageUploadStatus: "error", imageUploadError: apiErrorMessage(err) }
              : d
          );
        }
        setDrafts(working);
      } else if (createdServiceId) {
        working = working.map((d) =>
          d.key === draft.key ? { ...d, imageUploadStatus: "done" } : d
        );
      }
    }

    setIsSubmitting(false);

    const anyImageUploadFailed = working.some((d) => d.imageUploadStatus === "error");
    if (succeeded === validated.length && !anyImageUploadFailed) {
      onClose();
      return;
    }

    if (succeeded === validated.length && anyImageUploadFailed) {
      setSubmitError(
        "Service created, but some images could not be uploaded. Retry the image upload below, or close to keep the service as it is."
      );
      return;
    }

    setSubmitError(
      `${succeeded} of ${validated.length} service${validated.length === 1 ? "" : "s"} created. Fix the highlighted rows and try again, or close to keep what was created.`
    );
  }

  /**
   * Retries only the image upload for one already-created draft — never
   * calls `createService` again. `draft.createdServiceId` is the guarantee:
   * it exists only after that draft's service was actually created, so this
   * function has no path that could create a duplicate.
   */
  async function handleRetryImageUpload(key: string) {
    const draft = drafts.find((d) => d.key === key);
    if (!draft || !draft.createdServiceId) return;

    setDrafts((prev) =>
      prev.map((d) => (d.key === key ? { ...d, imageUploadStatus: "uploading", imageUploadError: null } : d))
    );
    try {
      await uploadDraftImages(tenantId, draft.createdServiceId, draft);
      setDrafts((prev) => prev.map((d) => (d.key === key ? { ...d, imageUploadStatus: "done" } : d)));
    } catch (err) {
      setDrafts((prev) =>
        prev.map((d) =>
          d.key === key ? { ...d, imageUploadStatus: "error", imageUploadError: apiErrorMessage(err) } : d
        )
      );
    }
  }

  const isLoading = suggestionsQuery.isPending || categoriesQuery.isPending;
  const isLoadError = suggestionsQuery.isError || categoriesQuery.isError;
  const remainingDraftCount = drafts.filter((d) => d.status !== "created").length;

  return (
    <Dialog title="Add service" description={STEP_LABELS[step]} onClose={onClose} size="xl" footer={
      <BuilderFooter
        step={step}
        canContinue={selectedSuggestionKeys.size > 0 || stepTwoCustomDrafts.length > 0}
        isSubmitting={isSubmitting}
        draftCount={remainingDraftCount}
        onBack={() => setStep(step === "customize" ? "suggestions" : "category")}
        onContinue={handleContinueToCustomize}
        onSubmit={handleSubmit}
        onClose={onClose}
      />
    }>
      {isLoading && (
        <div role="status" aria-live="polite" className="py-10 text-center">
          <span className="text-sm text-slate-500 dark:text-slate-400">Loading…</span>
        </div>
      )}

      {isLoadError && !isLoading && (
        <div role="alert" className="flex flex-col items-start gap-3">
          <p className="text-sm text-rose-700 dark:text-rose-300">
            {apiErrorMessage(suggestionsQuery.error ?? categoriesQuery.error)}
          </p>
          <button
            type="button"
            onClick={() => {
              suggestionsQuery.refetch();
              categoriesQuery.refetch();
            }}
            className="btn-secondary h-9 px-3.5 text-sm"
          >
            Try again
          </button>
        </div>
      )}

      {!isLoading && !isLoadError && step === "category" && (
        <CategoryStep
          tenantId={tenantId}
          options={categoryOptions}
          selectedKey={selectedCategory?.key ?? null}
          onSelect={handleSelectCategory}
          onCategoryCreated={handleCategoryCreated}
        />
      )}

      {!isLoading && !isLoadError && step === "suggestions" && selectedCategory && (
        <SuggestionStep
          categoryName={selectedCategory.name}
          suggestions={suggestionsForSelectedCategory}
          selectedKeys={selectedSuggestionKeys}
          onToggle={handleToggleSuggestion}
          customDraftCount={stepTwoCustomDrafts.length}
          onAddCustomService={handleAddCustomServiceInSuggestions}
        />
      )}

      {!isLoading && !isLoadError && step === "customize" && (
        <>
          <CustomizeStep
            currency={currency}
            drafts={drafts}
            categoryOptions={customizeCategoryOptions}
            onChange={handleDraftChange}
            onRemove={handleDraftRemove}
            onRetryImageUpload={handleRetryImageUpload}
          />
          {submitError && (
            <p
              role="alert"
              className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300"
            >
              {submitError}
            </p>
          )}
        </>
      )}
    </Dialog>
  );
}

function BuilderFooter({
  step,
  canContinue,
  isSubmitting,
  draftCount,
  onBack,
  onContinue,
  onSubmit,
  onClose,
}: {
  step: BuilderStep;
  canContinue: boolean;
  isSubmitting: boolean;
  draftCount: number;
  onBack: () => void;
  onContinue: () => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  return (
    <>
      {step === "category" ? (
        <button type="button" onClick={onClose} className="btn-secondary h-10 px-4 text-sm">
          Cancel
        </button>
      ) : (
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="btn-secondary h-10 px-4 text-sm disabled:opacity-60"
        >
          Back
        </button>
      )}

      {step === "suggestions" && (
        <button
          type="button"
          onClick={onContinue}
          disabled={!canContinue}
          className="btn-primary h-10 px-4 text-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          Continue
        </button>
      )}

      {step === "customize" && (
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting || draftCount === 0}
          className="btn-primary h-10 px-4 text-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting
            ? "Creating…"
            : `Create ${draftCount} ${draftCount === 1 ? "service" : "services"}`}
        </button>
      )}
    </>
  );
}
