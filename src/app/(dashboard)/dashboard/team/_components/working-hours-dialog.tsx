"use client";

import { useState } from "react";

import { Dialog } from "@/components/ui/Dialog";
import { apiErrorMessage } from "@/lib/api/error-messages";
import { useReplaceStaffWorkingHours, useStaffWorkingHours } from "@/modules/working-hours/queries";
import { DAYS_OF_WEEK, DAY_LABELS } from "@/modules/working-hours/types";
import type { DayOfWeek } from "@/modules/working-hours/types";
import {
  emptySchedule,
  scheduleFromIntervals,
  validateSchedule,
} from "@/modules/working-hours/validation";
import type { EditableSchedule, ValidationError } from "@/modules/working-hours/validation";
import type { StaffProfile } from "@/modules/staff/types";
import { useCan } from "@/providers/permissions-provider";

/**
 * A technician's recurring weekly working hours (Scheduling S5 — S6 UI).
 *
 * Reachable from every roster row, regardless of `staff.update` — reaching
 * the roster at all already requires `staff.read` (enforced by
 * `TeamPage`/`TeamRoster`), and a schedule has genuine read-only value: a
 * `staff.read`-only user can see when a colleague works. Editing switches to
 * a second mode within this same dialog, gated on `staff.update`, rather
 * than a separate dialog — there is exactly one thing here (the schedule),
 * unlike the profile-vs-capabilities split that justifies two dialogs in S4.
 *
 * There is no separate "is this day enabled" flag anywhere in the S5 schema
 * — "not working" IS zero intervals, per the migration's own comment ("the
 * absence of hours, not a boolean"). So "enabling" a day is adding its first
 * interval, and "disabling" it is removing all of them; no phantom toggle
 * is invented to represent a state the backend doesn't have.
 */
export function WorkingHoursDialog({
  tenantId,
  staff,
  onClose,
}: {
  tenantId: string;
  staff: StaffProfile;
  onClose: () => void;
}) {
  const canEdit = useCan("staff.update");
  const hoursQuery = useStaffWorkingHours(tenantId, staff.id);
  const replaceHours = useReplaceStaffWorkingHours(tenantId, staff.id);

  const [mode, setMode] = useState<"view" | "edit">("view");
  // Populated only when entering edit mode (see `startEditing`), from data
  // already loaded at that point — there is no async gap to seed across, so
  // this needs no render-time-reset trick, unlike `ManageServicesDialog`
  // which must seed as soon as a still-loading query resolves.
  const [schedule, setSchedule] = useState<EditableSchedule>(emptySchedule);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  function startEditing() {
    if (!hoursQuery.isSuccess) return;
    setSchedule(scheduleFromIntervals(hoursQuery.data.intervals));
    setErrors([]);
    setFormError(null);
    setMode("edit");
  }

  function cancelEditing() {
    setMode("view");
    setErrors([]);
    setFormError(null);
  }

  function errorFor(day: DayOfWeek, index: number): string | undefined {
    return errors.find((error) => error.day === day && error.index === index)?.message;
  }

  function updateRow(day: DayOfWeek, index: number, field: "start" | "end", value: string) {
    setSchedule((current) => ({
      ...current,
      [day]: current[day].map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    }));
    setErrors((current) => current.filter((error) => !(error.day === day && error.index === index)));
  }

  function addRow(day: DayOfWeek) {
    setSchedule((current) => ({ ...current, [day]: [...current[day], { start: "", end: "" }] }));
  }

  function removeRow(day: DayOfWeek, index: number) {
    setSchedule((current) => ({
      ...current,
      [day]: current[day].filter((_, i) => i !== index),
    }));
    setErrors((current) => current.filter((error) => !(error.day === day && error.index === index)));
  }

  async function handleSave() {
    setFormError(null);
    const result = validateSchedule(schedule);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors([]);
    try {
      await replaceHours.mutateAsync(result.intervals);
      setMode("view");
    } catch (err) {
      setFormError(
        apiErrorMessage(err, {
          VALIDATION_FAILED:
            "Check your hours: make sure every start time is before its end time, and that intervals don't overlap.",
          STAFF_NOT_FOUND: "That team member no longer exists. Refresh to see the current roster.",
        })
      );
    }
  }

  const isEditing = mode === "edit" && canEdit;

  return (
    <Dialog
      title={`${staff.display_name}'s working hours`}
      description={
        isEditing
          ? "Set the hours this person normally works each week."
          : "Their normal weekly working schedule."
      }
      onClose={onClose}
      footer={
        isEditing ? (
          <>
            <button
              type="button"
              onClick={cancelEditing}
              disabled={replaceHours.isPending}
              className="btn-secondary h-10 px-4 text-sm disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={replaceHours.isPending}
              className="btn-primary h-10 px-4 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {replaceHours.isPending ? "Saving…" : "Save"}
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={onClose} className="btn-secondary h-10 px-4 text-sm">
              Close
            </button>
            {canEdit && hoursQuery.isSuccess && (
              <button type="button" onClick={startEditing} className="btn-primary h-10 px-4 text-sm">
                Edit
              </button>
            )}
          </>
        )
      }
    >
      {hoursQuery.isPending && (
        <div role="status" aria-live="polite" className="py-6 text-center">
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Loading working hours…
          </span>
        </div>
      )}

      {hoursQuery.isError && (
        <div role="alert" className="flex flex-col items-start gap-3">
          <p className="text-sm text-rose-700 dark:text-rose-300">
            {apiErrorMessage(hoursQuery.error)}
          </p>
          <button
            type="button"
            onClick={() => hoursQuery.refetch()}
            className="btn-secondary h-9 px-3.5 text-sm"
          >
            Try again
          </button>
        </div>
      )}

      {hoursQuery.isSuccess && !isEditing && (
        <ScheduleView schedule={scheduleFromIntervals(hoursQuery.data.intervals)} />
      )}

      {hoursQuery.isSuccess && isEditing && (
        <fieldset disabled={replaceHours.isPending} className="flex flex-col gap-5">
          <legend className="sr-only">{staff.display_name}&apos;s weekly working hours</legend>
          {DAYS_OF_WEEK.map((day) => (
            <DayEditor
              key={day}
              day={day}
              rows={schedule[day]}
              errorFor={(index) => errorFor(day, index)}
              onChange={(index, field, value) => updateRow(day, index, field, value)}
              onAdd={() => addRow(day)}
              onRemove={(index) => removeRow(day, index)}
            />
          ))}
        </fieldset>
      )}

      {formError && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300"
        >
          {formError}
        </p>
      )}
    </Dialog>
  );
}

