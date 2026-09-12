import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ServiceImage } from "@/modules/service-images/types";
import type { Permission } from "@/types/permission";

import { ServiceImageManager } from "./service-image-manager";

const granted = new Set<Permission>();
vi.mock("@/providers/permissions-provider", () => ({
  useCan: (permission: Permission) => granted.has(permission),
}));

const imagesResult = {
  data: [] as ServiceImage[],
  isPending: false,
  isSuccess: true,
  isError: false,
  error: null as unknown,
  refetch: vi.fn(),
};

const uploadMutate = vi.fn();
const deleteMutate = vi.fn();

vi.mock("@/modules/service-images/queries", () => ({
  useServiceImages: () => imagesResult,
  useUploadServiceImages: () => ({ mutateAsync: uploadMutate, isPending: false }),
  useDeleteServiceImage: () => ({ mutateAsync: deleteMutate, isPending: false }),
}));

function makeFile(name: string, type: string, size = 1024): File {
  const file = new File([new Uint8Array(size)], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

const TENANT_ID = "11111111-1111-4111-8111-111111111111";
const SERVICE_ID = "22222222-2222-4222-8222-222222222222";

const cover: ServiceImage = {
  id: "img-1",
  url: "https://cdn.example.test/img-1.jpg",
  alt_text: null,
  sort_order: 0,
  is_primary: true,
};

function renderManager(permissions: Permission[], images: ServiceImage[] = []) {
  granted.clear();
  for (const p of permissions) granted.add(p);
  imagesResult.data = images;
  imagesResult.isSuccess = true;
  imagesResult.isPending = false;
  imagesResult.isError = false;
  return render(<ServiceImageManager tenantId={TENANT_ID} serviceId={SERVICE_ID} />);
}

beforeEach(() => {
  granted.clear();
  uploadMutate.mockReset().mockResolvedValue(undefined);
  deleteMutate.mockReset().mockResolvedValue(undefined);
});

describe("ServiceImageManager — loads the existing image", () => {
  it("renders the image", () => {
    renderManager(["service.read", "service.update"], [cover]);

    expect(screen.getByAltText("Service image")).toBeInTheDocument();
  });

  it("renders safely with no image", () => {
    renderManager(["service.read", "service.update"], []);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText(/drag & drop a photo/i)).toBeInTheDocument();
  });
});

describe("ServiceImageManager — service.read only (no service.update)", () => {
  it("shows the image but hides every management control", () => {
    renderManager(["service.read"], [cover]);

    expect(screen.getByAltText("Service image")).toBeInTheDocument();
    expect(screen.queryByText(/drag & drop a photo/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /remove/i })).not.toBeInTheDocument();
  });
});

describe("ServiceImageManager — replace", () => {
  it("deletes the current image then uploads the new one", async () => {
    const user = userEvent.setup();
    renderManager(["service.read", "service.update"], [cover]);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, makeFile("new.jpg", "image/jpeg"));

    expect(deleteMutate).toHaveBeenCalledWith("img-1");
    expect(uploadMutate).toHaveBeenCalledWith([expect.objectContaining({ name: "new.jpg" })]);
  });

  it("uploads directly when there is no existing image to delete", async () => {
    const user = userEvent.setup();
    renderManager(["service.read", "service.update"], []);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, makeFile("new.jpg", "image/jpeg"));

    expect(deleteMutate).not.toHaveBeenCalled();
    expect(uploadMutate).toHaveBeenCalledWith([expect.objectContaining({ name: "new.jpg" })]);
  });

  it("rejects an unsupported file without deleting the current image", () => {
    renderManager(["service.read", "service.update"], [cover]);

    // Dropped, not selected via the file picker — the input's `accept`
    // attribute pre-filters what a real file picker even offers, so a real
    // way an invalid file still reaches the app is a drag-and-drop.
    const dropzone = screen.getByText(/drag & drop to replace/i).closest("label") as HTMLElement;
    fireEvent.drop(dropzone, { dataTransfer: { files: [makeFile("bad.gif", "image/gif")] } });

    expect(screen.getByText(/only jpg, png and webp/i)).toBeInTheDocument();
    expect(deleteMutate).not.toHaveBeenCalled();
    expect(uploadMutate).not.toHaveBeenCalled();
  });
});

describe("ServiceImageManager — delete", () => {
  it("asks for confirmation before deleting, via the existing Dialog primitive", async () => {
    const user = userEvent.setup();
    renderManager(["service.read", "service.update"], [cover]);

    await user.click(screen.getByRole("button", { name: /remove service image/i }));

    expect(screen.getByRole("dialog", { name: /remove this image/i })).toBeInTheDocument();
    expect(deleteMutate).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /^remove image$/i }));
    expect(deleteMutate).toHaveBeenCalledWith("img-1");
  });
});
