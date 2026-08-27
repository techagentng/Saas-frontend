"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createTenant,
  getTenant,
  listTenants,
  setTenantCurrency,
  updateTenantProfile,
} from "@/modules/tenant/api";
import type { CreateTenantInput, UpdateTenantProfileInput } from "@/modules/tenant/api";
import { tenantKeys } from "@/modules/tenant/keys";
import { useAuth } from "@/providers/auth-provider";
import type { Tenant } from "@/types/tenant";

/**
 * Tenant *fetching* layer — kept separate from tenant *selection* state
 * (see providers/tenant-provider.tsx), which builds on top of this.
 * Disabled while unauthenticated since tenant membership is per-user.
 */
export function useTenants() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: tenantKeys.list(),
    queryFn: ({ signal }) => listTenants(signal),
    enabled: isAuthenticated,
  });
}

/**
 * Single-tenant fetch by id. Named `useTenantDetail` (not `useTenant`) to
 * avoid colliding with TenantProvider's existing `useTenant()` (F7), which
 * returns the current *selection* context, not a server fetch.
 */
export function useTenantDetail(tenantId: string | undefined) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: tenantKeys.detail(tenantId ?? ""),
    queryFn: ({ signal }) => getTenant(tenantId as string, signal),
    enabled: isAuthenticated && Boolean(tenantId),
  });
}

/**
 * Appends the created tenant to the cached list and seeds its detail cache
 * immediately, so it's usable without waiting on a refetch, then
 * invalidates every tenant query so the server remains the eventual
 * source of truth.
 */
export function useCreateTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTenantInput) => createTenant(input),
    onSuccess: (createdTenant) => {
      queryClient.setQueryData<Tenant[]>(tenantKeys.list(), (existing) => {
        const withoutDuplicate = (existing ?? []).filter((tenant) => tenant.id !== createdTenant.id);
        return [...withoutDuplicate, createdTenant];
      });
      queryClient.setQueryData(tenantKeys.detail(createdTenant.id), createdTenant);
      queryClient.invalidateQueries({ queryKey: tenantKeys.all });
    },
  });
}

/**
 * Keeps the list and detail caches consistent after a profile edit, so
 * nothing derived from them (sidebar, header, TenantProvider's
 * currentTenant) shows a stale name/description after a save.
 */
export function useUpdateTenantProfile(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateTenantProfileInput) => updateTenantProfile(tenantId, input),
    onSuccess: (updatedTenant) => {
      queryClient.setQueryData(tenantKeys.detail(tenantId), updatedTenant);
      queryClient.setQueryData<Tenant[]>(tenantKeys.list(), (existing) =>
        existing?.map((tenant) => (tenant.id === tenantId ? updatedTenant : tenant))
      );
      queryClient.invalidateQueries({ queryKey: tenantKeys.all });
    },
  });
}

/**
 * Declares the workspace currency, once (Scheduling S1).
 *
 * Writes the response through the same two caches `useUpdateTenantProfile`
 * does, so everything derived from them — TenantProvider's `currentTenant`,
 * and therefore the Services page's read-only currency and its price
 * formatting — reflects the new value immediately rather than after a refetch.
 */
export function useSetTenantCurrency(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (currency: string) => setTenantCurrency(tenantId, currency),
    onSuccess: (updatedTenant) => {
      queryClient.setQueryData(tenantKeys.detail(tenantId), updatedTenant);
      queryClient.setQueryData<Tenant[]>(tenantKeys.list(), (existing) =>
        existing?.map((tenant) => (tenant.id === tenantId ? updatedTenant : tenant))
      );
      queryClient.invalidateQueries({ queryKey: tenantKeys.all });
    },
  });
}
