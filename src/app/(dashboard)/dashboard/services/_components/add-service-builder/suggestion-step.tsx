"use client";

import { useId, useMemo, useState } from "react";

import type { ServiceSuggestion } from "@/modules/service-suggestions/types";

import { suggestionKey } from "./types";

/**
 * Step 2: reveal the selected category's suggestions and let the owner
 * multi-select which ones to turn into real services, or skip straight to a
 * custom one. Nothing here is persisted — checking a box only marks intent;
 * Step 4 is the only place a request is ever sent.
 */
export function SuggestionStep({
  categoryName,
  suggestions,
  selectedKeys,
  onToggle,
  customDraftCount,
  onAddCustomService,
}: {
  categoryName: string;
  suggestions: ServiceSuggestion[];
  selectedKeys: Set<string>;
  onToggle: (suggestion: ServiceSuggestion) => void;
  customDraftCount: number;
  onAddCustomService: (name: string) => void;
}) {
  const searchId = useId();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (query === "") return suggestions;
    return suggestions.filter(
      (suggestion) =>
        suggestion.name.toLowerCase().includes(query) ||
        suggestion.category.toLowerCase().includes(query)
    );
  }, [suggestions, search]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">{categoryName}</h3>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Select the services you want to add. You can edit everything — including the name and
          duration — before creating them.
        </p>
      </div>

      {suggestions.length > 0 && (
        <div>
          <label htmlFor={searchId} className="sr-only">
            Search suggestions
          </label>
          <input
            id={searchId}
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by service or category name"
            className="input-base"
          />
        </div>
      )}

      {suggestions.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-400">
          No suggestions for this category. Add a custom service below.
        </p>
      ) : (
        <ul className="flex max-h-80 flex-col gap-1 overflow-y-auto">
          {filtered.map((suggestion) => {
            const key = suggestionKey(suggestion);
            const checked = selectedKeys.has(key);
            return (
              <li key={key}>
                <label className="flex items-start gap-3 rounded-lg px-2 py-2.5 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggle(suggestion)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-brand-600 focus:ring-2 focus:ring-brand-600/40 dark:border-slate-700 dark:bg-slate-800"
                  />
                  <span className="flex flex-col">
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {suggestion.name}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {suggestion.description}
                    </span>
                    <span className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                      {suggestion.suggested_duration_minutes} min suggested
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
          {filtered.length === 0 && (
            <li className="px-2 py-3 text-sm text-slate-500 dark:text-slate-400">
              No suggestions match &quot;{search}&quot;.
            </li>
          )}
        </ul>
      )}

      <AddCustomServiceControl onAdd={onAddCustomService} />

      {customDraftCount > 0 && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {customDraftCount} custom {customDraftCount === 1 ? "service" : "services"} added.
        </p>
      )}
    </div>
  );
}

function AddCustomServiceControl({ onAdd }: { onAdd: (name: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const inputId = useId();

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="self-start rounded-lg border border-dashed border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
      >
        + Create custom service
      </button>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const trimmed = name.trim();
        if (trimmed === "") return;
        onAdd(trimmed);
        setName("");
        setIsOpen(false);
      }}
      className="flex flex-wrap items-end gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60"
    >
      <div className="flex min-w-[12rem] flex-1 flex-col gap-1">
        <label htmlFor={inputId} className="text-xs font-medium text-slate-700 dark:text-slate-300">
          Service name
        </label>
        <input
          id={inputId}
          type="text"
          autoFocus
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nail Art (per hand)"
          className="input-base"
        />
      </div>
      <button type="submit" className="btn-primary h-10 px-3.5 text-sm">
        Add
      </button>
      <button
        type="button"
        onClick={() => {
          setIsOpen(false);
          setName("");
        }}
        className="btn-secondary h-10 px-3.5 text-sm"
      >
        Cancel
      </button>
    </form>
  );
}
