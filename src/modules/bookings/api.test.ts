import { beforeEach, describe, expect, it, vi } from "vitest";

const get = vi.fn();
const post = vi.fn();
vi.mock("@/lib/api/client", () => ({
  apiClient: { get: (...args: unknown[]) => get(...args), post: (...args: unknown[]) => post(...args) },
}));

// Imported after the mock is declared.
import { cancelBooking, getBooking, listBookings } from "./api";

const TENANT_ID = "11111111-1111-4111-8111-111111111111";

beforeEach(() => {
  get.mockReset().mockResolvedValue([]);
  post.mockReset().mockResolvedValue({});
});

describe("listBookings — request construction", () => {
  it("always sends view explicitly, even the default", async () => {
    await listBookings(TENANT_ID, { view: "UPCOMING" });

    expect(get).toHaveBeenCalledWith(`/v1/tenants/${TENANT_ID}/bookings`, {
      query: { view: "UPCOMING", staff_id: undefined, service_id: undefined, date: undefined },
      signal: undefined,
    });
  });

  it("sends staff_id when set", async () => {
    await listBookings(TENANT_ID, { view: "UPCOMING", staffId: "staff-1" });

    expect(get).toHaveBeenCalledWith(
      `/v1/tenants/${TENANT_ID}/bookings`,
      expect.objectContaining({ query: expect.objectContaining({ staff_id: "staff-1" }) })
    );
  });

  it("sends service_id when set", async () => {
    await listBookings(TENANT_ID, { view: "UPCOMING", serviceId: "svc-1" });

    expect(get).toHaveBeenCalledWith(
      `/v1/tenants/${TENANT_ID}/bookings`,
      expect.objectContaining({ query: expect.objectContaining({ service_id: "svc-1" }) })
    );
  });

  it("sends date when set", async () => {
    await listBookings(TENANT_ID, { view: "UPCOMING", date: "2026-09-12" });

    expect(get).toHaveBeenCalledWith(
      `/v1/tenants/${TENANT_ID}/bookings`,
      expect.objectContaining({ query: expect.objectContaining({ date: "2026-09-12" }) })
    );
  });

  it("combines every filter into a single request", async () => {
    await listBookings(TENANT_ID, {
      view: "CANCELLED",
      staffId: "staff-1",
      serviceId: "svc-1",
      date: "2026-09-12",
    });

    expect(get).toHaveBeenCalledWith(`/v1/tenants/${TENANT_ID}/bookings`, {
      query: { view: "CANCELLED", staff_id: "staff-1", service_id: "svc-1", date: "2026-09-12" },
      signal: undefined,
    });
  });

  it("never invents a page/pageSize parameter", async () => {
    await listBookings(TENANT_ID, { view: "ALL" });

    const [, options] = get.mock.calls[0] as [string, { query: Record<string, unknown> }];
    expect(Object.keys(options.query).sort()).toEqual(["date", "service_id", "staff_id", "view"]);
  });
});

describe("getBooking", () => {
  it("requests the exact detail endpoint", async () => {
    await getBooking(TENANT_ID, "booking-1");

    expect(get).toHaveBeenCalledWith(`/v1/tenants/${TENANT_ID}/bookings/booking-1`, { signal: undefined });
  });
});

describe("cancelBooking", () => {
  it("POSTs to the cancel endpoint with no request body", async () => {
    await cancelBooking(TENANT_ID, "booking-1");

    expect(post).toHaveBeenCalledWith(
      `/v1/tenants/${TENANT_ID}/bookings/booking-1/cancel`,
      undefined,
      { signal: undefined }
    );
  });
});
