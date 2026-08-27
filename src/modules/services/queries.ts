"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  archiveService,
  createService,
  listServices,
  updateService,
} from "@/modules/services/api";
import type { CreateServiceInput, UpdateServiceInput } from "@/modules/services/api";
import { serviceKeys } from "@/modules/services/keys";
import type { Service, ServiceListFilter } from "@/modules/services/types";
import { useAuth } from "@/providers/auth-provider";

/**
 * The catalog for one workspace.
 *
 * Disabled until both authentication has settled and a real tenant id is
 * present, so it never fires while signed out or with no workspace selected —
 * the same guard `useTenantPermissions` uses. Combined with the tenant-scoped
 * key, switching workspaces reads a different cache entry rather than showing
 * the previous workspace's catalog while the new one loads.
 */
export function useServices(tenantId: string | undefined, filter: ServiceListFilter = "ALL") {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: serviceKeys.list(tenantId ?? "", filter),
    queryFn: ({ signal }) => listServices(tenantId as string, filter, signal),
    enabled: isAuthenticated && Boolean(tenantId),
  });
}

/**
 * Invalidating `serviceKeys.tenant(tenantId)` — not `serviceKeys.all` — is the
 * point: prefix matching covers every filter and detail query for *this*
 * workspace while leaving another workspace's cached catalog untouched.
 */
function useCatalogInvalidation(tenantId: string) {
  const queryClient = useQueryClient();

  return (updated: Service) => {
    queryClient.setQueryData(serviceKeys.detail(tenantId, updated.id), updated);
    queryClient.invalidateQueries({ queryKey: serviceKeys.tenant(tenantId) });
  };
}

export function useCreateService(tenantId: string) {
  const onCatalogChange = useCatalogInvalidation(tenantId);

  return useMutation({
    mutationFn: (input: CreateServiceInput) => createService(tenantId, input),
    onSuccess: onCatalogChange,
  });
}

export function useUpdateService(tenantId: string) {
  const onCatalogChange = useCatalogInvalidation(tenantId);

  return useMutation({
    mutationFn: ({ serviceId, input }: { serviceId: string; input: UpdateServiceInput }) =>
      updateService(tenantId, serviceId, input),
    onSuccess: onCatalogChange,
  });
}

export function useArchiveService(tenantId: string) {
  const onCatalogChange = useCatalogInvalidation(tenantId);

  return useMutation({
    mutationFn: (serviceId: string) => archiveService(tenantId, serviceId),
    onSuccess: onCatalogChange,
  });
}
