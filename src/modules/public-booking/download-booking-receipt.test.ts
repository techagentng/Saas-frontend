import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api/errors";

import { downloadBookingReceipt } from "./api";

function pdfResponse(headers: Record<string, string> = {}): Response {
  // A plain string body — jsdom's `Blob` does not implement `.stream()`, which
  // the `Response` constructor needs when given a `Blob` body directly.
  // `Response.blob()` still produces a real Blob from this on the read side.
  return new Response("%PDF-1.4 fake", { status: 200, headers: { "Content-Type": "application/pdf", ...headers } });
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:8090/api");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("downloadBookingReceipt — request shape", () => {
  it("requests the exact S12-BE endpoint with the token as a query param, anonymously", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(pdfResponse());
    vi.stubGlobal("fetch", fetchSpy);

    await downloadBookingReceipt("glamour-nails", "NB-1A2B3C4D", "rtok_abc123");

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(String(url)).toBe(
      "http://localhost:8090/api/v1/public/tenants/glamour-nails/bookings/NB-1A2B3C4D/receipt?token=rtok_abc123"
    );
    // Anonymous: no Authorization header, no credentials sent — matches every
    // other call in this module (publicApiGet/publicApiPost).
    expect(init?.headers).toBeUndefined();
    expect(init?.credentials).toBeUndefined();
  });

  it("URL-encodes the slug and reference", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(pdfResponse());
    vi.stubGlobal("fetch", fetchSpy);

    await downloadBookingReceipt("a slug", "NB/weird", "tok");

    const [url] = fetchSpy.mock.calls[0];
    expect(String(url)).toContain("/tenants/a%20slug/bookings/NB%2Fweird/receipt");
  });
});

describe("downloadBookingReceipt — success", () => {
  it("resolves the PDF as a Blob", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(pdfResponse()));

    const result = await downloadBookingReceipt("glamour-nails", "NB-1A2B3C4D", "rtok_abc123");

    // Not `toBeInstanceOf(Blob)`: jsdom's `Response.blob()` returns a Blob
    // from its own realm, which fails a same-class identity check against
    // this test file's `Blob` global even though it is a real, usable Blob —
    // duck-typing its shape is the reliable check here.
    expect(typeof result.blob.size).toBe("number");
    expect(result.blob.type).toBe("application/pdf");
  });

  it("uses the server's filename from Content-Disposition when present", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(pdfResponse({ "Content-Disposition": 'attachment; filename="booking-NB-1A2B3C4D.pdf"' }))
    );

    const result = await downloadBookingReceipt("glamour-nails", "NB-1A2B3C4D", "rtok_abc123");

    expect(result.filename).toBe("booking-NB-1A2B3C4D.pdf");
  });

  it("falls back to booking-<reference>.pdf when Content-Disposition is missing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(pdfResponse()));

    const result = await downloadBookingReceipt("glamour-nails", "NB-1A2B3C4D", "rtok_abc123");

    expect(result.filename).toBe("booking-NB-1A2B3C4D.pdf");
  });
});

describe("downloadBookingReceipt — failure", () => {
  it("normalizes a non-2xx response into the same ApiError every other public call throws", async () => {
    const errorBody = { error: { code: "BOOKING_NOT_FOUND", message: "booking not found" } };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify(errorBody), { status: 404 }))
    );

    await expect(downloadBookingReceipt("glamour-nails", "NB-1A2B3C4D", "wrong-token")).rejects.toMatchObject({
      code: "BOOKING_NOT_FOUND",
    });
  });

  it("propagates as an ApiError instance, not a bare Error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: { code: "INTERNAL_ERROR", message: "boom" } }), { status: 500 })
      )
    );

    try {
      await downloadBookingReceipt("glamour-nails", "NB-1A2B3C4D", "rtok_abc123");
      expect.unreachable("expected downloadBookingReceipt to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
    }
  });
});
