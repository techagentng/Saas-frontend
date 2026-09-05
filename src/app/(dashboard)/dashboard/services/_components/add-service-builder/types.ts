import type { ServiceCategory } from "@/modules/service-categories/types";
import type { ServiceSuggestion } from "@/modules/service-suggestions/types";

export type BuilderStep = "category" | "suggestions" | "customize";

/**
 * One selectable tile in Step 1. Derived purely from live data — never a
 * hardcoded list — by `buildCategoryOptions` below.
 *
 * `key` is what the UI selects and drafts reference. For a category that
 * already exists for this tenant it is the real category id, so "reuse the
 * existing category" falls out of the data model rather than needing a
 * special case at submit time. For a suggestion-only category it is a
 * synthetic `new:<name>` handle — there is nothing to key by yet because
 * nothing has been created.
 */
export type CategoryOption = {
  key: string;
  name: string;
  /** How many suggestions are grouped under this category name. 0 for an existing tenant category with no matching suggestions. */
  suggestionCount: number;
  /** The real tenant category id, when an ACTIVE category with this name already exists. Null until created. */
  existingCategoryId: string | null;
};

export const UNCATEGORIZED_KEY = "__uncategorized__";

/** Always-available "no category" choice, offered in the customize step's category picker. */
export const UNCATEGORIZED_OPTION: CategoryOption = {
  key: UNCATEGORIZED_KEY,
  name: "Uncategorized",
  suggestionCount: 0,
  existingCategoryId: null,
};

export type DraftStatus = "editing" | "creating" | "created" | "failed";

export type DraftService = {
  /** Stable React key and submission identity — never sent to the backend. */
  key: string;
  source: "suggestion" | "custom";
  name: string;
  description: string;
  durationMinutes: number;
  /** Major-unit string the owner typed, exactly like `ServiceFormDialog` — never a float in state. */
  price: string;
  categoryKey: string;
  status: DraftStatus;
  error: string | null;
};

function normalizeCategoryName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Builds Step 1's category tiles from the two real sources of truth: the
 * platform's suggestion list and the tenant's own ACTIVE categories. Never
 * invents a category name that isn't present in one of those two inputs.
 *
 * A suggestion category and an existing tenant category with the same name
 * (case-insensitively) collapse into one tile carrying both the suggestion
 * count and the real id — the single fact `existingCategoryId` needs to
 * answer "does creating a service here require creating a category first?".
 */
export function buildCategoryOptions(
  suggestions: ServiceSuggestion[],
  existingCategories: ServiceCategory[]
): CategoryOption[] {
  const activeExisting = existingCategories.filter((category) => category.status === "ACTIVE");
  const options: CategoryOption[] = [];
  const seen = new Set<string>();

  for (const suggestion of suggestions) {
    const norm = normalizeCategoryName(suggestion.category);
    if (seen.has(norm)) continue;
    seen.add(norm);

    const match = activeExisting.find((category) => normalizeCategoryName(category.name) === norm);
    options.push({
      key: match ? match.id : `new:${suggestion.category}`,
      name: suggestion.category,
      suggestionCount: suggestions.filter((s) => normalizeCategoryName(s.category) === norm).length,
      existingCategoryId: match ? match.id : null,
    });
  }

  for (const category of activeExisting) {
    const norm = normalizeCategoryName(category.name);
    if (seen.has(norm)) continue;
    seen.add(norm);

    options.push({
      key: category.id,
      name: category.name,
      suggestionCount: 0,
      existingCategoryId: category.id,
    });
  }

  return options;
}

/** Stable multi-select key for a suggestion, which has no id of its own. */
export function suggestionKey(suggestion: ServiceSuggestion): string {
  return `${suggestion.category}::${suggestion.name}`;
}
