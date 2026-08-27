"use client";

import { useMemo, useState } from "react";

import { apiErrorMessage } from "@/lib/api/error-messages";
import { useServices } from "@/modules/services/queries";
import type { Service } from "@/modules/services/types";
import { useCan } from "@/providers/permissions-provider";

import { ArchiveServiceDialog } from "./archive-service-dialog";
import { ServiceFormDialog } from "./service-form-dialog";
import { ServiceRow } from "./service-row";

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

  // Read fresh from PermissionsProvider on every render. Permissions are
  // per-tenant and change when the workspace changes; caching them inside this
  // module would let one workspace's capabilities govern another's controls.
  const canCreate = useCan("service.create");
  const canUpdate = useCan("service.update");
  const canArchive = useCan("service.archive");

  const [isCreating, setIsCreating] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [archiving, setArchiving] = useState<Service | null>(null);

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
        <ul className="flex flex-col gap-3">
          {services.map((service) => (
            <ServiceRow
              key={service.id}
              service={service}
              currency={currency}
              onEdit={canUpdate ? () => setEditing(service) : undefined}
              // Archiving an already-archived service is a no-op server-side,
              // so the control is simply absent there rather than offering an
              // action with no effect.
              onArchive={
                canArchive && service.status === "ACTIVE" ? () => setArchiving(service) : undefined
              }
            />
          ))}
        </ul>
      )}

      {isCreating && (
        <ServiceFormDialog
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
    </section>
  );
}
