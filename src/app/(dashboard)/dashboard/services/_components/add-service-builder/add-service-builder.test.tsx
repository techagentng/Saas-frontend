import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ServiceCategory } from "@/modules/service-categories/types";
import type { ServiceSuggestion } from "@/modules/service-suggestions/types";

import { AddServiceBuilder } from "./add-service-builder";

const TENANT_ID = "11111111-1111-4111-8111-111111111111";

const categoriesResult = {
  data: [] as ServiceCategory[],
  isPending: false,
  isSuccess: true,
  isError: false,
  error: null as unknown,
  refetch: vi.fn(),
};
const suggestionsResult = {
  data: [] as ServiceSuggestion[],
  isPending: false,
  isSuccess: true,
  isError: false,
  error: null as unknown,
  refetch: vi.fn(),
};

const createCategoryMutate = vi.fn();
const createServiceMutate = vi.fn();

vi.mock("@/modules/service-categories/queries", () => ({
  useServiceCategories: () => categoriesResult,
  useCreateServiceCategory: () => ({ mutateAsync: createCategoryMutate, isPending: false }),
}));

vi.mock("@/modules/service-suggestions/queries", () => ({
  useServiceSuggestions: () => suggestionsResult,
}));

vi.mock("@/modules/services/queries", () => ({
  useCreateService: () => ({ mutateAsync: createServiceMutate, isPending: false }),
}));

const uploadServiceImagesMock = vi.fn();
const updateServiceImageMock = vi.fn();
const listServiceImagesMock = vi.fn();

vi.mock("@/modules/service-images/api", () => ({
  uploadServiceImages: (...args: unknown[]) => uploadServiceImagesMock(...args),
  updateServiceImage: (...args: unknown[]) => updateServiceImageMock(...args),
  listServiceImages: (...args: unknown[]) => listServiceImagesMock(...args),
}));

function makeFile(name: string, type = "image/jpeg"): File {
  return new File([new Uint8Array(1024)], name, { type });
}

const NATURAL_NAILS: ServiceCategory = {
  id: "cat-1",
  name: "Natural Nails",
  sort_order: 0,
  status: "ACTIVE",
  created_at: "2026-08-27T10:00:00Z",
  updated_at: "2026-08-27T10:00:00Z",
};

const RUSSIAN_MANICURE: ServiceSuggestion = {
  category: "Natural Nails",
  name: "Russian Manicure",
  description: "Precision cuticle work with gel polish.",
  suggested_duration_minutes: 60,
};

beforeEach(() => {
  categoriesResult.data = [NATURAL_NAILS];
  categoriesResult.isSuccess = true;
  categoriesResult.isPending = false;
  categoriesResult.isError = false;

  suggestionsResult.data = [RUSSIAN_MANICURE];
  suggestionsResult.isSuccess = true;
  suggestionsResult.isPending = false;
  suggestionsResult.isError = false;

  createCategoryMutate.mockReset();
  createServiceMutate.mockReset().mockResolvedValue({
    id: "new-service-id",
    name: "Russian Manicure",
    description: null,
    duration_minutes: 60,
    price_minor: 500000,
    category_id: "cat-1",
    status: "ACTIVE",
    created_at: "2026-09-05T10:00:00Z",
    updated_at: "2026-09-05T10:00:00Z",
  });

  uploadServiceImagesMock.mockReset().mockResolvedValue({
    images: [{ id: "img-1", url: "https://cdn.example.test/img-1.jpg", alt_text: null, sort_order: 0, is_primary: true }],
  });
  updateServiceImageMock.mockReset().mockResolvedValue(undefined);
  listServiceImagesMock.mockReset().mockResolvedValue([]);
});

