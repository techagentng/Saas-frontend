"use client";

import { downloadBlob } from "@/lib/media/download-file";
import { useDownloadBookingReceipt } from "@/modules/public-booking/queries";

/**
 * "Download receipt" on the confirmation screen (Scheduling S12). The PDF is
 * entirely backend-generated — this only requests it, via `reference` +
 * `receipt_token` from the booking-creation response, and hands the returned
 * `Blob` to the browser's download mechanism. Nothing about a booking is
 * composed or re-created here: a failed download only means the download
 * failed, never that the booking failed, and Retry re-requests the SAME
 * already-persisted booking's receipt — it cannot create another booking.
 *
 * The button's own `disabled` state while `mutation.isPending` is the
 * double-click guard, exactly like `CustomerDetailsForm`'s submit button.
 *
 * Renders nothing if `reference`/`receiptToken` is ever blank. Every real
 * `201` response carries both, so this should not happen in practice — but
 * it's cheaper and safer to quietly omit a button that could only ever
 * dead-end than to offer one that fires a request certain to fail.
 */
export function ReceiptDownloadButton({
  slug,
  reference,
  receiptToken,
}: {
  slug: string;
  reference: string;
  receiptToken: string;
}) {
  const mutation = useDownloadBookingReceipt(slug);

  if (!reference || !receiptToken) return null;

  function handleDownload() {
    if (mutation.isPending) return;
    mutation.mutate(
      { reference, receiptToken },
      { onSuccess: ({ blob, filename }) => downloadBlob(blob, filename) }
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleDownload}
        disabled={mutation.isPending}
        aria-busy={mutation.isPending}
        aria-label="Download booking receipt"
        className="inline-flex h-11 items-center justify-center rounded-full border border-slate-900/80 px-6 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-70 dark:border-white/70 dark:text-white dark:hover:bg-white dark:hover:text-slate-900"
      >
        {mutation.isPending ? "Downloading…" : "Download receipt"}
      </button>

      {mutation.isError && (
        <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">
          We couldn&apos;t download your receipt.{" "}
          <button
            type="button"
            onClick={handleDownload}
            className="font-medium underline underline-offset-4 hover:text-rose-700 dark:hover:text-rose-300"
          >
            Try again
          </button>
        </p>
      )}
    </div>
  );
}
