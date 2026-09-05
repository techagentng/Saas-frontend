"use client";

import { useQuery } from "@tanstack/react-query";

import { listServiceSuggestions } from "@/modules/service-suggestions/api";
import { serviceSuggestionKeys } from "@/modules/service-suggestions/keys";
import { useAuth } from "@/providers/auth-provider";

/**
 * The starter-service suggestions for one workspace's business type.
 * Disabled until authentication has settled and a real tenant id is present,
 * matching every other tenant-scoped query in this codebase.
 */
export function useServiceSuggestions(tenantId: string | undefined) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: serviceSuggestionKeys.list(tenantId ?? ""),
    queryFn: ({ signal }) => listServiceSuggestions(tenantId as string, signal),
    enabled: isAuthenticated && Boolean(tenantId),
  });
}
