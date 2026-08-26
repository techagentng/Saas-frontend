/**
 * Canonical vertical values (Vertical Onboarding F1, `internal/tenant/model/business_type.go`).
 * Confirmed live against the running backend — adding a fifth vertical is a
 * backend allow-list change, not a frontend-invented value.
 */
export type BusinessType = "NAIL_TECHNICIAN" | "RESTAURANT" | "HOTEL" | "TRANSPORT";

/**
 * Workflow state, decoupled from `status` (ACTIVE/DISABLED lifecycle) —
 * confirmed live: `internal/tenant/model/onboarding_status.go`. No
 * "NOT_STARTED" value exists; a tenant row is always born IN_PROGRESS.
 */
export type OnboardingStatus = "IN_PROGRESS" | "COMPLETED";

/**
 * Authenticated tenant record as returned by the backend
 * (POST/GET/PATCH /api/v1/tenants...). Field names mirror the API's JSON
 * response as-is — there's no camelCase translation layer in the API client.
 */
export type Tenant = {
  id: string;
  name: string;
  slug: string;
  status: string;
  description: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  /** Nullable — confirmed live for any tenant with no profile set, not just legacy rows. */
  timezone: string | null;
  /**
   * Null only for a tenant created before this field existed (Vertical
   * Onboarding F1) — permanent for those rows, not a transient state.
   * Immutable once set through every ordinary endpoint.
   */
  business_type: BusinessType | null;
  /** Never empty for a persisted tenant — always one of the two enum values. */
  onboarding_status: OnboardingStatus;
  /** Free-form resume pointer, not a typed enum — valid values depend on business_type. */
  onboarding_step: string | null;
  created_at: string;
  updated_at: string;
};
