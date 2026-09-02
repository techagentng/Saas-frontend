/**
 * Frontend contract for the Scheduling S5 recurring weekly working hours,
 * mirroring the backend's `PublicWorkingHours`/`PublicWorkingHourInterval`
 * DTOs field for field (`internal/scheduling/handler/working_hours_handler.go`).
 *
 * This is deliberately not an appointment slot, a break, a holiday, a
 * one-off exception, or an availability calculation — S7's availability
 * engine reads this data; nothing here computes bookable time.
 */

/**
 * The seven canonical values, mirroring `staff_working_hours_day_valid` in
 * migration 000015. Spelled out rather than 0–6 for the same reason the
 * backend chose it: legible without a lookup table, and immune to any
 * reader's locale.
 */
export type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

/** ISO 8601 week ordering (Monday-first), matching the backend's own display sort. */
export const DAYS_OF_WEEK: readonly DayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

export const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

/**
 * One recurring interval. `start_time`/`end_time` are wall-clock local
 * business time — `"09:00"`, `"17:30"` — never a UTC instant and never
 * converted here. There is no `id`; the backend's own DTO carries none, so
 * one is not invented on this side either (see `working-hours-dialog.tsx`
 * for how the editor gives rows a LOCAL-only key instead).
 */
export type WorkingHourInterval = {
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
};

/** GET/PUT .../staff/{staffID}/working-hours response shape. */
export type StaffWorkingHours = {
  staff_id: string;
  /** Empty means "no configured hours" — a legitimate, successful state, never an error. */
  intervals: WorkingHourInterval[];
};
