/**
 * Triggers a browser "Save As" for an already-fetched `Blob` (e.g. the
 * Scheduling S12 receipt PDF) via a temporary `<a download>` anchor and an
 * object URL — the standard mechanism for a `fetch()`-retrieved binary
 * response, which carries no native download behavior of its own.
 *
 * The anchor is appended to the DOM before `.click()` and removed right
 * after: Safari has historically required the element to actually be in the
 * document for a synthetic click to trigger a download, so skipping that
 * step is the "Safari fallback" rather than an extra branch. The object URL
 * is revoked synchronously afterward — every supported browser processes the
 * click and starts the download in the same tick, so there is nothing to
 * wait for, and not revoking would leak one blob URL per download.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
