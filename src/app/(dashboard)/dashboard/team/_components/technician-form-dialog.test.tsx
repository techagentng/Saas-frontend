import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api/errors";
import { resolveVerticalExperience } from "@/lib/vertical/experience";
import type { StaffProfile } from "@/modules/staff/types";
import type { BusinessType } from "@/types/tenant";

import { TechnicianFormDialog } from "./technician-form-dialog";

const createMutate = vi.fn();
const updateMutate = vi.fn();
let authUser: { id: string; email: string } | null = { id: "user-1", email: "owner@example.com" };

/**
 * A real, minimal `isPending` lifecycle rather than a static `false` — the
 * "prevents duplicate submission" case below depends on the button actually
 * disabling while a mutation is in flight, which a hard-coded value can't
 * exercise. `useState` here belongs to whichever component calls this hook
 * (TechnicianFormDialog), so it participates in that component's own
 * re-renders exactly like the real `useMutation` would.
 */
function useTrackedMutation(fn: (input: unknown) => Promise<StaffProfile>) {
  const [isPending, setIsPending] = useState(false);
  return {
    isPending,
    mutateAsync: async (input: unknown) => {
      setIsPending(true);
      try {
        return await fn(input);
      } finally {
        setIsPending(false);
      }
    },
  };
}

vi.mock("@/modules/staff/queries", () => ({
  useCreateStaff: () => useTrackedMutation(createMutate),
  useUpdateStaff: () => useTrackedMutation(updateMutate),
}));

vi.mock("@/providers/auth-provider", () => ({
  useAuth: () => ({ user: authUser }),
}));

let vertical = resolveVerticalExperience("NAIL_TECHNICIAN");

vi.mock("@/lib/vertical/use-vertical-experience", () => ({
  useVerticalExperience: () => vertical,
}));

function setVertical(businessType: BusinessType | null) {
  vertical = resolveVerticalExperience(businessType);
}

const TENANT_ID = "11111111-1111-4111-8111-111111111111";

const ada: StaffProfile = {
  id: "33333333-3333-4333-8333-333333333333",
  user_id: null,
  display_name: "Ada Okafor",
  bio: "Nail art specialist.",
  is_bookable: true,
  status: "ACTIVE",
  created_at: "2026-08-27T10:00:00Z",
  updated_at: "2026-08-27T10:00:00Z",
};

beforeEach(() => {
  vertical = resolveVerticalExperience("NAIL_TECHNICIAN");
  authUser = { id: "user-1", email: "owner@example.com" };
  createMutate.mockReset();
  createMutate.mockResolvedValue(ada);
  updateMutate.mockReset();
  updateMutate.mockResolvedValue(ada);
});

describe("TechnicianFormDialog — create", () => {
  it("submits a non-linked profile by default", async () => {
    const user = userEvent.setup();
    render(<TechnicianFormDialog tenantId={TENANT_ID} onClose={vi.fn()} />);

    await user.type(screen.getByLabelText("Name"), "Ada Okafor");
    await user.click(screen.getByRole("button", { name: "Add technician" }));

    expect(createMutate).toHaveBeenCalledWith({
      display_name: "Ada Okafor",
      bio: null,
      is_bookable: true,
      user_id: null,
    });
  });

  it("links the signed-in user's own account when 'This is me' is checked", async () => {
    const user = userEvent.setup();
    render(<TechnicianFormDialog tenantId={TENANT_ID} onClose={vi.fn()} />);

    await user.type(screen.getByLabelText("Name"), "Business Owner");
    await user.click(screen.getByLabelText(/this is me/i));
    await user.click(screen.getByRole("button", { name: "Add technician" }));

    expect(createMutate).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "user-1" })
    );
  });

  it("trims the name and sends an unset bio as null", async () => {
    const user = userEvent.setup();
    render(<TechnicianFormDialog tenantId={TENANT_ID} onClose={vi.fn()} />);

    await user.type(screen.getByLabelText("Name"), "  Ada Okafor  ");
    await user.click(screen.getByRole("button", { name: "Add technician" }));

    expect(createMutate).toHaveBeenCalledWith(
      expect.objectContaining({ display_name: "Ada Okafor", bio: null })
    );
  });

  it("unchecking Bookable sends is_bookable: false", async () => {
    const user = userEvent.setup();
    render(<TechnicianFormDialog tenantId={TENANT_ID} onClose={vi.fn()} />);

    await user.type(screen.getByLabelText("Name"), "Ada Okafor");
    await user.click(screen.getByLabelText(/^bookable/i));
    await user.click(screen.getByRole("button", { name: "Add technician" }));

    expect(createMutate).toHaveBeenCalledWith(expect.objectContaining({ is_bookable: false }));
  });

  it("refuses a technician with no name and keeps what was typed elsewhere", async () => {
    const user = userEvent.setup();
    render(<TechnicianFormDialog tenantId={TENANT_ID} onClose={vi.fn()} />);

    await user.type(screen.getByLabelText("Bio"), "Some bio text");
    await user.click(screen.getByRole("button", { name: "Add technician" }));

    expect(createMutate).not.toHaveBeenCalled();
    expect(screen.getByText("Enter a name.")).toBeInTheDocument();
    expect(screen.getByLabelText("Bio")).toHaveValue("Some bio text");
  });

  it("prevents duplicate submission while the mutation is pending", async () => {
    let resolveCreate!: (value: StaffProfile) => void;
    createMutate.mockImplementation(
      () => new Promise<StaffProfile>((resolve) => (resolveCreate = resolve))
    );

    const user = userEvent.setup();
    render(<TechnicianFormDialog tenantId={TENANT_ID} onClose={vi.fn()} />);

    await user.type(screen.getByLabelText("Name"), "Ada Okafor");
    await user.click(screen.getByRole("button", { name: "Add technician" }));

    expect(screen.getByRole("button", { name: /adding…/i })).toBeDisabled();
    expect(createMutate).toHaveBeenCalledTimes(1);

    resolveCreate(ada);
  });

  it("shows a backend validation error and keeps the form open with entered data", async () => {
    createMutate.mockRejectedValue(new ApiError(422, { code: "VALIDATION_FAILED", message: "bad request" }));

    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<TechnicianFormDialog tenantId={TENANT_ID} onClose={onClose} />);

    await user.type(screen.getByLabelText("Name"), "Ada Okafor");
    await user.click(screen.getByRole("button", { name: "Add technician" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/check the details/i);
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Name")).toHaveValue("Ada Okafor");
  });

  it("does not offer self-linking when there is no signed-in user", () => {
    authUser = null;
    render(<TechnicianFormDialog tenantId={TENANT_ID} onClose={vi.fn()} />);

    expect(screen.getByLabelText(/this is me/i)).toBeDisabled();
  });
});