describe("AddServiceBuilder — service creation followed by image upload", () => {
  it("creates the service, then uploads the selected image against the real service id", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<AddServiceBuilder tenantId={TENANT_ID} currency="NGN" onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: /^natural nails/i }));
    await user.click(screen.getByRole("checkbox", { name: /russian manicure/i }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.type(screen.getByLabelText("Price"), "5000");

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, makeFile("nails.jpg"));

    await user.click(screen.getByRole("button", { name: /create 1 service/i }));

    expect(createServiceMutate).toHaveBeenCalledTimes(1);
    expect(createServiceMutate).toHaveBeenCalledWith(
      expect.objectContaining({ category_id: "cat-1", name: "Russian Manicure" })
    );

    await vi.waitFor(() => expect(uploadServiceImagesMock).toHaveBeenCalledTimes(1));
    expect(uploadServiceImagesMock).toHaveBeenCalledWith(
      TENANT_ID,
      "new-service-id",
      expect.arrayContaining([expect.any(File)])
    );

    await vi.waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("does not upload anything when no image was selected", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<AddServiceBuilder tenantId={TENANT_ID} currency="NGN" onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: /^natural nails/i }));
    await user.click(screen.getByRole("checkbox", { name: /russian manicure/i }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.type(screen.getByLabelText("Price"), "5000");
    await user.click(screen.getByRole("button", { name: /create 1 service/i }));

    await vi.waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(uploadServiceImagesMock).not.toHaveBeenCalled();
  });
});

describe("AddServiceBuilder — image upload fails after a successful service creation", () => {
  it("reports the failure without pretending the service wasn't created, and offers retry", async () => {
    uploadServiceImagesMock.mockRejectedValueOnce(new Error("network error"));

    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<AddServiceBuilder tenantId={TENANT_ID} currency="NGN" onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: /^natural nails/i }));
    await user.click(screen.getByRole("checkbox", { name: /russian manicure/i }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.type(screen.getByLabelText("Price"), "5000");

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, makeFile("nails.jpg"));
    await user.click(screen.getByRole("button", { name: /create 1 service/i }));

    expect(
      (await screen.findAllByText(/service created, but some images could not be uploaded/i)).length
    ).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /retry image upload/i })).toBeInTheDocument();
    // The dialog stays open — a failed image upload is not a reason to lose
    // the customize step or discard the just-created service.
    expect(onClose).not.toHaveBeenCalled();
    expect(createServiceMutate).toHaveBeenCalledTimes(1);
  });

  it("retrying the image upload calls createService zero additional times", async () => {
    uploadServiceImagesMock.mockRejectedValueOnce(new Error("network error"));

    const user = userEvent.setup();
    render(<AddServiceBuilder tenantId={TENANT_ID} currency="NGN" onClose={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /^natural nails/i }));
    await user.click(screen.getByRole("checkbox", { name: /russian manicure/i }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.type(screen.getByLabelText("Price"), "5000");

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, makeFile("nails.jpg"));
    await user.click(screen.getByRole("button", { name: /create 1 service/i }));
    await screen.findByRole("button", { name: /retry image upload/i });

    expect(createServiceMutate).toHaveBeenCalledTimes(1);

    uploadServiceImagesMock.mockResolvedValueOnce({
      images: [{ id: "img-1", url: "https://cdn.example.test/img-1.jpg", alt_text: null, sort_order: 0, is_primary: true }],
    });
    await user.click(screen.getByRole("button", { name: /retry image upload/i }));

    await vi.waitFor(() => expect(uploadServiceImagesMock).toHaveBeenCalledTimes(2));
    // Still exactly one createService call, ever — the retry only re-ran the upload.
    expect(createServiceMutate).toHaveBeenCalledTimes(1);
    expect(uploadServiceImagesMock).toHaveBeenLastCalledWith(TENANT_ID, "new-service-id", expect.any(Array));
  });
});

describe("AddServiceBuilder — tenant switch clears stale draft state", () => {
  it("discards the selected category and picked images when remounted for a different tenant", async () => {
    const OTHER_TENANT_ID = "99999999-9999-4999-8999-999999999999";
    const user = userEvent.setup();

    // Mirrors the real call site (`service-catalog.tsx`), which keys this
    // component by tenantId specifically so a tenant switch forces a full
    // remount rather than leaving stale selection/draft state behind.
    const { rerender } = render(
      <AddServiceBuilder key={TENANT_ID} tenantId={TENANT_ID} currency="NGN" onClose={vi.fn()} />
    );

    await user.click(screen.getByRole("button", { name: /^natural nails/i }));
    expect(await screen.findByText(/russian manicure/i)).toBeInTheDocument();

    rerender(
      <AddServiceBuilder key={OTHER_TENANT_ID} tenantId={OTHER_TENANT_ID} currency="NGN" onClose={vi.fn()} />
    );

    // Back at step 1 — the previous tenant's category selection is gone,
    // not merely hidden.
    expect(screen.queryByText(/russian manicure/i)).not.toBeInTheDocument();
    expect(screen.getByText(/choose a category/i)).toBeInTheDocument();
  });
});
