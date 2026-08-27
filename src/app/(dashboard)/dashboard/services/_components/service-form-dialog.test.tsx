import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Service } from "@/modules/services/types";

import { ServiceFormDialog } from "./service-form-dialog";

/**
 * The money boundary end to end: what an owner types in major units must reach
 * the API as exact integer minor units. Asserting it at the parse function
 * alone would not catch a component that re-derives the value some other way.
 */

const createMutate = vi.fn();
const updateMutate = vi.fn();

vi.mock("@/modules/services/queries", () => ({
  useCreateService: () => ({ mutateAsync: createMutate, isPending: false }),
  useUpdateService: () => ({ mutateAsync: updateMutate, isPending: false }),
  useArchiveService: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

const TENANT_ID = "11111111-1111-4111-8111-111111111111";

const manicure: Service = {
  id: "33333333-3333-4333-8333-333333333333",
  name: "Gel Manicure",
  description: "Soak-off gel.",
  duration_minutes: 60,
  price_minor: 1999,
  status: "ACTIVE",
  created_at: "2026-08-27T10:00:00Z",
  updated_at: "2026-08-27T10:00:00Z",
};

beforeEach(() => {
  createMutate.mockReset();
  createMutate.mockResolvedValue(manicure);
  updateMutate.mockReset();
  updateMutate.mockResolvedValue(manicure);
});

describe("ServiceFormDialog — create", () => {
  it("sends the typed price as exact minor units", async () => {
    const user = userEvent.setup();
    render(<ServiceFormDialog tenantId={TENANT_ID} currency="NGN" onClose={vi.fn()} />);

    await user.type(screen.getByLabelText("Name"), "Gel Manicure");
    await user.type(screen.getByLabelText("Price"), "19.99");
    await user.click(screen.getByRole("button", { name: "45 min" }));
    await user.click(screen.getByRole("button", { name: "Add service" }));

    expect(createMutate).toHaveBeenCalledWith({
      name: "Gel Manicure",
      description: null,
      duration_minutes: 45,
      price_minor: 1999,
    });
  });

  it("sends a grouped price and a custom duration unchanged in meaning", async () => {
    const user = userEvent.setup();
    render(<ServiceFormDialog tenantId={TENANT_ID} currency="NGN" onClose={vi.fn()} />);

    await user.type(screen.getByLabelText("Name"), "  Full Set  ");
    await user.type(screen.getByLabelText("Price"), "10,000.00");
    await user.clear(screen.getByLabelText("Or enter minutes"));
    await user.type(screen.getByLabelText("Or enter minutes"), "75");
    await user.click(screen.getByRole("button", { name: "Add service" }));

    expect(createMutate).toHaveBeenCalledWith({
      name: "Full Set",
      description: null,
      duration_minutes: 75,
      price_minor: 1000000,
    });
  });

  it("refuses a price with too many decimals and keeps what was typed", async () => {
    const user = userEvent.setup();
    render(<ServiceFormDialog tenantId={TENANT_ID} currency="NGN" onClose={vi.fn()} />);

    await user.type(screen.getByLabelText("Name"), "Gel Manicure");
    await user.type(screen.getByLabelText("Price"), "19.999");
    await user.click(screen.getByRole("button", { name: "Add service" }));

    expect(createMutate).not.toHaveBeenCalled();
    expect(screen.getByText("Use at most 2 decimal places.")).toBeInTheDocument();
    // A rejected field must not cost the owner the rest of the form.
    expect(screen.getByLabelText("Name")).toHaveValue("Gel Manicure");
    expect(screen.getByLabelText("Price")).toHaveValue("19.999");
  });

  it("refuses a service with no name", async () => {
    const user = userEvent.setup();
    render(<ServiceFormDialog tenantId={TENANT_ID} currency="NGN" onClose={vi.fn()} />);

    await user.type(screen.getByLabelText("Price"), "10");
    await user.click(screen.getByRole("button", { name: "Add service" }));

    expect(createMutate).not.toHaveBeenCalled();
    expect(screen.getByText("Enter a service name.")).toBeInTheDocument();
  });

  it("accepts a free service", async () => {
    const user = userEvent.setup();
    render(<ServiceFormDialog tenantId={TENANT_ID} currency="NGN" onClose={vi.fn()} />);

    await user.type(screen.getByLabelText("Name"), "Patch test");
    await user.type(screen.getByLabelText("Price"), "0");
    await user.click(screen.getByRole("button", { name: "Add service" }));

    expect(createMutate).toHaveBeenCalledWith(
      expect.objectContaining({ price_minor: 0, name: "Patch test" })
    );
  });

  it("offers no currency or status control", () => {
    render(<ServiceFormDialog tenantId={TENANT_ID} currency="NGN" onClose={vi.fn()} />);

    // Currency is inherited from the workspace and write-once; status is owned
    // by the archive endpoint. Neither is editable here.
    expect(screen.queryByLabelText(/currency/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/status/i)).not.toBeInTheDocument();
    expect(screen.getByText(/priced in NGN/i)).toBeInTheDocument();
  });
});

describe("ServiceFormDialog — edit", () => {
  it("pre-fills from the existing service without altering the stored price", async () => {
    const user = userEvent.setup();
    render(
      <ServiceFormDialog
        tenantId={TENANT_ID}
        currency="NGN"
        service={manicure}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByLabelText("Name")).toHaveValue("Gel Manicure");
    expect(screen.getByLabelText("Price")).toHaveValue("19.99");

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(updateMutate).toHaveBeenCalledWith({
      serviceId: manicure.id,
      input: {
        name: "Gel Manicure",
        description: "Soak-off gel.",
        duration_minutes: 60,
        price_minor: 1999,
      },
    });
  });

  it("closes on success", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <ServiceFormDialog tenantId={TENANT_ID} currency="NGN" service={manicure} onClose={onClose} />
    );

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(onClose).toHaveBeenCalled();
  });
});

describe("ServiceFormDialog — dialog behaviour", () => {
  it("is an accessible modal labelled by its heading", () => {
    render(<ServiceFormDialog tenantId={TENANT_ID} currency="NGN" onClose={vi.fn()} />);

    expect(screen.getByRole("dialog", { name: "Add service" })).toHaveAttribute(
      "aria-modal",
      "true"
    );
  });

  it("closes on Escape", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<ServiceFormDialog tenantId={TENANT_ID} currency="NGN" onClose={onClose} />);

    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalled();
  });
});
