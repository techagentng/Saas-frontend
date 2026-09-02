"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getStaffWorkingHours, replaceStaffWorkingHours } from "@/modules/working-hours/api";
import { workingHoursKeys } from "@/modules/working-hours/keys";
import type { WorkingHourInterval } from "@/modules/working-hours/types";
import { useAuth } from "@/providers/auth-provider";

/**
 * One staff member's recurring weekly schedule.
 *
 * Disabled until authentication has settled and both a real tenant id and
 * staff id are present, matching `useStaffCapabilities` — it never fires
 * while signed out, with no workspace selected, or before a technician is
 * chosen. Combined with the tenant-scoped key, switching workspaces reads a
 * distinct cache entry rather than showing the previous workspace's
 * schedule while the new one loads.
 */
export function useStaffWorkingHours(tenantId: string | undefined, staffId: string | undefined) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: workingHoursKeys.detail(tenantId ?? "", staffId ?? ""),
    queryFn: ({ signal }) => getStaffWorkingHours(tenantId as string, staffId as string, signal),
    enabled: isAuthenticated && Boolean(tenantId) && Boolean(staffId),
  });
}

/**
 * Replaces one staff member's complete weekly schedule. Only that member's
 * own working-hours query is invalidated — never `staffKeys.tenant` or the
 * wider `workingHoursKeys.tenant` handle — because a schedule change alters
 * neither the roster's fields nor any other technician's hours.
 */
export function useReplaceStaffWorkingHours(tenantId: string, staffId: string) {
  const queryClient = useQueryClient();
  const key = workingHoursKeys.detail(tenantId, staffId);

  return useMutation({
    mutationFn: (intervals: WorkingHourInterval[]) =>
      replaceStaffWorkingHours(tenantId, staffId, intervals),
    onSuccess: (result) => {
      queryClient.setQueryData(key, result);
    },
  });
}
