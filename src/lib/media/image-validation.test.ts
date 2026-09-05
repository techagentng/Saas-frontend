import { describe, expect, it } from "vitest";

import { MAX_IMAGE_SIZE_BYTES, validateImageFiles } from "@/lib/media/image-validation";

function makeFile(name: string, type: string, size: number): File {
  const file = new File([new Uint8Array(Math.max(size, 0))], name, { type });
  // jsdom's File already reports `size` from the blob content above; this
  // guard exists only so a 0-byte fixture doesn't silently become a 1-byte
  // one from Math.max above and drift the size the test actually asserts on.
  Object.defineProperty(file, "size", { value: size });
  return file;
}

describe("validateImageFiles", () => {
  it("accepts a JPEG/PNG/WebP file under the size ceiling", () => {
    const files = [
      makeFile("a.jpg", "image/jpeg", 1024),
      makeFile("b.png", "image/png", 1024),
      makeFile("c.webp", "image/webp", 1024),
    ];

    const result = validateImageFiles(0, files);

    expect(result.accepted).toEqual(files);
    expect(result.rejected).toEqual([]);
  });

  it("rejects an unsupported MIME type with a friendly message", () => {
    const file = makeFile("a.gif", "image/gif", 1024);

    const result = validateImageFiles(0, [file]);

    expect(result.accepted).toEqual([]);
    expect(result.rejected).toEqual([
      { file, reason: "Only JPG, PNG and WebP images are supported." },
    ]);
  });

  it("rejects a file over 5 MB with a friendly message", () => {
    const file = makeFile("big.jpg", "image/jpeg", MAX_IMAGE_SIZE_BYTES + 1);

    const result = validateImageFiles(0, [file]);

    expect(result.accepted).toEqual([]);
    expect(result.rejected).toEqual([{ file, reason: "Each image must be 5 MB or smaller." }]);
  });

  it("accepts a file exactly at the 5 MB ceiling", () => {
    const file = makeFile("exact.jpg", "image/jpeg", MAX_IMAGE_SIZE_BYTES);

    const result = validateImageFiles(0, [file]);

    expect(result.accepted).toEqual([file]);
  });

  it("enforces the 5-image ceiling against existingCount plus this batch", () => {
    const files = [1, 2, 3].map((n) => makeFile(`${n}.jpg`, "image/jpeg", 1024));

    const result = validateImageFiles(3, files);

    expect(result.accepted).toHaveLength(2);
    expect(result.rejected).toEqual([
      { file: files[2], reason: "You can upload up to 5 images per service." },
    ]);
  });

  it("keeps every valid file and identifies the specific rejected one in a mixed batch", () => {
    const good = makeFile("good.png", "image/png", 1024);
    const badType = makeFile("bad.gif", "image/gif", 1024);
    const badSize = makeFile("toobig.jpg", "image/jpeg", MAX_IMAGE_SIZE_BYTES + 1);

    const result = validateImageFiles(0, [good, badType, badSize]);

    expect(result.accepted).toEqual([good]);
    expect(result.rejected.map((r) => r.file)).toEqual([badType, badSize]);
  });
});
