"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  archiveServiceCategory,
  createServiceCategory,
  listServiceCategories,
  updateServiceCategory,
} from "@/modules/service-categories/api";
import type {
  CreateServiceCategoryInput,
  UpdateServiceCategoryInput,
} from "@/modules/service-categories/api";
import { serviceCategoryKeys } from "@/modules/service-categories/keys";
import type { ServiceCategory, ServiceCategoryListFilter } from "@/modules/service-categories/types";
import { serviceKeys } from "@/modules/services/keys";
import { useAuth } from "@/providers/auth-provider";

/**
 * The category list for one workspace. Disabled until authentication has
 * settled and a real tenant id is present, matching `useServices`'s guard —
 * switching workspaces reads a distinct cache entry rather than showing the
 * previous workspace's categories while the new one loads.
 */
export function useServiceCategories(
  tenantId: string | undefined,
  filter: ServiceCategoryListFilter = "ALL"
) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: serviceCategoryKeys.list(tenantId ?? "", filter),
    queryFn: ({ signal }) => listServiceCategories(tenantId as string, filter, signal),
    enabled: isAuthenticated && Boolean(tenantId),
  });
}

/**
 * Invalidates both the category cache AND the service cache for this tenant.
 * A category rename or archive changes how the service list groups and
 * labels itself even though no `Service` row's own fields changed, so the
 * services query must be treated as stale too, not just the categories query.
 */
function useCategoryInvalidation(tenantId: string) {
  const queryClient = useQueryClient();

  return (updated: ServiceCategory) => {
    queryClient.setQueryData(serviceCategoryKeys.detail(tenantId, updated.id), updated);
    queryClient.invalidateQueries({ queryKey: serviceCategoryKeys.tenant(tenantId) });
    queryClient.invalidateQueries({ queryKey: serviceKeys.tenant(tenantId) });
  };
}

export function useCreateServiceCategory(tenantId: string) {
  const onCategoryChange = useCategoryInvalidation(tenantId);

  return useMutation({
    mutationFn: (input: CreateServiceCategoryInput) => createServiceCategory(tenantId, input),
    onSuccess: onCategoryChange,
  });
}

export function useUpdateServiceCategory(tenantId: string) {
  const onCategoryChange = useCategoryInvalidation(tenantId);

  return useMutation({
    mutationFn: ({
      categoryId,
      input,
    }: {
      categoryId: string;
      input: UpdateServiceCategoryInput;
    }) => updateServiceCategory(tenantId, categoryId, input),
    onSuccess: onCategoryChange,
  });
}

export function useArchiveServiceCategory(tenantId: string) {
  const onCategoryChange = useCategoryInvalidation(tenantId);

  return useMutation({
    mutationFn: (categoryId: string) => archiveServiceCategory(tenantId, categoryId),
    onSuccess: onCategoryChange,
  });
}
