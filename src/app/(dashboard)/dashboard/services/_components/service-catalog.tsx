"use client";

import { useMemo, useState } from "react";

import { apiErrorMessage } from "@/lib/api/error-messages";
import { useServiceCategories } from "@/modules/service-categories/queries";
import type { ServiceCategory } from "@/modules/service-categories/types";
import { useServices } from "@/modules/services/queries";
import type { Service } from "@/modules/services/types";
import { useCan } from "@/providers/permissions-provider";

import { AddServiceBuilder } from "./add-service-builder/add-service-builder";
import { ArchiveCategoryDialog } from "./archive-category-dialog";
import { ArchiveServiceDialog } from "./archive-service-dialog";
import { ServiceFormDialog } from "./service-form-dialog";
import { ServiceRow } from "./service-row";

type ServiceGroup = {
  /** Null for the trailing "Uncategorized" group. */
  category: ServiceCategory | null;
  services: Service[];
};

const UNCATEGORIZED_LABEL = "Uncategorized";

/**
 * Groups an already status-sorted service list by `category_id`, preserving
 * each service's relative order (so "active first, then by name" survives
 * inside every group). Named groups sort by the category's own
 * `sort_order`/name; "Uncategorized" — legacy pre-SC1 services, or ones the
 * owner never filed — always sinks to the bottom rather than competing with
 * real categories for position.
 *
 * A service can reference an ARCHIVED category id (the category was archived
 * after the service was filed under it — archiving never touches the
 * service). `categoriesById` is built from an ALL-status fetch specifically
 * so that group still gets the category's real name instead of silently
 * relabeling it "Uncategorized", which would misrepresent a real assignment.
 */
function groupByCategory(services: Service[], categoriesById: Map<string, ServiceCategory>): ServiceGroup[] {
  const order: string[] = [];
  const map = new Map<string, ServiceGroup>();

  for (const service of services) {
    const key = service.category_id ?? "uncategorized";
    if (!map.has(key)) {
      map.set(key, {
        category: service.category_id ? (categoriesById.get(service.category_id) ?? null) : null,
        services: [],
      });
      order.push(key);
    }
    map.get(key)!.services.push(service);
  }

  const named = order
    .filter((key) => key !== "uncategorized")
    .sort((a, b) => {
      const catA = map.get(a)!.category;
      const catB = map.get(b)!.category;
      const sortA = catA?.sort_order ?? 0;
      const sortB = catB?.sort_order ?? 0;
      if (sortA !== sortB) return sortA - sortB;
      return (catA?.name ?? "").localeCompare(catB?.name ?? "");
    })
    .map((key) => map.get(key)!);

  const uncategorized = map.get("uncategorized");
  return uncategorized ? [...named, uncategorized] : named;
}

/**
 * The catalog itself: loading, empty, error and loaded states, plus whichever
 * mutation dialog is open.
 *
 * Fetches with `status=ALL` rather than the backend's ACTIVE default, a
 * decision taken from the real contract (`CatalogService.ParseStatusFilter`
 * accepts ACTIVE/ARCHIVED/ALL). Archiving therefore marks a row rather than
 * vanishing it, which is the honest rendering of archive-not-delete — and the
 * owner can still see what they archived without a filter control this feature
 * does not need yet.
 */
