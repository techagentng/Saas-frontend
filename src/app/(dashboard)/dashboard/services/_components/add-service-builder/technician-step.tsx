"use client";

import { apiErrorMessage } from "@/lib/api/error-messages";
import { useStaffList } from "@/modules/staff/queries";

import type { DraftService } from "./types";

/**
 * Step 4 (SC2, nail-technician-vertical only): one technician checklist per
 * draft, so a batch of several services created together can each get their
 * own assignment in one pass — mirroring how `CustomizeStep` already renders
 * one card per draft rather than a single shared form.
 *
 * Loads the tenant's real roster through `useStaffList` — the same query the
 * Team page uses — never a hardcoded list, matching `ManageServicesDialog`'s
 * own reasoning for loading the real service catalog rather than duplicating
 * it. Only ACTIVE staff are offerable: an archived profile cannot be booked.
 *
 * Selections here are pure local draft state (`draft.technicianIds`) until
 * the service that draft describes actually exists — see
 * `add-service-builder.tsx`'s doc comment on why assignment cannot happen
 * before creation.
 */
export function TechnicianStep({
  tenantId,
  drafts,
  onChange,
  onRetryImageUpload,
  onRetryTechnicianAssignment,
}: {
  tenantId: string;
  drafts: DraftService[];
  onChange: (key: string, patch: Partial<DraftService>) => void;
  onRetryImageUpload: (key: string) => void;
  onRetryTechnicianAssignment: (key: string) => void;
}) {
  const staffQuery = useStaffList(tenantId, "ACTIVE");

  if (drafts.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-400">
        Nothing to assign yet. Go back and choose at least one service.
      </p>
    );
  }

  if (staffQuery.isPending) {
    return (
      <div role="status" aria-live="polite" className="py-6 text-center">
        <span className="text-sm text-slate-500 dark:text-slate-400">Loading technicians…</span>
      </div>
    );
  }

  if (staffQuery.isError) {
    return (
      <div role="alert" className="flex flex-col items-start gap-3">
        <p className="text-sm text-rose-700 dark:text-rose-300">{apiErrorMessage(staffQuery.error)}</p>
        <button type="button" onClick={() => staffQuery.refetch()} className="btn-secondary h-9 px-3.5 text-sm">
          Try again
        </button>
      </div>
    );
  }

  const staff = (staffQuery.data ?? []).filter((member) => member.status === "ACTIVE");

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Assign technicians</h3>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Choose which technicians can perform each service. You can skip this and assign
          technicians later from the Services page.
        </p>
      </div>

      {staff.length === 0 ? (
        <p className="text-sm text-slate-600 dark:text-slate-400">
          You haven&apos;t added any technicians yet. Skip this step for now — the service will
          still be created, and the public booking page will correctly show no available
          technician until you assign one from the Services page.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {drafts.map((draft) => (
            <DraftTechnicianCard
              key={draft.key}
              draft={draft}
              staff={staff}
              onChange={(patch) => onChange(draft.key, patch)}
              onRetryImageUpload={() => onRetryImageUpload(draft.key)}
              onRetryTechnicianAssignment={() => onRetryTechnicianAssignment(draft.key)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function DraftTechnicianCard({
  draft,
  staff,
  onChange,
  onRetryImageUpload,
  onRetryTechnicianAssignment,
}: {
  draft: DraftService;
  staff: { id: string; display_name: string; is_bookable: boolean }[];
  onChange: (patch: Partial<DraftService>) => void;
  onRetryImageUpload: () => void;
  onRetryTechnicianAssignment: () => void;
}) {
  const isCreated = draft.status === "created";
  const isBusy = draft.status === "creating";

  function toggle(staffId: string) {
    const next = new Set(draft.technicianIds);
    if (next.has(staffId)) next.delete(staffId);
    else next.add(staffId);
    onChange({ technicianIds: Array.from(next) });
  }

  return (
    <li className="card flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
          {draft.name || "Untitled service"}
        </span>
        {isCreated && (
          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Created</span>
        )}
      </div>

      <fieldset className="flex flex-col gap-1" disabled={isBusy}>
        <legend className="sr-only">Technicians for {draft.name || "this service"}</legend>
        {staff.map((member) => {
          const checked = draft.technicianIds.includes(member.id);
          return (
            <label
              key={member.id}
              className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(member.id)}
                className="h-4 w-4 shrink-0 rounded border-slate-300 text-brand-600 focus:ring-2 focus:ring-brand-600/40 dark:border-slate-700 dark:bg-slate-800"
              />
              <span className="text-slate-900 dark:text-slate-100">{member.display_name}</span>
              {!member.is_bookable && (
                <span className="ml-auto rounded-full border border-slate-300 px-2 py-0.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:text-slate-400">
                  Not bookable
                </span>
              )}
            </label>
          );
        })}
      </fieldset>

      {isCreated && draft.imageUploadStatus === "error" && (
        <div role="alert" className="flex flex-wrap items-center gap-2 text-xs font-medium text-rose-600 dark:text-rose-400">
          <span>
            Service created, but some images could not be uploaded
            {draft.imageUploadError ? `: ${draft.imageUploadError}` : "."}
          </span>
          <button type="button" onClick={onRetryImageUpload} className="underline underline-offset-2">
            Retry image upload
          </button>
        </div>
      )}

      {isCreated && draft.technicianAssignStatus === "assigning" && (
        <p role="status" aria-live="polite" className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Assigning technicians…
        </p>
      )}

      {isCreated && draft.technicianAssignStatus === "error" && (
        <div role="alert" className="flex flex-wrap items-center gap-2 text-xs font-medium text-rose-600 dark:text-rose-400">
          <span>
            Service created, but technician assignment failed
            {draft.technicianAssignError ? `: ${draft.technicianAssignError}` : "."}
          </span>
          <button type="button" onClick={onRetryTechnicianAssignment} className="underline underline-offset-2">
            Retry assignment
          </button>
        </div>
      )}
    </li>
  );
}