/** Read-only rendering: the display concept from the spec, one line per interval, "Not working" for an empty day. */
function ScheduleView({ schedule }: { schedule: EditableSchedule }) {
  return (
    <dl className="flex flex-col gap-3">
      {DAYS_OF_WEEK.map((day) => (
        <div key={day} className="flex items-baseline justify-between gap-4">
          <dt className="text-sm font-medium text-slate-900 dark:text-slate-50">
            {DAY_LABELS[day]}
          </dt>
          <dd className="text-right text-sm text-slate-600 dark:text-slate-400">
            {schedule[day].length === 0 ? (
              <span className="text-slate-400 dark:text-slate-500">Not working</span>
            ) : (
              <ul className="flex flex-col gap-0.5">
                {schedule[day].map((row, index) => (
                  // Index is stable here: this list is a pure render of
                  // already-saved server data, never reordered or edited in
                  // place, unlike the editor's own rows below.
                  <li key={index}>
                    {row.start} — {row.end}
                  </li>
                ))}
              </ul>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** One day's editable rows, plus its own "Add hours" control. */
function DayEditor({
  day,
  rows,
  errorFor,
  onChange,
  onAdd,
  onRemove,
}: {
  day: DayOfWeek;
  rows: EditableSchedule[DayOfWeek];
  errorFor: (index: number) => string | undefined;
  onChange: (index: number, field: "start" | "end", value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}) {
  const label = DAY_LABELS[day];

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{label}</p>

      {rows.length === 0 && (
        <p className="text-xs text-slate-500 dark:text-slate-400">Not working</p>
      )}

      {rows.map((row, index) => {
        const error = errorFor(index);
        const rowId = `${day}-${index}`;
        return (
          <div key={rowId} className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="time"
                aria-label={`${label} interval ${index + 1} start time`}
                value={row.start}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `${rowId}-error` : undefined}
                onChange={(event) => onChange(index, "start", event.target.value)}
                className="input-base w-32"
              />
              <span className="text-sm text-slate-500 dark:text-slate-400" aria-hidden="true">
                to
              </span>
              <input
                type="time"
                aria-label={`${label} interval ${index + 1} end time`}
                value={row.end}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `${rowId}-error` : undefined}
                onChange={(event) => onChange(index, "end", event.target.value)}
                className="input-base w-32"
              />
              <button
                type="button"
                onClick={() => onRemove(index)}
                aria-label={`Remove ${label} interval ${index + 1}`}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 dark:border-slate-800 dark:text-slate-400 dark:hover:border-rose-900 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
              >
                Remove
              </button>
            </div>
            {error && (
              <p id={`${rowId}-error`} className="text-xs font-medium text-rose-600 dark:text-rose-400">
                {error}
              </p>
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={onAdd}
        aria-label={`Add hours on ${label}`}
        className="self-start rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800/60"
      >
        + Add hours
      </button>
    </div>
  );
}
