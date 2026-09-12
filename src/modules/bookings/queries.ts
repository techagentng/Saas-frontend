"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { cancelBooking, getBooking, listBookings } from "@/modules/bookings/api";
import { bookingKeys } from "@/modules/bookings/keys";
import type { BookingListFilter } from "@/modules/bookings/types";
import { useAuth } from "@/providers/auth-provider";

/**
 * The booking list for one workspace + view/filter combination.
 *
 * Disabled until authentication has settled and a real tenant id is present,
 * matching `useServices`/`useStaffList` — it never fires while signed out or
 * with no workspace selected. Combined with the tenant-and-filter-scoped key,
 * switching workspaces OR changing any filter reads a distinct cache entry
 * rather than showing stale data while the new query loads.
 */
export function useBookings(tenantId: string | undefined, filter: BookingListFilter) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: bookingKeys.list(tenantId ?? "", filter),
    queryFn: ({ signal }) => listBookings(tenantId as string, filter, signal),
    enabled: isAuthenticated && Boolean(tenantId),
  });
}

/** One booking's detail, for the detail dialog. Disabled until a real booking id is chosen. */
export function useBooking(tenantId: string | undefined, bookingId: string | undefined) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: bookingKeys.detail(tenantId ?? "", bookingId ?? ""),
    queryFn: ({ signal }) => getBooking(tenantId as string, bookingId as string, signal),
    enabled: isAuthenticated && Boolean(tenantId) && Boolean(bookingId),
  });
}

/**
 * Cancels one booking (CONFIRMED → CANCELLED). On success, updates that
 * booking's own cached detail directly with the server-confirmed result (no
 * optimistic update — this project's established convention, matching
 * `useCreateService`/`useArchiveStaff`, is to trust the response rather than
 * guess ahead of it) and invalidates every list for this tenant: the
 * cancelled booking may need to move between views (e.g. Upcoming →
 * Cancelled) depending on which one is active, so a targeted single-list
 * update would risk leaving a stale entry in whichever view is not the one
 * currently open. `bookingKeys.tenant(tenantId)` — not `bookingKeys.all` —
 * keeps this scoped to the one workspace, never touching another tenant's
 * cached bookings.
 */
export function useCancelBooking(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId: string) => cancelBooking(tenantId, bookingId),
    retry: false,
    onSuccess: (updated) => {
      queryClient.setQueryData(bookingKeys.detail(tenantId, updated.id), updated);
      queryClient.invalidateQueries({ queryKey: bookingKeys.tenant(tenantId) });
    },
  });
}
