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

beforeEach(() => {
  let counter = 0;
  vi.stubGlobal("URL", {
    ...URL,
    createObjectURL: vi.fn(() => `blob:mock-${counter++}`),
    revokeObjectURL: vi.fn(),
  });
});

/** A thin controlled-component harness so tests can inspect state after an onChange call. */
function Harness({ initialImage = null }: { initialImage?: DraftImage | null }) {
  const [image, setImage] = useState<DraftImage | null>(initialImage);
  return <ServiceImagePicker image={image} onImageChange={setImage} />;
}

describe("ServiceImagePicker — empty", () => {
  it("renders the dropzone and no preview", () => {
    render(<Harness />);

    expect(screen.getByText(/drag & drop a photo/i)).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});

describe("ServiceImagePicker — selecting a file", () => {
  it("previews the selected image", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, makeFile("a.jpg", "image/jpeg"));

    expect(screen.getByAltText("a.jpg")).toBeInTheDocument();
  });

  it("replaces the previous image when a new one is picked", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, makeFile("a.jpg", "image/jpeg"));
    expect(screen.getByAltText("a.jpg")).toBeInTheDocument();

    await user.upload(input, makeFile("b.png", "image/png"));

    expect(screen.queryByAltText("a.jpg")).not.toBeInTheDocument();
    expect(screen.getByAltText("b.png")).toBeInTheDocument();
    expect(screen.getAllByRole("img")).toHaveLength(1);
  });

  it("only keeps the first file when several are selected at once", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, [makeFile("a.jpg", "image/jpeg"), makeFile("b.png", "image/png")]);

    expect(screen.getByAltText("a.jpg")).toBeInTheDocument();
    expect(screen.queryByAltText("b.png")).not.toBeInTheDocument();
  });

  it("removes the selected image", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, makeFile("a.jpg", "image/jpeg"));
    await user.click(screen.getByRole("button", { name: /remove a.jpg/i }));

    expect(screen.queryByAltText("a.jpg")).not.toBeInTheDocument();
  });
});

describe("ServiceImagePicker — validation", () => {
  it("rejects an unsupported MIME type", () => {
    render(<Harness />);

    // Dropped (not selected via the file picker), because a picker's
    // `accept` attribute pre-filters what a browser even offers as a
    // choice — a real-world way an invalid file still reaches the app is a
    // drag-and-drop, which the OS never filters by MIME type.
    const dropzone = screen.getByText(/drag & drop a photo/i).closest("label") as HTMLElement;
    fireEvent.drop(dropzone, {
      dataTransfer: { files: [makeFile("a.gif", "image/gif")] },
    });

    expect(screen.getByText(/only jpg, png and webp/i)).toBeInTheDocument();
    expect(screen.queryByAltText("a.gif")).not.toBeInTheDocument();
  });

  it("rejects a file over 5 MB", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, makeFile("big.jpg", "image/jpeg", 6 * 1024 * 1024));

    expect(screen.getByText(/5 mb or smaller/i)).toBeInTheDocument();
  });
});
