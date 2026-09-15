import { beforeEach, describe, expect, it, vi } from "vitest";

const get = vi.fn();
const post = vi.fn();
vi.mock("@/lib/api/client", () => ({
  apiClient: { get: (...args: unknown[]) => get(...args), post: (...args: unknown[]) => post(...args) },
}));

// Imported after the mock is declared.
import { cancelBooking, completeBooking, getBooking, listBookings, markBookingNoShow, rescheduleBooking } from "./api";

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

describe("rescheduleBooking", () => {
  it("POSTs to the exact S12-BE endpoint with {date, start} only", async () => {
    await rescheduleBooking(TENANT_ID, "booking-1", { date: "2026-09-27", start: "16:00" });

    expect(post).toHaveBeenCalledWith(
      `/v1/tenants/${TENANT_ID}/bookings/booking-1/reschedule`,
      { date: "2026-09-27", start: "16:00" },
      { signal: undefined }
    );
  });

  it("never sends end, duration, service id, staff id, customer or price", async () => {
    await rescheduleBooking(TENANT_ID, "booking-1", { date: "2026-09-27", start: "16:00" });

    const [, body] = post.mock.calls[0] as [string, Record<string, unknown>];
    expect(Object.keys(body).sort()).toEqual(["date", "start"]);
  });
});

describe("completeBooking", () => {
  it("POSTs to the exact S13-BE complete endpoint with no request body", async () => {
    await completeBooking(TENANT_ID, "booking-1");

    expect(post).toHaveBeenCalledWith(
      `/v1/tenants/${TENANT_ID}/bookings/booking-1/complete`,
      undefined,
      { signal: undefined }
    );
  });
});

describe("markBookingNoShow", () => {
  it("POSTs to the exact S13-BE no-show endpoint with no request body", async () => {
    await markBookingNoShow(TENANT_ID, "booking-1");

    expect(post).toHaveBeenCalledWith(
      `/v1/tenants/${TENANT_ID}/bookings/booking-1/no-show`,
      undefined,
      { signal: undefined }
    );
  });
});
