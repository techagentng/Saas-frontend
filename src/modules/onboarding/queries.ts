"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";

import { completeOnboarding, saveOnboardingProgress } from "@/modules/onboarding/api";
import type { SaveOnboardingProgressInput } from "@/modules/onboarding/api";
import { tenantKeys } from "@/modules/tenant/keys";
import type { Tenant } from "@/types/tenant";

/**
 * Keeps the tenant detail and list caches in sync after any onboarding
 * mutation — the exact pattern `useUpdateTenantProfile` (modules/tenant/queries.ts)
 * already uses, reused rather than duplicated. Both TenantProvider/TenantGate
 * (which read the list query) and this onboarding page (which reads the
 * detail query) must agree on `onboarding_status`/`onboarding_step`
 * immediately, or F4's gate could redirect on stale data.
 */
function syncTenantCaches(queryClient: QueryClient, tenantId: string, updated: Tenant): void {
  queryClient.setQueryData(tenantKeys.detail(tenantId), updated);
  queryClient.setQueryData<Tenant[]>(tenantKeys.list(), (existing) =>
    existing?.map((tenant) => (tenant.id === tenantId ? updated : tenant))
  );
  queryClient.invalidateQueries({ queryKey: tenantKeys.all });
}

/** Saves the caller's current onboarding step for one tenant (F2's flexible, non-sequential save). */
export function useSaveOnboardingProgress(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SaveOnboardingProgressInput) => saveOnboardingProgress(tenantId, input),
    onSuccess: (updated) => syncTenantCaches(queryClient, tenantId, updated),
  });
}

/**
 * Requests the validated COMPLETED transition for one tenant. Fully wired
 * and cache-consistent, but deliberately not exposed as a primary UI
 * action in F5 — see OnboardingShell's own comment for why.
 */
export function useCompleteOnboarding(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => completeOnboarding(tenantId),
    onSuccess: (updated) => syncTenantCaches(queryClient, tenantId, updated),
  });
}
