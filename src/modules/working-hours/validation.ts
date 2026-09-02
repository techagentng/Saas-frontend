import { DAYS_OF_WEEK } from "@/modules/working-hours/types";
import type { DayOfWeek, WorkingHourInterval } from "@/modules/working-hours/types";

/** One editable row in the schedule editor. No `id` — see `EditableSchedule` for why. */
export type EditableInterval = {
  start: string;
  end: string;
};

/**
 * The editor's local, in-progress state: every day always has an entry
 * (possibly an empty array — "not working"), so the editor can render all
 * seven days unconditionally without a lookup that might miss one.
 */
export type EditableSchedule = Record<DayOfWeek, EditableInterval[]>;

/** An empty schedule — every day starts with zero intervals ("not working"), never a fabricated default row. */
export function emptySchedule(): EditableSchedule {
  const schedule = {} as EditableSchedule;
  for (const day of DAYS_OF_WEEK) schedule[day] = [];
  return schedule;
}

/** Builds editor state from the server's flat interval list, grouping by day. Never mutates or reorders the source. */
export function scheduleFromIntervals(intervals: readonly WorkingHourInterval[]): EditableSchedule {
  const schedule = emptySchedule();
  for (const interval of intervals) {
    schedule[interval.day_of_week].push({ start: interval.start_time, end: interval.end_time });
  }
  return schedule;
}

export type ValidationError = {
  day: DayOfWeek;
  /** Index into that day's interval array, for associating the message with the right row. */
  index: number;
  message: string;
};

export type ValidationResult =
  | { ok: true; intervals: WorkingHourInterval[] }
  | { ok: false; errors: ValidationError[] };

/**
 * Validates a complete weekly schedule against exactly the rules S5's
 * `ValidateWeeklySchedule` enforces server-side, so a schedule this function
 * accepts is never rejected by the backend for a reason the owner wasn't
 * already told about (barring a race with another edit).
 *
 * Touching boundaries (`A.end === B.start`) are explicitly valid — checked
 * with `current.start < previous.end`, never `<=`, matching the backend's
 * own `current.StartTime < previous.EndTime` exactly. Using `<=` here would
 * reject the split-shift case (09:00–12:00, 12:00–17:00) that S5 explicitly
 * allows.
 *
 * Each day is validated independently and every day's errors are collected,
 * rather than stopping at the first problem, so fixing one day's mistake
 * doesn't hide a second day's mistake behind it.
 */
export function validateSchedule(schedule: EditableSchedule): ValidationResult {
  const errors: ValidationError[] = [];
  const intervals: WorkingHourInterval[] = [];

  for (const day of DAYS_OF_WEEK) {
    const rows = schedule[day];
    const rowErrors: (string | null)[] = rows.map(() => null);
    let dayHasRowError = false;

    rows.forEach((row, index) => {
      if (row.start === "" || row.end === "") {
        rowErrors[index] = "Enter both a start and end time.";
        dayHasRowError = true;
      } else if (row.start >= row.end) {
        // Safe as a plain string comparison: <input type="time"> always
        // yields zero-padded 24-hour "HH:MM", under which lexicographic and
        // chronological order coincide — the same property S5's own
        // `ValidateClockTime` normalizes toward before comparing.
        rowErrors[index] = "Start time must be before end time.";
        dayHasRowError = true;
      }
    });

    if (dayHasRowError) {
      for (let index = 0; index < rows.length; index++) {
        if (rowErrors[index]) errors.push({ day, index, message: rowErrors[index] as string });
      }
      continue;
    }

    // Sorted by start time with the ORIGINAL index carried along, so an
    // overlap or duplicate found after sorting is still reported against the
    // row the owner actually sees at that position in the editor.
    const sorted = rows
      .map((row, index) => ({ ...row, index }))
      .sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));

    for (let i = 1; i < sorted.length; i++) {
      const previous = sorted[i - 1];
      const current = sorted[i];

      if (previous.start === current.start && previous.end === current.end) {
        errors.push({ day, index: current.index, message: "This interval is a duplicate." });
        continue;
      }

      // Strict `<`, never `<=` — equal is the touching-boundary case S5
      // explicitly allows (09:00–12:00 followed by 12:00–17:00).
      if (current.start < previous.end) {
        errors.push({
          day,
          index: current.index,
          message: "Working hours cannot overlap with another interval.",
        });
      }
    }

    if (errors.some((error) => error.day === day)) continue;

    for (const row of rows) {
      intervals.push({ day_of_week: day, start_time: row.start, end_time: row.end });
    }
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, intervals };
}
