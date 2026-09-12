import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ReceiptDownloadButton } from "./receipt-download-button";

type MutationStub = {
  mutate: ReturnType<typeof vi.fn>;
  isPending: boolean;
  isError: boolean;
};

let mutation: MutationStub;

vi.mock("@/modules/public-booking/queries", () => ({
  useDownloadBookingReceipt: () => mutation,
}));

const downloadBlob = vi.fn();
vi.mock("@/lib/media/download-file", () => ({ downloadBlob: (...args: unknown[]) => downloadBlob(...args) }));

beforeEach(() => {
  downloadBlob.mockReset();
  mutation = { mutate: vi.fn(), isPending: false, isError: false };
});

describe("ReceiptDownloadButton — happy path", () => {
  it("has a clear accessible name distinct from its visible label", () => {
    render(<ReceiptDownloadButton slug="glamour-nails" reference="NB-1A2B3C4D" receiptToken="rtok_abc" />);

    const button = screen.getByRole("button", { name: /download booking receipt/i });
    expect(button).toHaveTextContent("Download receipt");
  });

  it("requests the receipt exactly once per click, scoped to this booking", async () => {
    const user = userEvent.setup();
    render(<ReceiptDownloadButton slug="glamour-nails" reference="NB-1A2B3C4D" receiptToken="rtok_abc" />);

    await user.click(screen.getByRole("button", { name: /download booking receipt/i }));

    expect(mutation.mutate).toHaveBeenCalledTimes(1);
    expect(mutation.mutate).toHaveBeenCalledWith(
      { reference: "NB-1A2B3C4D", receiptToken: "rtok_abc" },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
  });

  it("hands the resolved Blob and filename to the browser download utility", async () => {
    const user = userEvent.setup();
    const blob = new Blob(["%PDF-"], { type: "application/pdf" });
    mutation.mutate = vi.fn((_vars, options) => {
      options?.onSuccess?.({ blob, filename: "booking-NB-1A2B3C4D.pdf" });
    });
    render(<ReceiptDownloadButton slug="glamour-nails" reference="NB-1A2B3C4D" receiptToken="rtok_abc" />);

    await user.click(screen.getByRole("button", { name: /download booking receipt/i }));

    expect(downloadBlob).toHaveBeenCalledWith(blob, "booking-NB-1A2B3C4D.pdf");
  });
});

describe("ReceiptDownloadButton — loading state", () => {
  it("shows Downloading…, disables the button, and blocks a duplicate click while pending", async () => {
    const user = userEvent.setup();
    mutation.isPending = true;
    render(<ReceiptDownloadButton slug="glamour-nails" reference="NB-1A2B3C4D" receiptToken="rtok_abc" />);

    const button = screen.getByRole("button", { name: /download booking receipt/i });
    expect(button).toHaveTextContent("Downloading…");
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");

    await user.click(button);
    expect(mutation.mutate).not.toHaveBeenCalled();
  });
});

describe("ReceiptDownloadButton — error + retry", () => {
  it("keeps the button visible and offers Retry without implying the booking failed", async () => {
    const user = userEvent.setup();
    mutation.isError = true;
    render(<ReceiptDownloadButton slug="glamour-nails" reference="NB-1A2B3C4D" receiptToken="rtok_abc" />);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(/couldn't download your receipt/i);
    expect(alert).not.toHaveTextContent(/booking/i);
    expect(screen.getByRole("button", { name: /download booking receipt/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /try again/i }));
    expect(mutation.mutate).toHaveBeenCalledTimes(1);
  });
});

describe("ReceiptDownloadButton — missing token/reference", () => {
  it("renders nothing rather than offering a request certain to fail", () => {
    const { container } = render(
      <ReceiptDownloadButton slug="glamour-nails" reference="NB-1A2B3C4D" receiptToken="" />
    );
    expect(container).toBeEmptyDOMElement();
    expect(mutation.mutate).not.toHaveBeenCalled();
  });

  it("also renders nothing for a blank reference", () => {
    const { container } = render(
      <ReceiptDownloadButton slug="glamour-nails" reference="" receiptToken="rtok_abc" />
    );
    expect(container).toBeEmptyDOMElement();
  });
});
