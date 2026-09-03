"use client";

import type { ServiceCategory } from "@/modules/public-booking/categories";

/**
 * The category navigation for the public catalogue.
 *
 * Category-ready: it renders one tab per group `groupServicesByCategory`
 * returns. With no backend category field that is a single "All Services"
 * tab today; when categories land it becomes "Natural Nails", "Nail
 * Extensions", "Add-Ons", … with no change here.
 *
 * Horizontally scrollable on narrow screens (the row bleeds to the edges and
 * scrolls rather than wrapping or shrinking the labels).
 */
export function ServiceCategoryTabs({
  categories,
  activeId,
  onSelect,
}: {
  categories: ServiceCategory[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  if (categories.length <= 1) {
    // A single group is still shown, but as a quiet label rather than a lone
    // interactive tab that does nothing.
    return (
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
        {categories[0]?.label ?? "All Services"}
      </p>
    );
  }

  return (
    <div
      role="tablist"
      aria-label="Service categories"
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {categories.map((category) => {
        const isActive = category.id === activeId;
        return (
          <button
            key={category.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onSelect(category.id)}
            className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900"
                : "border-slate-300 bg-transparent text-slate-600 hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white"
            }`}
          >
            {category.label}
            <span className="ml-1.5 text-xs opacity-60">{category.services.length}</span>
          </button>
        );
      })}
    </div>
  );
}
