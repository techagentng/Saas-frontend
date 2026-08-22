"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createTenant, listTenants } from "@/modules/tenant/api";
import type { CreateTenantInput } from "@/modules/tenant/api";
import { useAuth } from "@/providers/auth-provider";
import type { Tenant } from "@/types/tenant";

export const TENANTS_QUERY_KEY = ["tenants", "list"] as const;

/**
 * Tenant *fetching* layer — kept separate from tenant *selection* state
 * (see providers/tenant-provider.tsx), which builds on top of this.
 * Disabled while unauthenticated since tenant membership is per-user.
 */
export function useTenantsQuery() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: TENANTS_QUERY_KEY,
    queryFn: ({ signal }) => listTenants(signal),
    enabled: isAuthenticated,
    retry: false,
  });
}

/**
 * The post-create "refresh tenant data" integration point, isolated here
 * so it needs no changes when F3 (GET /v1/tenants) lands:
 *
 * - Optimistically appends the created tenant (F2's response) to the
 *   cached list, so it's usable immediately without waiting on F3.
 * - Invalidates the list so a background refetch reconciles with the
 *   server once F3 exists. Today that refetch fails (listTenants() is a
 *   stub) — TanStack Query keeps the last-set `data` on a failed refetch,
 *   so the optimistic entry above survives untouched.
 */
export function useCreateTenantMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTenantInput) => createTenant(input),
    onSuccess: (createdTenant) => {
      queryClient.setQueryData<Tenant[]>(TENANTS_QUERY_KEY, (existing) => {
        const withoutDuplicate = (existing ?? []).filter((tenant) => tenant.id !== createdTenant.id);
        return [...withoutDuplicate, createdTenant];
      });
      queryClient.invalidateQueries({ queryKey: TENANTS_QUERY_KEY });
    },
  });
}
