/**
 * Client-side service-image limits, mirrored exactly from the backend's own
 * constants (`model.MaxImagesPerService`, `model.MaxImageSizeBytes`,
 * `model.AllowedImageMIMETypes` in `internal/scheduling/model/service_image.go`).
 *
 * This is UX only — a faster, friendlier rejection than a round-trip. The
 * backend re-validates every one of these independently (it sniffs real
 * bytes rather than trusting a client-declared MIME type) and remains the
 * only authority that can actually enforce them.
 */
export const MAX_IMAGES_PER_SERVICE = 5;
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

/** Keyed by MIME type for a fast `in` check; the value is display-only. */
export const ALLOWED_IMAGE_MIME_TYPES: Record<string, string> = {
  "image/jpeg": "JPG",
  "image/png": "PNG",
  "image/webp": "WebP",
};

/** For the hidden `<input accept>` attribute — same allow-list, joined. */
export const IMAGE_ACCEPT_ATTRIBUTE = Object.keys(ALLOWED_IMAGE_MIME_TYPES).join(",");

export type RejectedImageFile = {
  file: File;
  reason: string;
};

export type ImageValidationResult = {
  accepted: File[];
  rejected: RejectedImageFile[];
};

/**
 * Filters a batch of just-picked files against the type/size/count rules,
 * never silently dropping a bad one — every rejection is returned alongside
 * the reason, so the caller can name exactly which file was refused and why.
 *
 * `existingCount` is however many images the service (or draft) already
 * carries, so the count ceiling is enforced against the real total rather
 * than just this batch in isolation.
 */
export function validateImageFiles(existingCount: number, files: File[]): ImageValidationResult {
  const accepted: File[] = [];
  const rejected: RejectedImageFile[] = [];
  let count = existingCount;

  for (const file of files) {
    if (!(file.type in ALLOWED_IMAGE_MIME_TYPES)) {
      rejected.push({ file, reason: "Only JPG, PNG and WebP images are supported." });
      continue;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      rejected.push({ file, reason: "Each image must be 5 MB or smaller." });
      continue;
    }
    if (count >= MAX_IMAGES_PER_SERVICE) {
      rejected.push({ file, reason: "You can upload up to 5 images per service." });
      continue;
    }
    accepted.push(file);
    count += 1;
  }

  return { accepted, rejected };
}
