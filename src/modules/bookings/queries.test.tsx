import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const listBookings = vi.fn();
const getBooking = vi.fn();
const cancelBooking = vi.fn();
vi.mock("./api", () => ({
  listBookings: (...args: unknown[]) => listBookings(...args),
  getBooking: (...args: unknown[]) => getBooking(...args),
  cancelBooking: (...args: unknown[]) => cancelBooking(...args),
}));

vi.mock("@/providers/auth-provider", () => ({
  useAuth: () => ({ isAuthenticated: true }),
}));

// Imported after the mocks are declared.
import { useBooking, useBookings, useCancelBooking } from "./queries";
import { bookingKeys } from "./keys";

const TENANT_ID = "11111111-1111-4111-8111-111111111111";

const BOOKING = {
  id: "booking-1",
  reference: "NB-1A2B3C4D",
  status: "CONFIRMED" as const,
  service: { id: "svc-1", name: "Gel Manicure" },
  staff: { id: "staff-1", name: "Ada" },
  customer_name: "Jane Doe",
  customer_phone: null,
  customer_email: null,
  start: "2026-09-12T09:00:00Z",
  end: "2026-09-12T09:45:00Z",
  duration_minutes: 45,
  created_at: "2026-09-01T00:00:00Z",
};

const CANCELLED_BOOKING = { ...BOOKING, status: "CANCELLED" as const, timezone: "Africa/Lagos" };

let queryClient: QueryClient;

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  listBookings.mockReset().mockResolvedValue([BOOKING]);
  getBooking.mockReset().mockResolvedValue({ ...BOOKING, timezone: "Africa/Lagos" });
  cancelBooking.mockReset().mockResolvedValue(CANCELLED_BOOKING);
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
});

describe("useBookings", () => {
  it("fetches through listBookings(tenantId, filter)", async () => {
    const { result } = renderHook(() => useBookings(TENANT_ID, { view: "UPCOMING" }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(listBookings).toHaveBeenCalledWith(TENANT_ID, { view: "UPCOMING" }, expect.anything());
    expect(result.current.data).toEqual([BOOKING]);
  });

  it("is disabled without a tenant id", () => {
    const { result } = renderHook(() => useBookings(undefined, { view: "UPCOMING" }), { wrapper });

    expect(result.current.fetchStatus).toBe("idle");
    expect(listBookings).not.toHaveBeenCalled();
  });

  it("uses a distinct cache entry per filter combination", async () => {
    const { result: upcoming } = renderHook(() => useBookings(TENANT_ID, { view: "UPCOMING" }), { wrapper });
    const { result: cancelled } = renderHook(() => useBookings(TENANT_ID, { view: "CANCELLED" }), { wrapper });

    await waitFor(() => expect(upcoming.current.isSuccess).toBe(true));
    await waitFor(() => expect(cancelled.current.isSuccess).toBe(true));

    expect(listBookings).toHaveBeenCalledTimes(2);
    expect(
      queryClient.getQueryData(bookingKeys.list(TENANT_ID, { view: "UPCOMING" }))
    ).toBeDefined();
    expect(
      queryClient.getQueryData(bookingKeys.list(TENANT_ID, { view: "CANCELLED" }))
    ).toBeDefined();
  });
});

describe("useBooking", () => {
  it("fetches through getBooking(tenantId, bookingId)", async () => {
    const { result } = renderHook(() => useBooking(TENANT_ID, "booking-1"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getBooking).toHaveBeenCalledWith(TENANT_ID, "booking-1", expect.anything());
  });

  it("is disabled without a booking id", () => {
    const { result } = renderHook(() => useBooking(TENANT_ID, undefined), { wrapper });

    expect(result.current.fetchStatus).toBe("idle");
    expect(getBooking).not.toHaveBeenCalled();
  });
});

describe("useCancelBooking", () => {
  it("POSTs through cancelBooking(tenantId, bookingId)", async () => {
    const { result } = renderHook(() => useCancelBooking(TENANT_ID), { wrapper });

    result.current.mutate("booking-1");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(cancelBooking).toHaveBeenCalledWith(TENANT_ID, "booking-1");
  });

  it("writes the server-confirmed detail into the cache on success", async () => {
    const { result } = renderHook(() => useCancelBooking(TENANT_ID), { wrapper });

    result.current.mutate("booking-1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryData(bookingKeys.detail(TENANT_ID, "booking-1"))).toEqual(
      CANCELLED_BOOKING
    );
  });

  it("invalidates every list/detail query for this tenant, so an Upcoming→Cancelled move is picked up", async () => {
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useCancelBooking(TENANT_ID), { wrapper });

    result.current.mutate("booking-1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: bookingKeys.tenant(TENANT_ID) });
  });

  it("does not retry a failed cancellation", async () => {
    cancelBooking.mockRejectedValue(new Error("network down"));
    const { result } = renderHook(() => useCancelBooking(TENANT_ID), { wrapper });

    result.current.mutate("booking-1");
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(cancelBooking).toHaveBeenCalledTimes(1);
  });
});
