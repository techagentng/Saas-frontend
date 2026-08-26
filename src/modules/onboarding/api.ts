import { apiClient } from "@/lib/api/client";
import type { OnboardingStepId } from "@/modules/onboarding/steps";
import type { Tenant } from "@/types/tenant";

export type SaveOnboardingProgressInput = {
  current_step: OnboardingStepId;
};

/**
 * PATCH /api/v1/tenants/{tenantID}/onboarding — flexible-order step save
 * (Vertical Onboarding F2). Requires `tenant.update`, enforced server-side;
 * never changes `onboarding_status`. Returns the full updated tenant, same
 * shape as GET/POST tenant.
 */
export function saveOnboardingProgress(
  tenantId: string,
  input: SaveOnboardingProgressInput,
  signal?: AbortSignal
): Promise<Tenant> {
  return apiClient.patch<Tenant>(`/v1/tenants/${tenantId}/onboarding`, input, { signal });
}

/**
 * POST /api/v1/tenants/{tenantID}/onboarding/complete — a validated,
 * one-way COMPLETED transition (Vertical Onboarding F2). No request body;
 * the backend alone decides whether completion is allowed
 * (`validateOnboardingCompletionPrerequisites`) — this function only
 * requests it, never enforces the rule client-side. Idempotent on an
 * already-COMPLETED tenant.
 */
export function completeOnboarding(tenantId: string, signal?: AbortSignal): Promise<Tenant> {
  return apiClient.post<Tenant>(`/v1/tenants/${tenantId}/onboarding/complete`, undefined, { signal });
}
