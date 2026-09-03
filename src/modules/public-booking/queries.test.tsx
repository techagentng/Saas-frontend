import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api/errors";

const createPublicBooking = vi.fn();
vi.mock("@/modules/public-booking/api", () => ({
  createPublicBooking: (...args: unknown[]) => createPublicBooking(...args),
}));

// Imported after the mock is declared.
import { useCreatePublicBooking } from "@/modules/public-booking/queries";

const PAYLOAD = {
  service_id: "svc1",
  staff_id: "st1",
  date: "2026-09-07",
  start: "09:00",
  customer: { name: "Jane Customer" },
};

const OK = {
  booking: {
    id: "bk-1",
    reference: "NB-ABCD1234",
    status: "CONFIRMED",
    service: { id: "svc1", name: "Gel Manicure" },
    staff: { id: "st1", name: "Ada" },
    date: "2026-09-07",
    start: "09:00",
    end: "09:45",
    timezone: "Africa/Lagos",
  },
};

let queryClient: QueryClient;
let invalidateSpy: ReturnType<typeof vi.spyOn>;

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  createPublicBooking.mockReset();
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
});

describe("useCreatePublicBooking", () => {
  it("POSTs the payload through to createPublicBooking(slug, input)", async () => {
    createPublicBooking.mockResolvedValue(OK);
    const { result } = renderHook(() => useCreatePublicBooking("glamour-nails"), { wrapper });

    result.current.mutate(PAYLOAD);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(createPublicBooking).toHaveBeenCalledWith("glamour-nails", PAYLOAD);
    expect(result.current.data).toEqual(OK);
  });

  it("invalidates every availability query for the business on success", async () => {
    createPublicBooking.mockResolvedValue(OK);
    const { result } = renderHook(() => useCreatePublicBooking("glamour-nails"), { wrapper });

    result.current.mutate(PAYLOAD);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["public-availability", "glamour-nails"],
    });
  });

  it("invalidates availability on a 409 conflict too (so the caller's refetch is fresh)", async () => {
    createPublicBooking.mockRejectedValue(
      new ApiError(409, { code: "BOOKING_SLOT_UNAVAILABLE", message: "gone" })
    );
    const { result } = renderHook(() => useCreatePublicBooking("glamour-nails"), { wrapper });

    result.current.mutate(PAYLOAD);
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["public-availability", "glamour-nails"],
    });
  });

  it("does NOT invalidate availability on a non-conflict failure", async () => {
    createPublicBooking.mockRejectedValue(
      new ApiError(500, { code: "INTERNAL_ERROR", message: "boom" })
    );
    const { result } = renderHook(() => useCreatePublicBooking("glamour-nails"), { wrapper });

    result.current.mutate(PAYLOAD);
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it("does not retry a failed booking POST", async () => {
    createPublicBooking.mockRejectedValue(
      new ApiError(409, { code: "BOOKING_SLOT_UNAVAILABLE", message: "gone" })
    );
    const { result } = renderHook(() => useCreatePublicBooking("glamour-nails"), { wrapper });

    result.current.mutate(PAYLOAD);
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(createPublicBooking).toHaveBeenCalledTimes(1);
  });
});
