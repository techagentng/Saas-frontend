/**
 * Duration bounds mirrored from the backend rather than invented here:
 * `model.MinDurationMinutes` / `model.MaxDurationMinutes` in
 * `internal/scheduling/model/service.go`, enforced a second time by the
 * `services_duration_valid` CHECK constraint in migration 000010.
 *
 * Zero is excluded on purpose upstream — a zero-duration service produces a
 * degenerate slot that the exclusion constraint planned for S10 would never
 * detect a conflict on. The 8-hour ceiling bounds future slot-generation cost
 * and catches the classic unit error of entering seconds.
 */
export const MIN_DURATION_MINUTES = 1;
export const MAX_DURATION_MINUTES = 480;

/**
 * The durations a salon actually books in. Offered as one-tap presets with a
 * free-text fallback, so the common case is a single click and an unusual
 * duration is still expressible — rather than forcing every owner through a
 * number field for "60".
 */
export const DURATION_PRESETS_MINUTES = [15, 30, 45, 60, 90, 120] as const;

/** "1 hr 30 min" reads better on a catalog row than "90 min". */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  const hourLabel = `${hours} hr`;

  return remainder === 0 ? hourLabel : `${hourLabel} ${remainder} min`;
}

export function isValidDurationMinutes(minutes: number): boolean {
  return (
    Number.isInteger(minutes) &&
    minutes >= MIN_DURATION_MINUTES &&
    minutes <= MAX_DURATION_MINUTES
  );
}
