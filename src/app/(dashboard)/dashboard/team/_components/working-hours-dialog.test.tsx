import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api/errors";
import type { StaffProfile } from "@/modules/staff/types";
import type { StaffWorkingHours } from "@/modules/working-hours/types";
import type { Permission } from "@/types/permission";

import { WorkingHoursDialog } from "./working-hours-dialog";

const granted = new Set<Permission>();

vi.mock("@/providers/permissions-provider", () => ({
  useCan: (permission: Permission) => granted.has(permission),
}));

const hoursResult = {
  data: { staff_id: "", intervals: [] } as StaffWorkingHours,
  isPending: false,
  isSuccess: true,
  isError: false,
  error: null as unknown,
  refetch: vi.fn(),
};

const replaceMutate = vi.fn();

/**
 * A real, minimal `isPending` lifecycle, exactly the pattern
 * `technician-form-dialog.test.tsx` uses — the "prevents duplicate
 * submission" case below needs the Save button to actually disable while a
 * mutation is in flight, which a hard-coded `false` can't exercise.
 */
function useTrackedMutation(fn: (input: unknown) => Promise<StaffWorkingHours>) {
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

vi.mock("@/modules/working-hours/queries", () => ({
  useStaffWorkingHours: () => hoursResult,
  useReplaceStaffWorkingHours: () => useTrackedMutation(replaceMutate),
}));

const TENANT_ID = "11111111-1111-4111-8111-111111111111";

const ada: StaffProfile = {
  id: "33333333-3333-4333-8333-333333333333",
  user_id: null,
  display_name: "Ada Okafor",
  bio: null,
  is_bookable: true,
  status: "ACTIVE",
  created_at: "2026-08-27T10:00:00Z",
  updated_at: "2026-08-27T10:00:00Z",
};

beforeEach(() => {
  granted.clear();
  granted.add("staff.read");
  replaceMutate.mockReset();
  hoursResult.data = { staff_id: ada.id, intervals: [] };
  hoursResult.isPending = false;
  hoursResult.isSuccess = true;
  hoursResult.isError = false;
});

describe("WorkingHoursDialog — display", () => {
  it("renders multiple intervals for a day", () => {
    hoursResult.data = {
      staff_id: ada.id,
      intervals: [
        { day_of_week: "MONDAY", start_time: "09:00", end_time: "12:00" },
        { day_of_week: "MONDAY", start_time: "13:00", end_time: "17:00" },
      ],
    };

    render(<WorkingHoursDialog tenantId={TENANT_ID} staff={ada} onClose={vi.fn()} />);

    expect(screen.getByText("09:00 — 12:00")).toBeInTheDocument();
    expect(screen.getByText("13:00 — 17:00")).toBeInTheDocument();
  });

  it("renders a day with no intervals as 'Not working'", () => {
    hoursResult.data = {
      staff_id: ada.id,
      intervals: [{ day_of_week: "TUESDAY", start_time: "09:00", end_time: "17:00" }],
    };

    render(<WorkingHoursDialog tenantId={TENANT_ID} staff={ada} onClose={vi.fn()} />);

    const monday = screen.getByText("Monday").closest("div");
    expect(monday).not.toBeNull();
    expect(within(monday as HTMLElement).getByText("Not working")).toBeInTheDocument();
  });

  it("handles a fully empty schedule without treating it as an error", () => {
    hoursResult.data = { staff_id: ada.id, intervals: [] };

    render(<WorkingHoursDialog tenantId={TENANT_ID} staff={ada} onClose={vi.fn()} />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getAllByText("Not working")).toHaveLength(7);
  });

  it("shows a loading state, not an empty schedule, while the query is pending", () => {
    hoursResult.isPending = true;
    hoursResult.isSuccess = false;

    render(<WorkingHoursDialog tenantId={TENANT_ID} staff={ada} onClose={vi.fn()} />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText("Not working")).not.toBeInTheDocument();
  });

  it("shows an error state with retry on GET failure", () => {
    hoursResult.isPending = false;
    hoursResult.isSuccess = false;
    hoursResult.isError = true;
    hoursResult.error = new Error("network down");

    render(<WorkingHoursDialog tenantId={TENANT_ID} staff={ada} onClose={vi.fn()} />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });
});

describe("WorkingHoursDialog — permissions", () => {
  it("shows the Edit action for a user with staff.update", () => {
    granted.add("staff.update");
    render(<WorkingHoursDialog tenantId={TENANT_ID} staff={ada} onClose={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
  });

  it("omits the Edit action for a staff.read-only user", () => {
    render(<WorkingHoursDialog tenantId={TENANT_ID} staff={ada} onClose={vi.fn()} />);

    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
  });
});

describe("WorkingHoursDialog — editing", () => {
  beforeEach(() => {
    granted.add("staff.update");
  });

  it("opens the editor populated from the server schedule", async () => {
    hoursResult.data = {
      staff_id: ada.id,
      intervals: [{ day_of_week: "MONDAY", start_time: "09:00", end_time: "17:00" }],
    };
    const user = userEvent.setup();
    render(<WorkingHoursDialog tenantId={TENANT_ID} staff={ada} onClose={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Edit" }));

    expect(screen.getByLabelText("Monday interval 1 start time")).toHaveValue("09:00");
    expect(screen.getByLabelText("Monday interval 1 end time")).toHaveValue("17:00");
  });

  it("adds an interval to a day", async () => {
    const user = userEvent.setup();
    render(<WorkingHoursDialog tenantId={TENANT_ID} staff={ada} onClose={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("button", { name: "Add hours on Monday" }));

    expect(screen.getByLabelText("Monday interval 1 start time")).toBeInTheDocument();
  });

  it("removes an interval from a day, restoring 'Not working'", async () => {
    hoursResult.data = {
      staff_id: ada.id,
      intervals: [{ day_of_week: "MONDAY", start_time: "09:00", end_time: "17:00" }],
    };
    const user = userEvent.setup();
    render(<WorkingHoursDialog tenantId={TENANT_ID} staff={ada} onClose={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("button", { name: "Remove Monday interval 1" }));

    expect(screen.queryByLabelText("Monday interval 1 start time")).not.toBeInTheDocument();
  });

  it("saves a split shift and a single-interval day as one full-week PUT payload", async () => {
    const user = userEvent.setup();
    render(<WorkingHoursDialog tenantId={TENANT_ID} staff={ada} onClose={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Edit" }));

    await user.click(screen.getByRole("button", { name: "Add hours on Monday" }));
    await user.type(screen.getByLabelText("Monday interval 1 start time"), "09:00");
    await user.type(screen.getByLabelText("Monday interval 1 end time"), "12:00");
    await user.click(screen.getByRole("button", { name: "Add hours on Monday" }));
    await user.type(screen.getByLabelText("Monday interval 2 start time"), "13:00");
    await user.type(screen.getByLabelText("Monday interval 2 end time"), "17:00");

    await user.click(screen.getByRole("button", { name: "Add hours on Tuesday" }));
    await user.type(screen.getByLabelText("Tuesday interval 1 start time"), "09:00");
    await user.type(screen.getByLabelText("Tuesday interval 1 end time"), "17:00");

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(replaceMutate).toHaveBeenCalledWith([
      { day_of_week: "MONDAY", start_time: "09:00", end_time: "12:00" },
      { day_of_week: "MONDAY", start_time: "13:00", end_time: "17:00" },
      { day_of_week: "TUESDAY", start_time: "09:00", end_time: "17:00" },
    ]);
  });

  it("returns to view mode reflecting the saved schedule on success", async () => {
    const user = userEvent.setup();
    render(<WorkingHoursDialog tenantId={TENANT_ID} staff={ada} onClose={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save" })).not.toBeInTheDocument();
  });

  it("Cancel discards unsaved changes and restores the server schedule", async () => {
    hoursResult.data = {
      staff_id: ada.id,
      intervals: [{ day_of_week: "MONDAY", start_time: "09:00", end_time: "17:00" }],
    };
    const user = userEvent.setup();
    render(<WorkingHoursDialog tenantId={TENANT_ID} staff={ada} onClose={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("button", { name: "Add hours on Tuesday" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(replaceMutate).not.toHaveBeenCalled();
    expect(screen.getByText("09:00 — 17:00")).toBeInTheDocument();
    const tuesday = screen.getByText("Tuesday").closest("div");
    expect(within(tuesday as HTMLElement).getByText("Not working")).toBeInTheDocument();
  });

  it("prevents duplicate submission while the mutation is pending", async () => {
    let resolveSave!: (value: StaffWorkingHours) => void;
    replaceMutate.mockImplementation(
      () => new Promise<StaffWorkingHours>((resolve) => (resolveSave = resolve))
    );

    const user = userEvent.setup();
    render(<WorkingHoursDialog tenantId={TENANT_ID} staff={ada} onClose={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByRole("button", { name: /saving…/i })).toBeDisabled();
    expect(replaceMutate).toHaveBeenCalledTimes(1);

    resolveSave({ staff_id: ada.id, intervals: [] });
  });
});

describe("WorkingHoursDialog — validation surfaced through the UI", () => {
  beforeEach(() => {
    granted.add("staff.update");
  });

  it("rejects start after end without submitting, and keeps the entered values", async () => {
    const user = userEvent.setup();
    render(<WorkingHoursDialog tenantId={TENANT_ID} staff={ada} onClose={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("button", { name: "Add hours on Monday" }));
    await user.type(screen.getByLabelText("Monday interval 1 start time"), "17:00");
    await user.type(screen.getByLabelText("Monday interval 1 end time"), "09:00");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(replaceMutate).not.toHaveBeenCalled();
    expect(screen.getByText("Start time must be before end time.")).toBeInTheDocument();
    expect(screen.getByLabelText("Monday interval 1 start time")).toHaveValue("17:00");
  });

  it("accepts a touching boundary and submits it", async () => {
    const user = userEvent.setup();
    render(<WorkingHoursDialog tenantId={TENANT_ID} staff={ada} onClose={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("button", { name: "Add hours on Monday" }));
    await user.type(screen.getByLabelText("Monday interval 1 start time"), "09:00");
    await user.type(screen.getByLabelText("Monday interval 1 end time"), "12:00");
    await user.click(screen.getByRole("button", { name: "Add hours on Monday" }));
    await user.type(screen.getByLabelText("Monday interval 2 start time"), "12:00");
    await user.type(screen.getByLabelText("Monday interval 2 end time"), "17:00");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(replaceMutate).toHaveBeenCalledWith([
      { day_of_week: "MONDAY", start_time: "09:00", end_time: "12:00" },
      { day_of_week: "MONDAY", start_time: "12:00", end_time: "17:00" },
    ]);
  });

  it("rejects an overlapping pair without submitting", async () => {
    const user = userEvent.setup();
    render(<WorkingHoursDialog tenantId={TENANT_ID} staff={ada} onClose={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("button", { name: "Add hours on Monday" }));
    await user.type(screen.getByLabelText("Monday interval 1 start time"), "09:00");
    await user.type(screen.getByLabelText("Monday interval 1 end time"), "12:00");
    await user.click(screen.getByRole("button", { name: "Add hours on Monday" }));
    await user.type(screen.getByLabelText("Monday interval 2 start time"), "10:00");
    await user.type(screen.getByLabelText("Monday interval 2 end time"), "13:00");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(replaceMutate).not.toHaveBeenCalled();
    expect(screen.getByText("Working hours cannot overlap with another interval.")).toBeInTheDocument();
  });
});

describe("WorkingHoursDialog — backend error handling", () => {
  beforeEach(() => {
    granted.add("staff.update");
  });

  it("keeps the editor open and preserves entered hours on a VALIDATION_FAILED response", async () => {
    replaceMutate.mockRejectedValueOnce(
      new ApiError(422, { code: "VALIDATION_FAILED", message: "invalid schedule" })
    );

    const user = userEvent.setup();
    render(<WorkingHoursDialog tenantId={TENANT_ID} staff={ada} onClose={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("button", { name: "Add hours on Monday" }));
    await user.type(screen.getByLabelText("Monday interval 1 start time"), "09:00");
    await user.type(screen.getByLabelText("Monday interval 1 end time"), "17:00");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/check your hours/i);
    expect(screen.getByLabelText("Monday interval 1 start time")).toHaveValue("09:00");
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("allows a retry that succeeds after a prior failure", async () => {
    replaceMutate
      .mockRejectedValueOnce(new ApiError(422, { code: "VALIDATION_FAILED", message: "bad" }))
      .mockResolvedValueOnce({ staff_id: ada.id, intervals: [] });

    const user = userEvent.setup();
    render(<WorkingHoursDialog tenantId={TENANT_ID} staff={ada} onClose={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("button", { name: "Add hours on Monday" }));
    await user.type(screen.getByLabelText("Monday interval 1 start time"), "09:00");
    await user.type(screen.getByLabelText("Monday interval 1 end time"), "17:00");
    await user.click(screen.getByRole("button", { name: "Save" }));
    await screen.findByRole("alert");

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(replaceMutate).toHaveBeenCalledTimes(2);
  });
});

describe("WorkingHoursDialog — dialog behaviour", () => {
  it("is an accessible modal labelled by its heading", () => {
    render(<WorkingHoursDialog tenantId={TENANT_ID} staff={ada} onClose={vi.fn()} />);

    expect(
      screen.getByRole("dialog", { name: "Ada Okafor's working hours" })
    ).toHaveAttribute("aria-modal", "true");
  });

  it("closes on Escape", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<WorkingHoursDialog tenantId={TENANT_ID} staff={ada} onClose={onClose} />);

    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalled();
  });
});
