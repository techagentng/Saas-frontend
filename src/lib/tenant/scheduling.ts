import type { BusinessType } from "@/types/tenant";

/**
 * The verticals that use the **appointment-scheduling booking model** —
 * a named service of a known duration performed by a person, occupying a
 * window on that person's calendar.
 *
 * This is not a nail-specific list. The backend module is `internal/scheduling`
 * precisely because barbers, spas, tattoo studios and consultants book the same
 * way; NAIL_TECHNICIAN is simply the first `business_type` switched on to it.
 * Adding BARBER later is an entry in this array plus the backend's own
 * business-type allow-list — no new module, no new nav plumbing.
 *
 * RESTAURANT (party-size against floor capacity), HOTEL (room-night inventory)
 * and TRANSPORT (a seat on a fixed departure) are deliberately absent: their
 * bookable unit is not a duration on a calendar, and they get their own modules
 * rather than being squeezed through this one.
 */
export const SCHEDULING_BUSINESS_TYPES: readonly BusinessType[] = ["NAIL_TECHNICIAN"];

/**
 * The single predicate the whole app asks. Nothing outside this module should
 * compare against `"NAIL_TECHNICIAN"` directly — that is exactly the scatter
 * that makes adding a vertical a find-and-replace instead of a one-line change.
 *
 * Fails closed on `null`/`undefined`: a pre-F1 legacy tenant has no business
 * type and must not be handed a scheduling surface on a guess, matching
 * PermissionsProvider's empty-set-on-unknown philosophy. This is a **product
 * gating** decision only — the backend authorizes every request regardless of
 * what this returns, and `business_type` is never consulted by its Authorizer.
 */
export function isSchedulingBusinessType(
  businessType: BusinessType | null | undefined
): boolean {
  if (businessType == null) return false;
  return SCHEDULING_BUSINESS_TYPES.includes(businessType);
}
