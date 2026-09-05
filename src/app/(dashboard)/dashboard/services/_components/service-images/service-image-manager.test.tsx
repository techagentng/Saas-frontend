import { render, screen } from "@testing-library/react";
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
const updateMutate = vi.fn();
const reorderMutate = vi.fn();
const deleteMutate = vi.fn();

vi.mock("@/modules/service-images/queries", () => ({
  useServiceImages: () => imagesResult,
  useUploadServiceImages: () => ({ mutateAsync: uploadMutate, isPending: false }),
  useUpdateServiceImage: () => ({ mutateAsync: updateMutate, isPending: false }),
  useReorderServiceImages: () => ({ mutateAsync: reorderMutate, isPending: false }),
  useDeleteServiceImage: () => ({ mutateAsync: deleteMutate, isPending: false }),
}));

const TENANT_ID = "11111111-1111-4111-8111-111111111111";
const SERVICE_ID = "22222222-2222-4222-8222-222222222222";

const cover: ServiceImage = {
  id: "img-1",
  url: "https://cdn.example.test/img-1.jpg",
  alt_text: null,
  sort_order: 0,
  is_primary: true,
};
const second: ServiceImage = {
  id: "img-2",
  url: "https://cdn.example.test/img-2.jpg",
  alt_text: "Salon interior",
  sort_order: 1,
  is_primary: false,
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
  updateMutate.mockReset().mockResolvedValue(undefined);
  reorderMutate.mockReset().mockResolvedValue(undefined);
  deleteMutate.mockReset().mockResolvedValue(undefined);
});

describe("ServiceImageManager — loads existing media", () => {
  it("renders every existing image with the cover badge on the primary one", () => {
    renderManager(["service.read", "service.update"], [cover, second]);

    expect(screen.getByAltText("Service image")).toBeInTheDocument();
    expect(screen.getByAltText("Salon interior")).toBeInTheDocument();
    expect(screen.getByText("Cover")).toBeInTheDocument();
  });

  it("renders safely with zero images", () => {
    renderManager(["service.read", "service.update"], []);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText(/drag & drop service images/i)).toBeInTheDocument();
  });
});

describe("ServiceImageManager — service.read only (no service.update)", () => {
  it("shows images but hides every management control", () => {
    renderManager(["service.read"], [cover, second]);

    expect(screen.getByAltText("Salon interior")).toBeInTheDocument();
    expect(screen.queryByText(/drag & drop service images/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /set as cover/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /remove/i })).not.toBeInTheDocument();
  });
});

describe("ServiceImageManager — cover and reorder", () => {
  it("promotes a different image to cover", async () => {
    const user = userEvent.setup();
    renderManager(["service.read", "service.update"], [cover, second]);

    await user.click(screen.getByRole("button", { name: /set as cover/i }));

    expect(updateMutate).toHaveBeenCalledWith({
      imageId: "img-2",
      input: { is_primary: true },
    });
  });

  it("reorders by moving an image later, sending the full permutation", async () => {
    const user = userEvent.setup();
    renderManager(["service.read", "service.update"], [cover, second]);

    await user.click(screen.getByRole("button", { name: /move service image later/i }));

    expect(reorderMutate).toHaveBeenCalledWith(["img-2", "img-1"]);
  });
});

describe("ServiceImageManager — delete", () => {
  it("asks for confirmation before deleting, via the existing Dialog primitive", async () => {
    const user = userEvent.setup();
    renderManager(["service.read", "service.update"], [cover, second]);

    await user.click(screen.getByRole("button", { name: /remove salon interior/i }));

    expect(screen.getByRole("dialog", { name: /remove this image/i })).toBeInTheDocument();
    expect(deleteMutate).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /^remove image$/i }));
    expect(deleteMutate).toHaveBeenCalledWith("img-2");
  });

  it("warns that another image becomes the cover when deleting the current cover", async () => {
    const user = userEvent.setup();
    renderManager(["service.read", "service.update"], [cover, second]);

    await user.click(screen.getByRole("button", { name: /remove service image/i }));

    expect(screen.getByText(/another remaining image will automatically become/i)).toBeInTheDocument();
  });
});
