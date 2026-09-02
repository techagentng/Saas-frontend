"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  archiveStaff,
  createStaff,
  listStaff,
  listStaffCapabilities,
  replaceStaffCapabilities,
  updateStaff,
} from "@/modules/staff/api";
import type { CreateStaffInput, UpdateStaffInput } from "@/modules/staff/api";
import { staffKeys } from "@/modules/staff/keys";
import type { StaffListFilter, StaffProfile } from "@/modules/staff/types";
import { useAuth } from "@/providers/auth-provider";

/**
 * The roster for one workspace.
 *
 * Disabled until authentication has settled and a real tenant id is present,
 * matching `useServices` — it never fires while signed out or with no
 * workspace selected. Combined with the tenant-scoped key, switching
 * workspaces reads a different cache entry rather than showing the previous
 * workspace's roster while the new one loads.
 */
export function useStaffList(tenantId: string | undefined, filter: StaffListFilter = "ALL") {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: staffKeys.list(tenantId ?? "", filter),
    queryFn: ({ signal }) => listStaff(tenantId as string, filter, signal),
    enabled: isAuthenticated && Boolean(tenantId),
  });
}

/** The service ids one staff member can perform. */
export function useStaffCapabilities(tenantId: string | undefined, staffId: string | undefined) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: staffKeys.capabilities(tenantId ?? "", staffId ?? ""),
    queryFn: ({ signal }) =>
      listStaffCapabilities(tenantId as string, staffId as string, signal),
    enabled: isAuthenticated && Boolean(tenantId) && Boolean(staffId),
  });
}

/**
 * Invalidating `staffKeys.tenant(tenantId)` — not `staffKeys.all` — is the
 * point: prefix matching covers every filter, detail, and capability query
 * for *this* workspace while leaving another workspace's cached roster
 * untouched.
 */
function useRosterInvalidation(tenantId: string) {
  const queryClient = useQueryClient();

  return (updated: StaffProfile) => {
    queryClient.setQueryData(staffKeys.detail(tenantId, updated.id), updated);
    queryClient.invalidateQueries({ queryKey: staffKeys.tenant(tenantId) });
  };
}

export function useCreateStaff(tenantId: string) {
  const onRosterChange = useRosterInvalidation(tenantId);

  return useMutation({
    mutationFn: (input: CreateStaffInput) => createStaff(tenantId, input),
    onSuccess: onRosterChange,
  });
}

export function useUpdateStaff(tenantId: string) {
  const onRosterChange = useRosterInvalidation(tenantId);

  return useMutation({
    mutationFn: ({ staffId, input }: { staffId: string; input: UpdateStaffInput }) =>
      updateStaff(tenantId, staffId, input),
    onSuccess: onRosterChange,
  });
}

export function useArchiveStaff(tenantId: string) {
  const onRosterChange = useRosterInvalidation(tenantId);

  return useMutation({
    mutationFn: (staffId: string) => archiveStaff(tenantId, staffId),
    onSuccess: onRosterChange,
  });
}

/**
 * Replaces one staff member's complete capability set. Invalidates only that
 * member's capability query and the list (assigned-count rows read
 * capabilities per-row, so the list must refresh too) — not the whole tenant
 * handle, since a capability change never alters the roster's own fields.
 */
export function useReplaceStaffCapabilities(tenantId: string, staffId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (serviceIds: string[]) => replaceStaffCapabilities(tenantId, staffId, serviceIds),
    onSuccess: (result) => {
      queryClient.setQueryData(staffKeys.capabilities(tenantId, staffId), result);
    },
  });
}