describe("TechnicianFormDialog — edit", () => {
  it("pre-fills from the existing profile and omits user_id from the payload", async () => {
    const user = userEvent.setup();
    render(<TechnicianFormDialog tenantId={TENANT_ID} staff={ada} onClose={vi.fn()} />);

    expect(screen.getByLabelText("Name")).toHaveValue("Ada Okafor");
    expect(screen.getByLabelText("Bio")).toHaveValue("Nail art specialist.");

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(updateMutate).toHaveBeenCalledWith({
      staffId: ada.id,
      input: {
        display_name: "Ada Okafor",
        bio: "Nail art specialist.",
        is_bookable: true,
      },
    });
  });

  it("offers no self-link checkbox when editing — the link cannot be changed", () => {
    render(<TechnicianFormDialog tenantId={TENANT_ID} staff={ada} onClose={vi.fn()} />);

    expect(screen.queryByLabelText(/this is me/i)).not.toBeInTheDocument();
  });

  it("shows the linked-account note instead of a control when already linked", () => {
    render(
      <TechnicianFormDialog tenantId={TENANT_ID} staff={{ ...ada, user_id: "user-1" }} onClose={vi.fn()} />
    );

    expect(screen.getByText(/linked to a user account/i)).toBeInTheDocument();
  });

  it("closes on success", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<TechnicianFormDialog tenantId={TENANT_ID} staff={ada} onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(onClose).toHaveBeenCalled();
  });
});

describe("TechnicianFormDialog — dialog behaviour", () => {
  it("is an accessible modal labelled by its heading", () => {
    render(<TechnicianFormDialog tenantId={TENANT_ID} onClose={vi.fn()} />);

    expect(screen.getByRole("dialog", { name: "Add technician" })).toHaveAttribute(
      "aria-modal",
      "true"
    );
  });

  it("closes on Escape", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<TechnicianFormDialog tenantId={TENANT_ID} onClose={onClose} />);

    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalled();
  });
});

describe("TechnicianFormDialog — vertical terminology (V1)", () => {
  it("titles and labels the create action per vertical", () => {
    for (const [businessType, addLabel] of [
      ["NAIL_TECHNICIAN", "Add technician"],
      ["TRANSPORT", "Add driver"],
      ["HOTEL", "Add staff member"],
      ["RESTAURANT", "Add team member"],
      [null, "Add team member"],
    ] as const) {
      setVertical(businessType);
      const { unmount } = render(
        <TechnicianFormDialog tenantId={TENANT_ID} onClose={vi.fn()} />
      );

      expect(screen.getByRole("dialog", { name: addLabel })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: addLabel })).toBeInTheDocument();
      unmount();
    }
  });

  it("titles the edit action per vertical without renaming the payload", async () => {
    setVertical("TRANSPORT");
    const user = userEvent.setup();
    render(<TechnicianFormDialog tenantId={TENANT_ID} staff={ada} onClose={vi.fn()} />);

    expect(screen.getByRole("dialog", { name: "Edit driver" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    // The UI word changed; the domain payload did not.
    expect(updateMutate).toHaveBeenCalledWith(
      expect.objectContaining({ staffId: ada.id })
    );
  });
});
