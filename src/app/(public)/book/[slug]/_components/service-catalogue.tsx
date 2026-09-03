"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { formatDuration } from "@/lib/scheduling/duration";
import {
  ALL_SERVICES_CATEGORY_ID,
  groupServicesByCategory,
} from "@/modules/public-booking/categories";
import type { PublicService } from "@/modules/public-booking/types";

import { formatServicePrice } from "./format";
import { ServiceCategoryTabs } from "./service-category-tabs";

/**
 * The public service catalogue: category navigation + an elegant stack of
 * service rows.
 *
 * Every value shown is real backend data (`name`, `description`,
 * `duration_minutes`, `price_minor`, catalog-level `currency`). Price
 * formatting is the shared null-safe helper. Selecting a service is a plain
 * link into the existing S9 flow (`/book/{slug}/availability?service_id=…`),
 * so URL state, routing and the technician → date → time progression are
 * untouched.
 */
export function ServiceCatalogue({
  slug,
  services,
  currency,
  selectedServiceId = null,
}: {
  slug: string;
  services: PublicService[];
  currency: string | null;
  /** Highlighted if the customer came back from a later step. */
  selectedServiceId?: string | null;
}) {
  const categories = useMemo(() => groupServicesByCategory(services), [services]);
  const [activeId, setActiveId] = useState(categories[0]?.id ?? ALL_SERVICES_CATEGORY_ID);

  const active =
    categories.find((category) => category.id === activeId) ?? categories[0] ?? null;
  const shown = active?.services ?? services;

  return (
    <div className="space-y-5">
      <ServiceCategoryTabs categories={categories} activeId={activeId} onSelect={setActiveId} />

      <ul className="border-t border-[#E7DAD0] dark:border-slate-800">
        {shown.map((service) => (
          <ServiceCatalogueItem
            key={service.id}
            slug={slug}
            service={service}
            currency={currency}
            isSelected={service.id === selectedServiceId}
          />
        ))}
      </ul>
    </div>
  );
}

export function ServiceCatalogueItem({
  slug,
  service,
  currency,
  isSelected = false,
}: {
  slug: string;
  service: PublicService;
  currency: string | null;
  isSelected?: boolean;
}) {
  const duration = formatDuration(service.duration_minutes);
  const price = formatServicePrice(service.price_minor, currency);

  return (
    <li
      className={`border-b border-[#E7DAD0] py-6 transition-colors dark:border-slate-800 ${
        isSelected ? "-mx-4 rounded-2xl bg-white px-4 shadow-soft dark:bg-slate-900" : ""
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 space-y-1.5">
          <h3 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
            {service.name}
          </h3>
          {service.description && (
            <p className="line-clamp-3 max-w-prose text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {service.description}
            </p>
          )}
          <p className="flex items-center gap-3 pt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
            <span>{duration}</span>
            <span aria-hidden="true" className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
            <span aria-hidden="true" className="font-medium text-slate-700 dark:text-slate-300">
              {price.display}
            </span>
            <span className="sr-only">{price.accessible}</span>
          </p>
        </div>

        <div className="shrink-0 sm:pt-1">
          <Link
            href={{ pathname: `/book/${slug}/availability`, query: { service_id: service.id } }}
            aria-label={`Select ${service.name}`}
            aria-current={isSelected ? "true" : undefined}
            className={`inline-flex h-9 items-center justify-center rounded-full border px-5 text-sm font-medium no-underline transition-colors ${
              isSelected
                ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900"
                : "border-slate-900/80 text-slate-900 hover:bg-slate-900 hover:text-white dark:border-white/70 dark:text-white dark:hover:bg-white dark:hover:text-slate-900"
            }`}
          >
            {isSelected ? "Selected" : "Select"}
          </Link>
        </div>
      </div>
    </li>
  );
}
