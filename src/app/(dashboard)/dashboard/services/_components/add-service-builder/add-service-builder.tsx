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
import { useVerticalExperience } from "@/lib/vertical/use-vertical-experience";
import { useCreateServiceCategory, useServiceCategories } from "@/modules/service-categories/queries";
import type { ServiceCategory } from "@/modules/service-categories/types";
import { listServiceImages, uploadServiceImages } from "@/modules/service-images/api";
import { useServiceSuggestions } from "@/modules/service-suggestions/queries";
import type { ServiceSuggestion } from "@/modules/service-suggestions/types";
import { useCreateService } from "@/modules/services/queries";
import { replaceServiceStaff } from "@/modules/staff/api";

import { CategoryStep } from "./category-step";
import { CustomizeStep } from "./customize-step";
import { SuggestionStep } from "./suggestion-step";
import { TechnicianStep } from "./technician-step";
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
    image: null,
    createdServiceId: null,
    imageUploadStatus: "idle",
    imageUploadError: null,
    technicianIds: [],
    technicianAssignStatus: "idle",
    technicianAssignError: null,
  };
}

function normalize(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Field-level validation for one not-yet-created draft, shared by
 * `handleContinueToTechnicians` and `handleSubmit` — a draft must pass this
 * before moving on to technician assignment OR before being created, so a
 * vertical with the technicians step never lets an owner spend time picking
 * technicians for a draft that will fail validation moments later anyway.
 */
function validateDraftFields(draft: DraftService): string | null {
  const trimmedName = draft.name.trim();
  const parsedPrice = parseMajorAmountToMinor(draft.price);
  if (trimmedName === "") return "Enter a service name.";
  if (!isValidDurationMinutes(draft.durationMinutes)) {
    return `Enter a duration between ${MIN_DURATION_MINUTES} and ${MAX_DURATION_MINUTES} minutes.`;
  }
  if (!parsedPrice.ok) return MONEY_PARSE_MESSAGES[parsedPrice.error];
  return null;
}

/**
 * Uploads one draft's locally-picked photo to its now-real service. Since
 * this is a brand-new service with no images yet, the backend makes this
 * single upload primary automatically.
 *
 * Retry-safe by construction: it first asks the server whether the photo is
 * already there and skips the upload if so. This is what makes "retry image
 * upload" safe to call blindly after a PARTIAL failure — e.g. the service
 * itself was created but the image upload is what threw — without a naive
 * retry re-uploading (and duplicating) a file the first attempt already
 * stored.
 */
async function uploadDraftImages(tenantId: string, serviceId: string, draft: DraftService): Promise<void> {
  if (!draft.image) return;

  const alreadyUploaded = await listServiceImages(tenantId, serviceId);
  if (alreadyUploaded.length > 0) return;

  await uploadServiceImages(tenantId, serviceId, [draft.image.file]);
}

/**
 * Assigns one draft's locally-picked technicians to its now-real service
 * (SC2). Uses `replaceServiceStaff` directly rather than the
 * `useReplaceServiceStaff` mutation hook, the same reasoning
 * `uploadDraftImages` above calls the image API functions directly: hooks
 * cannot be called conditionally or in the per-draft loop `handleSubmit`
 * runs, only at the top of a component.
 *
 * No idempotency check is needed the way `uploadDraftImages` needs one for
 * images: replacing a service's technician set is itself idempotent — the
 * backend contract is "make this the current set," so calling it again with
 * the same ids after a retry changes nothing.
 */
async function assignDraftTechnicians(tenantId: string, serviceId: string, draft: DraftService): Promise<void> {
  if (draft.technicianIds.length === 0) return;
  await replaceServiceStaff(tenantId, serviceId, draft.technicianIds);
}

const STEP_TITLES: Record<BuilderStep, string> = {
  category: "Choose category",
  suggestions: "Choose services",
  customize: "Customize",
  technicians: "Assign technicians & create",
};

/**
 * The step count and the "& create" suffix both depend on whether this
 * vertical has a technicians step at all — a vertical without
 * `staffServiceCapabilities` never sees step 4, so "customize" stays the
 * final, create-triggering step for it, exactly as before SC2.
 */
function stepLabel(step: BuilderStep, hasTechnicianStep: boolean): string {
  const totalSteps = hasTechnicianStep ? 4 : 3;
  const stepNumbers: Record<BuilderStep, number> = { category: 1, suggestions: 2, customize: 3, technicians: 4 };
  const title = step === "customize" && !hasTechnicianStep ? "Customize & create" : STEP_TITLES[step];
  return `Step ${stepNumbers[step]} of ${totalSteps} — ${title}`;
}

/** The step `onBack` returns to, one level up from `step`. */
function previousStep(step: BuilderStep): BuilderStep {
  switch (step) {
    case "suggestions":
      return "category";
    case "customize":
      return "suggestions";
    case "technicians":
      return "customize";
    case "category":
      return "category";
  }
}

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
  // Only the nail-technician vertical has staff_services at all — every other
  // vertical keeps the exact pre-SC2 3-step flow, with "customize" as the
  // final, create-triggering step. No data is fetched for the technicians
  // step unless this is true (TechnicianStep's own useStaffList call never
  // even mounts otherwise).
  const hasTechnicianStep = useVerticalExperience().capabilities.staffServiceCapabilities;

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

  /**
   * "Continue" from customize -> technicians (only reachable when
   * `hasTechnicianStep`). Runs the exact same field validation `handleSubmit`
   * runs before creating anything, so an owner never spends time picking
   * technicians for a draft that would fail moments later anyway — but does
   * NOT create services or touch the network itself.
   */
  function handleContinueToTechnicians() {
    const validated = drafts.map((draft) =>
      draft.status === "created" ? draft : { ...draft, error: validateDraftFields(draft) }
    );
    setDrafts(validated);
    if (validated.some((d) => d.error) || validated.length === 0) return;
    setSubmitError(null);
    setStep("technicians");
  }

  /**
   * `source` defaults to the `drafts` state, but `handleSkipTechniciansAndSubmit`
   * passes an explicit, already-cleared list instead — `setDrafts` is async,
   * so reading the `drafts` closure right after calling it would still see
   * the pre-clear technician selections.
   */
  async function handleSubmit(source: DraftService[] = drafts) {
    setSubmitError(null);

    const validated = source.map((draft) =>
      draft.status === "created" ? draft : { ...draft, error: validateDraftFields(draft) }
    );
    setDrafts(validated);
    if (validated.some((d) => d.error) || validated.length === 0) return;

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
      if (createdServiceId && draft.image) {
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

      // Same guarantee as images above: createdServiceId being set is what
      // makes this retry-safe, and a failure here must never delete or
      // recreate the service — see the SC2 doc comment on
      // assignDraftTechnicians. An empty technicianIds set is a legitimate
      // "skipped" state, not a failure.
      if (createdServiceId && draft.technicianIds.length > 0) {
        working = working.map((d) =>
          d.key === draft.key ? { ...d, technicianAssignStatus: "assigning" } : d
        );
        setDrafts(working);
        try {
          await assignDraftTechnicians(tenantId, createdServiceId, draft);
          working = working.map((d) =>
            d.key === draft.key ? { ...d, technicianAssignStatus: "done" } : d
          );
        } catch (err) {
          working = working.map((d) =>
            d.key === draft.key
              ? { ...d, technicianAssignStatus: "error", technicianAssignError: apiErrorMessage(err) }
              : d
          );
        }
        setDrafts(working);
      } else if (createdServiceId) {
        working = working.map((d) =>
          d.key === draft.key ? { ...d, technicianAssignStatus: "done" } : d
        );
      }
    }

    setIsSubmitting(false);

    const anyImageUploadFailed = working.some((d) => d.imageUploadStatus === "error");
    const anyTechnicianAssignFailed = working.some((d) => d.technicianAssignStatus === "error");
    if (succeeded === validated.length && !anyImageUploadFailed && !anyTechnicianAssignFailed) {
      onClose();
      return;
    }

    if (succeeded === validated.length && (anyImageUploadFailed || anyTechnicianAssignFailed)) {
      const failures = [
        anyImageUploadFailed && "some images could not be uploaded",
        anyTechnicianAssignFailed && "some technician assignments failed",
      ].filter(Boolean);
      setSubmitError(
        `Service created, but ${failures.join(" and ")}. Retry below, or close to keep the service as it is.`
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

  /**
   * Retries only the technician assignment for one already-created draft —
   * never calls `createService` again, mirroring `handleRetryImageUpload`.
   */
  async function handleRetryTechnicianAssignment(key: string) {
    const draft = drafts.find((d) => d.key === key);
    if (!draft || !draft.createdServiceId) return;

    setDrafts((prev) =>
      prev.map((d) => (d.key === key ? { ...d, technicianAssignStatus: "assigning", technicianAssignError: null } : d))
    );
    try {
      await assignDraftTechnicians(tenantId, draft.createdServiceId, draft);
      setDrafts((prev) => prev.map((d) => (d.key === key ? { ...d, technicianAssignStatus: "done" } : d)));
    } catch (err) {
      setDrafts((prev) =>
        prev.map((d) =>
          d.key === key
            ? { ...d, technicianAssignStatus: "error", technicianAssignError: apiErrorMessage(err) }
            : d
        )
      );
    }
  }

  /**
   * "Skip for now" on the technicians step (SC2 spec): clears any selections
   * made before deciding to skip, then creates every remaining draft exactly
   * as if none had been made — an empty technicianIds set is what
   * `handleSubmit`'s per-draft loop already treats as "assign nothing, mark
   * done," so this needs no separate code path in `handleSubmit` itself.
   */
  function handleSkipTechniciansAndSubmit() {
    const cleared = drafts.map((d) => (d.status === "created" ? d : { ...d, technicianIds: [] }));
    setDrafts(cleared);
    void handleSubmit(cleared);
  }

  const isLoading = suggestionsQuery.isPending || categoriesQuery.isPending;
  const isLoadError = suggestionsQuery.isError || categoriesQuery.isError;
  const remainingDraftCount = drafts.filter((d) => d.status !== "created").length;

  return (
    <Dialog title="Add service" description={stepLabel(step, hasTechnicianStep)} onClose={onClose} size="xl" footer={
      <BuilderFooter
        step={step}
        hasTechnicianStep={hasTechnicianStep}
        canContinue={selectedSuggestionKeys.size > 0 || stepTwoCustomDrafts.length > 0}
        isSubmitting={isSubmitting}
        draftCount={remainingDraftCount}
        onBack={() => setStep(previousStep(step))}
        onContinue={handleContinueToCustomize}
        onContinueToTechnicians={handleContinueToTechnicians}
        onSubmit={handleSubmit}
        onSkipTechnicians={handleSkipTechniciansAndSubmit}
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
          {submitError && <SubmitErrorBanner message={submitError} />}
        </>
      )}

      {!isLoading && !isLoadError && step === "technicians" && (
        <>
          <TechnicianStep
            tenantId={tenantId}
            drafts={drafts}
            onChange={handleDraftChange}
            onRetryImageUpload={handleRetryImageUpload}
            onRetryTechnicianAssignment={handleRetryTechnicianAssignment}
          />
          {submitError && <SubmitErrorBanner message={submitError} />}
        </>
      )}
    </Dialog>
  );
}

function SubmitErrorBanner({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300"
    >
      {message}
    </p>
  );
}

function BuilderFooter({
  step,
  hasTechnicianStep,
  canContinue,
  isSubmitting,
  draftCount,
  onBack,
  onContinue,
  onContinueToTechnicians,
  onSubmit,
  onSkipTechnicians,
  onClose,
}: {
  step: BuilderStep;
  hasTechnicianStep: boolean;
  canContinue: boolean;
  isSubmitting: boolean;
  draftCount: number;
  onBack: () => void;
  onContinue: () => void;
  onContinueToTechnicians: () => void;
  onSubmit: () => void;
  onSkipTechnicians: () => void;
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
          onClick={hasTechnicianStep ? onContinueToTechnicians : () => onSubmit()}
          disabled={isSubmitting || draftCount === 0}
          className="btn-primary h-10 px-4 text-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          {hasTechnicianStep
            ? "Continue"
            : isSubmitting
              ? "Creating…"
              : `Create ${draftCount} ${draftCount === 1 ? "service" : "services"}`}
        </button>
      )}

      {step === "technicians" && (
        <>
          <button
            type="button"
            onClick={onSkipTechnicians}
            disabled={isSubmitting || draftCount === 0}
            className="btn-secondary h-10 px-4 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            Skip for now
          </button>
          <button
            type="button"
            onClick={() => onSubmit()}
            disabled={isSubmitting || draftCount === 0}
            className="btn-primary h-10 px-4 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? "Creating…"
              : `Create ${draftCount} ${draftCount === 1 ? "service" : "services"}`}
          </button>
        </>
      )}
    </>
  );
}
