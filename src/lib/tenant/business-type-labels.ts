import type { BusinessType } from "@/types/tenant";

const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  NAIL_TECHNICIAN: "Nail Technician",
  RESTAURANT: "Restaurant",
  HOTEL: "Hotel",
  TRANSPORT: "Transport",
};

/**
 * Presentational only — never used for business logic or authorization.
 * `null`/unrecognized values (legacy pre-F1 tenants, or a future backend
 * vertical this build doesn't know about yet) fall back to a generic label
 * rather than crashing or rendering "undefined".
 */
export function businessTypeLabel(businessType: BusinessType | null | undefined): string {
  if (!businessType) return "Business";
  return BUSINESS_TYPE_LABELS[businessType] ?? "Business";
}
