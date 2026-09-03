"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { isApiError } from "@/lib/api/errors";
import {
  createPublicBooking,
  getPublicAvailability,
  getPublicServiceCatalog,
  getPublicServiceStaff,
  getPublicTenant,
} from "@/modules/public-booking/api";
import { publicBookingKeys } from "@/modules/public-booking/keys";
import type { CreatePublicBookingInput } from "@/modules/public-booking/types";

/**
 * Public tenant identity for a booking-page slug. No auth, no tenant context —
 * this is the query a customer's browser runs first.
 *
 * `QueryProvider` already declines to retry any `ApiError` with status < 500,
 * so a 404 for an unknown/hidden slug fails fast rather than retrying twice.
 */
export function usePublicTenant(slug: string) {
  return useQuery({
    queryKey: publicBookingKeys.tenant(slug),
    queryFn: ({ signal }) => getPublicTenant(slug, signal),
    enabled: slug.length > 0,
  });
}

/**
 * Public service catalog for a slug. Gated by `enabled` so it only fires once
 * the tenant identity has confirmed a NAIL_TECHNICIAN vertical — the catalog
 * endpoint 404s (RESOURCE_NOT_FOUND) for any other business type, and the
 * unsupported-vertical UX is driven by `business_type`, never by that 404.
 */
export function usePublicServiceCatalog(slug: string, enabled: boolean) {
  return useQuery({
    queryKey: publicBookingKeys.services(slug),
    queryFn: ({ signal }) => getPublicServiceCatalog(slug, signal),
    enabled: enabled && slug.length > 0,
  });
}

/**
 * Technicians who can perform the chosen service (S9 step 2). Fires only once
 * a service is actually selected.
 */
export function usePublicServiceStaff(slug: string, serviceId: string | null) {
  return useQuery({
    queryKey: publicBookingKeys.serviceStaff(slug, serviceId ?? ""),
    queryFn: ({ signal }) => getPublicServiceStaff(slug, serviceId as string, signal),
    enabled: slug.length > 0 && Boolean(serviceId),
  });
}

/**
 * Real slots from the S7 engine (S9 step 3). The query does NOT fire until
 * every parameter — service, technician and date — is present, so
 * "No times available" can never flash before the request has been made.
 */
export function usePublicAvailability(
  slug: string,
  serviceId: string | null,
  staffId: string | null,
  date: string | null
) {
  const ready = Boolean(serviceId && staffId && date) && slug.length > 0;

  return useQuery({
    queryKey: publicBookingKeys.availability(
      slug,
      serviceId ?? "",
      staffId ?? "",
      date ?? ""
    ),
    queryFn: ({ signal }) =>
      getPublicAvailability(slug, serviceId as string, staffId as string, date as string, signal),
    enabled: ready,
  });
}

/**
 * Create a real anonymous booking (Scheduling S10) from the S9 selection.
 *
 * Cache hygiene lives here so no caller can forget it:
 *   - on SUCCESS  → drop every cached availability list for this business
 *     (`availabilityForSlug` prefix), so the just-booked slot is gone when the
 *     customer revisits the picker
 *   - on a 409 `BOOKING_SLOT_UNAVAILABLE` → same invalidation, so when the
 *     caller sends the customer back to slot selection the list is refetched
 *
 * The caller still owns the 409 *navigation* (it needs the router). `retry:
 * false` — a booking POST must never be silently re-sent (no backend
 * idempotency key yet); a conflict or validation failure is a final answer.
 */
export function useCreatePublicBooking(slug: string) {
  const queryClient = useQueryClient();
  const invalidateAvailability = () =>
    queryClient.invalidateQueries({ queryKey: publicBookingKeys.availabilityForSlug(slug) });

  return useMutation({
    mutationFn: (input: CreatePublicBookingInput) => createPublicBooking(slug, input),
    retry: false,
    onSuccess: invalidateAvailability,
    onError: (error) => {
      if (isApiError(error) && error.code === "BOOKING_SLOT_UNAVAILABLE") {
        invalidateAvailability();
      }
    },
  });
}