export function ServiceCatalog({ tenantId, currency }: { tenantId: string; currency: string }) {
  const servicesQuery = useServices(tenantId, "ALL");
  // ALL, not ACTIVE: a service can reference a category that was archived
  // after it was filed, and the group heading should still show that
  // category's real name rather than misrepresenting it as Uncategorized.
  const categoriesQuery = useServiceCategories(tenantId, "ALL");

  // Read fresh from PermissionsProvider on every render. Permissions are
  // per-tenant and change when the workspace changes; caching them inside this
  // module would let one workspace's capabilities govern another's controls.
  const canCreate = useCan("service.create");
  const canUpdate = useCan("service.update");
  const canArchive = useCan("service.archive");

  const [isCreating, setIsCreating] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [archiving, setArchiving] = useState<Service | null>(null);
  const [archivingCategory, setArchivingCategory] = useState<ServiceCategory | null>(null);

  // Active first, then by name, so the catalog reads as a menu rather than as
  // insertion order. Archived entries sink to the bottom instead of being
  // interleaved with the services actually on offer.
  const services = useMemo(() => {
    const rows = servicesQuery.data ?? [];
    return [...rows].sort((a, b) => {
      if (a.status !== b.status) return a.status === "ACTIVE" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }, [servicesQuery.data]);

  const categoriesById = useMemo(
    () => new Map((categoriesQuery.data ?? []).map((category) => [category.id, category])),
    [categoriesQuery.data]
  );

  const groups = useMemo(() => groupByCategory(services, categoriesById), [services, categoriesById]);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {servicesQuery.isSuccess
            ? `${services.length} ${services.length === 1 ? "service" : "services"}`
            : "Your services"}
        </h2>
        {canCreate && servicesQuery.isSuccess && services.length > 0 && (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="btn-primary h-10 px-4 text-sm"
          >
            Add service
          </button>
        )}
      </div>

      {servicesQuery.isPending && (
        <div
          role="status"
          aria-live="polite"
          className="card p-6"
        >
          <span className="text-sm text-slate-500 dark:text-slate-400">Loading services…</span>
        </div>
      )}

      {servicesQuery.isError && (
        <div
          role="alert"
          className="flex flex-col items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-6 dark:border-rose-900/50 dark:bg-rose-950/40"
        >
          <p className="text-sm text-rose-700 dark:text-rose-300">
            {apiErrorMessage(servicesQuery.error)}
          </p>
          <button
            type="button"
            onClick={() => servicesQuery.refetch()}
            className="btn-secondary h-9 px-3.5 text-sm"
          >
            Try again
          </button>
        </div>
      )}

      {servicesQuery.isSuccess && services.length === 0 && (
        <div className="flex flex-col items-start gap-4 rounded-2xl border border-dashed border-slate-300 bg-white p-8 dark:border-slate-700 dark:bg-slate-900">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
              No services yet
            </h3>
            <p className="mt-1 max-w-prose text-sm text-slate-600 dark:text-slate-400">
              Add the services customers will be able to book — a name, how long it takes, and what
              it costs.
            </p>
          </div>
          {canCreate ? (
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="btn-primary h-11 px-5 text-sm"
            >
              Add service
            </button>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Ask an owner to add the first service.
            </p>
          )}
        </div>
      )}

      {servicesQuery.isSuccess && services.length > 0 && (
        <div className="flex flex-col gap-5">
          {groups.map((group) => (
            <details key={group.category?.id ?? "uncategorized"} open className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-1 [&::-webkit-details-marker]:hidden">
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {group.category?.name ?? UNCATEGORIZED_LABEL}
                  {group.category?.status === "ARCHIVED" && (
                    <span className="rounded-full border border-slate-300 px-2 py-0.5 text-xs font-normal text-slate-500 dark:border-slate-700 dark:text-slate-400">
                      Category archived
                    </span>
                  )}
                  <span className="text-xs font-normal text-slate-400 dark:text-slate-500">
                    {group.services.length}
                  </span>
                </span>
                {canArchive && group.category && group.category.status === "ACTIVE" && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      setArchivingCategory(group.category);
                    }}
                    aria-label={`Archive category ${group.category.name}`}
                    className="text-xs font-medium text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400"
                  >
                    Archive category
                  </button>
                )}
              </summary>
              <ul className="mt-2 flex flex-col gap-3">
                {group.services.map((service) => (
                  <ServiceRow
                    key={service.id}
                    service={service}
                    currency={currency}
                    onEdit={canUpdate ? () => setEditing(service) : undefined}
                    // Archiving an already-archived service is a no-op
                    // server-side, so the control is simply absent there
                    // rather than offering an action with no effect.
                    onArchive={
                      canArchive && service.status === "ACTIVE"
                        ? () => setArchiving(service)
                        : undefined
                    }
                  />
                ))}
              </ul>
            </details>
          ))}
        </div>
      )}

      {isCreating && (
        <AddServiceBuilder
          // Forces a full remount — and therefore a full state reset — the
          // instant the workspace changes, so a draft started for one tenant
          // can never surface mid-flow after switching to another.
          key={tenantId}
          tenantId={tenantId}
          currency={currency}
          onClose={() => setIsCreating(false)}
        />
      )}

      {editing && (
        <ServiceFormDialog
          // Remounts per service, so the form's initial values come from the
          // service actually being edited rather than from whichever one
          // opened the dialog first.
          key={editing.id}
          tenantId={tenantId}
          currency={currency}
          service={editing}
          onClose={() => setEditing(null)}
        />
      )}

      {archiving && (
        <ArchiveServiceDialog
          key={archiving.id}
          tenantId={tenantId}
          service={archiving}
          onClose={() => setArchiving(null)}
        />
      )}

      {archivingCategory && (
        <ArchiveCategoryDialog
          key={archivingCategory.id}
          tenantId={tenantId}
          category={archivingCategory}
          onClose={() => setArchivingCategory(null)}
        />
      )}
    </section>
  );
}
