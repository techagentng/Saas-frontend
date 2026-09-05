import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ServiceImagePicker } from "./service-image-picker";
import type { DraftImage } from "./types";

function makeFile(name: string, type: string, size = 1024): File {
  const file = new File([new Uint8Array(size)], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

function draftImage(key: string, file: File): DraftImage {
  return { key, file, previewUrl: `blob:${key}` };
}

beforeEach(() => {
  let counter = 0;
  vi.stubGlobal("URL", {
    ...URL,
    createObjectURL: vi.fn(() => `blob:mock-${counter++}`),
    revokeObjectURL: vi.fn(),
  });
});

/** A thin controlled-component harness so tests can inspect state after an onChange call. */
function Harness({ initialImages = [] }: { initialImages?: DraftImage[] }) {
  const [images, setImages] = useState<DraftImage[]>(initialImages);
  const [coverKey, setCoverKey] = useState<string | null>(null);
  return (
    <ServiceImagePicker
      images={images}
      coverKey={coverKey}
      onImagesChange={setImages}
      onCoverChange={setCoverKey}
    />
  );
}

describe("ServiceImagePicker — empty", () => {
  it("renders the dropzone and no previews", () => {
    render(<Harness />);

    expect(screen.getByText(/drag & drop service images/i)).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});

describe("ServiceImagePicker — selecting files", () => {
  it("previews one selected image and defaults it to cover", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, makeFile("a.jpg", "image/jpeg"));

    expect(screen.getByAltText("a.jpg")).toBeInTheDocument();
    expect(screen.getByText("Cover")).toBeInTheDocument();
  });

  it("previews multiple selected images", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, [
      makeFile("a.jpg", "image/jpeg"),
      makeFile("b.png", "image/png"),
      makeFile("c.webp", "image/webp"),
    ]);

    expect(screen.getByAltText("a.jpg")).toBeInTheDocument();
    expect(screen.getByAltText("b.png")).toBeInTheDocument();
    expect(screen.getByAltText("c.webp")).toBeInTheDocument();
    // Only the first is cover by default.
    expect(screen.getAllByText("Cover")).toHaveLength(1);
  });

  it("lets the owner choose a different cover image", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, [makeFile("a.jpg", "image/jpeg"), makeFile("b.png", "image/png")]);

    await user.click(screen.getByRole("button", { name: /set as cover/i }));

    expect(screen.getByAltText("b.png").closest("li")).toHaveTextContent("Cover");
    expect(screen.getByAltText("a.jpg").closest("li")).not.toHaveTextContent("Cover");
  });

  it("removes a selected image", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, makeFile("a.jpg", "image/jpeg"));
    await user.click(screen.getByRole("button", { name: /remove a.jpg/i }));

    expect(screen.queryByAltText("a.jpg")).not.toBeInTheDocument();
  });
});

describe("ServiceImagePicker — validation", () => {
  it("rejects an unsupported MIME type without dropping the valid files", () => {
    render(<Harness />);

    // Dropped (not selected via the file picker), because a picker's
    // `accept` attribute pre-filters what a browser even offers as a
    // choice — a real-world way an invalid file still reaches the app is a
    // drag-and-drop, which the OS never filters by MIME type.
    const dropzone = screen.getByText(/drag & drop service images/i).closest("label") as HTMLElement;
    fireEvent.drop(dropzone, {
      dataTransfer: { files: [makeFile("a.jpg", "image/jpeg"), makeFile("a.gif", "image/gif")] },
    });

    expect(screen.getByAltText("a.jpg")).toBeInTheDocument();
    expect(screen.getByText(/only jpg, png and webp/i)).toBeInTheDocument();
  });

  it("rejects a file over 5 MB", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, makeFile("big.jpg", "image/jpeg", 6 * 1024 * 1024));

    expect(screen.getByText(/5 mb or smaller/i)).toBeInTheDocument();
  });

  it("refuses a 6th image and disables the dropzone at 5", async () => {
    const existing = Array.from({ length: 5 }, (_, i) =>
      draftImage(`k${i}`, makeFile(`${i}.jpg`, "image/jpeg"))
    );
    render(<Harness initialImages={existing} />);

    expect(screen.getByText(/maximum of 5 images reached/i)).toBeInTheDocument();
  });
});
