import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { resolveVerticalExperience } from "@/lib/vertical/experience";
import type { StaffProfile } from "@/modules/staff/types";
import type { Permission } from "@/types/permission";
import type { BusinessType } from "@/types/tenant";

import { TeamRoster } from "./team-roster";

/**
 * Behaviour under test: which controls a given permission set produces, and
 * how the roster renders loading/empty/error/loaded states. Mirrors
 * `service-catalog.test.tsx` exactly. Capability counts are stubbed to
 * resolved-but-empty so rows render deterministically without depending on
 * `ManageServicesDialog`'s own data flow.
 */

const granted = new Set<Permission>();

vi.mock("@/providers/permissions-provider", () => ({
  useCan: (permission: Permission) => granted.has(permission),
}));

let vertical = resolveVerticalExperience("NAIL_TECHNICIAN");

vi.mock("@/lib/vertical/use-vertical-experience", () => ({
  useVerticalExperience: () => vertical,
}));

function setVertical(businessType: BusinessType | null) {
  vertical = resolveVerticalExperience(businessType);
}

const staffResult = {
  data: [] as StaffProfile[],
  isPending: false,
  isSuccess: true,
  isError: false,
  error: null as unknown,
  refetch: vi.fn(),
};

vi.mock("@/modules/staff/queries", () => ({
  useStaffList: () => staffResult,
  useStaffCapabilities: () => ({
    data: { service_ids: [] },
    isPending: false,
    isSuccess: true,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useCreateStaff: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateStaff: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useArchiveStaff: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useReplaceStaffCapabilities: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("@/modules/services/queries", () => ({
  useServices: () => ({ data: [], isPending: false, isSuccess: true, isError: false, error: null }),
}));

vi.mock("@/modules/working-hours/queries", () => ({
  useStaffWorkingHours: () => ({
    data: { staff_id: "", intervals: [] },
    isPending: false,
    isSuccess: true,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useReplaceStaffWorkingHours: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("@/providers/auth-provider", () => ({
  useAuth: () => ({ user: { id: "user-1", email: "owner@example.com" } }),
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

function renderRoster(permissions: Permission[], staff: StaffProfile[] = [ada]) {
  granted.clear();
  for (const permission of permissions) granted.add(permission);

  staffResult.data = staff;
  staffResult.isPending = false;
  staffResult.isSuccess = true;
  staffResult.isError = false;

  return render(<TeamRoster tenantId={TENANT_ID} />);
}

beforeEach(() => {
  granted.clear();
  vertical = resolveVerticalExperience("NAIL_TECHNICIAN");
});

describe("TeamRoster — read-only access", () => {
  it("shows the roster but no mutation controls", () => {
    renderRoster(["staff.read"]);

    expect(screen.getByText("Ada Okafor")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /add technician/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^archive/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /manage services/i })).not.toBeInTheDocument();
  });

  it("shows the empty state without an add control", () => {
    renderRoster(["staff.read"], []);

    expect(screen.getByText("No technicians yet")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /add technician/i })).not.toBeInTheDocument();
    expect(screen.getByText(/ask an owner to add the first team member/i)).toBeInTheDocument();
  });
});

describe("TeamRoster — empty state is a real action", () => {
  it("opens the create dialog from the empty-state CTA", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();
    renderRoster(["staff.read", "staff.create"], []);

    await user.click(screen.getByRole("button", { name: "Add technician" }));

    expect(screen.getByRole("dialog", { name: "Add technician" })).toBeInTheDocument();
  });
});

describe("TeamRoster — working hours is always reachable", () => {
  it("shows the Working hours action even for a staff.read-only user", () => {
    renderRoster(["staff.read"]);

    expect(
      screen.getByRole("button", { name: /working hours for ada okafor/i })
    ).toBeInTheDocument();
  });

  it("opens the working-hours dialog on click, in view mode with no Edit control for a read-only user", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();
    renderRoster(["staff.read"]);

    await user.click(screen.getByRole("button", { name: /working hours for ada okafor/i }));

    expect(screen.getByRole("dialog", { name: /ada okafor.s working hours/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
  });
});

describe("TeamRoster — per-permission controls", () => {
  it("staff.create reveals the add control", () => {
    renderRoster(["staff.read", "staff.create"]);

    expect(screen.getByRole("button", { name: /add technician/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /edit ada okafor/i })).not.toBeInTheDocument();
  });

  it("staff.update reveals edit and manage-services controls", () => {
    renderRoster(["staff.read", "staff.update"]);

    expect(screen.getByRole("button", { name: /edit ada okafor/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /manage services for ada okafor/i })
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /archive ada okafor/i })).not.toBeInTheDocument();
  });

  it("staff.archive reveals the archive control", () => {
    renderRoster(["staff.read", "staff.archive"]);

    expect(screen.getByRole("button", { name: /archive ada okafor/i })).toBeInTheDocument();
  });

  it("offers no archive control for an already-archived profile", () => {
    // Archiving an archived profile is a server-side no-op, so the control
    // is absent rather than present and inert.
    renderRoster(["staff.read", "staff.archive", "staff.update"], [{ ...ada, status: "ARCHIVED" }]);

    expect(screen.getByText("Archived")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /archive ada okafor/i })).not.toBeInTheDocument();
    // Archived profiles remain editable server-side, so edit stays.
    expect(screen.getByRole("button", { name: /edit ada okafor/i })).toBeInTheDocument();
  });
});

describe("TeamRoster — rendering", () => {
  it("shows linked-account and not-bookable indicators without leaking internal identifiers", () => {
    renderRoster(["staff.read"], [{ ...ada, user_id: "user-1", is_bookable: false }]);

    expect(screen.getByText("Linked account")).toBeInTheDocument();
    expect(screen.getByText("Not bookable")).toBeInTheDocument();
    expect(screen.queryByText(ada.id)).not.toBeInTheDocument();
    expect(screen.queryByText(TENANT_ID)).not.toBeInTheDocument();
    expect(screen.queryByText("user-1")).not.toBeInTheDocument();
  });

  it("renders a bio when present", () => {
    renderRoster(["staff.read"], [{ ...ada, bio: "Ten years of nail art experience." }]);

    expect(screen.getByText("Ten years of nail art experience.")).toBeInTheDocument();
  });
});

describe("TeamRoster — loading and error states", () => {
  it("shows a loading state, not the empty state, while the query is pending", () => {
    granted.clear();
    staffResult.data = [];
    staffResult.isPending = true;
    staffResult.isSuccess = false;
    staffResult.isError = false;

    render(<TeamRoster tenantId={TENANT_ID} />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText("No technicians yet")).not.toBeInTheDocument();
  });

  it("shows an error state with retry", () => {
    granted.clear();
    staffResult.isPending = false;
    staffResult.isSuccess = false;
    staffResult.isError = true;
    staffResult.error = new Error("network down");

    render(<TeamRoster tenantId={TENANT_ID} />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });
});

describe("TeamRoster — vertical terminology (V1)", () => {
  it("NAIL_TECHNICIAN: technician language and appointment controls", () => {
    setVertical("NAIL_TECHNICIAN");
    renderRoster(["staff.read", "staff.create", "staff.update"]);

    expect(screen.getByRole("button", { name: "Add technician" })).toBeInTheDocument();
    expect(screen.getByText("1 technician")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /working hours for ada okafor/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /manage services for ada okafor/i })
    ).toBeInTheDocument();
  });

  it("TRANSPORT: driver language, appointment controls hidden", () => {
    setVertical("TRANSPORT");
    renderRoster(["staff.read", "staff.create", "staff.update"]);

    expect(screen.getByRole("button", { name: "Add driver" })).toBeInTheDocument();
    expect(screen.getByText("1 driver")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /working hours/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /manage services/i })).not.toBeInTheDocument();
    // Editing a profile still works — a driver roster is a real shared concept.
    expect(screen.getByRole("button", { name: /edit ada okafor/i })).toBeInTheDocument();
    expect(screen.queryByText(/technician/i)).not.toBeInTheDocument();
  });

  it("HOTEL: staff-member language, appointment controls hidden", () => {
    setVertical("HOTEL");
    renderRoster(["staff.read", "staff.create", "staff.update"]);

    expect(screen.getByRole("button", { name: "Add staff member" })).toBeInTheDocument();
    expect(screen.getByText("1 staff member")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /working hours/i })).not.toBeInTheDocument();
  });

  it("RESTAURANT: team-member language, appointment controls hidden", () => {
    setVertical("RESTAURANT");
    renderRoster(["staff.read", "staff.create"], []);

    expect(screen.getByRole("button", { name: "Add team member" })).toBeInTheDocument();
    expect(screen.getByText("No team members yet")).toBeInTheDocument();
  });

  it("unknown business type falls back to generic team language and hides appointment controls", () => {
    setVertical(null);
    renderRoster(["staff.read", "staff.update"]);

    expect(screen.getByText("1 team member")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /working hours/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /manage services/i })).not.toBeInTheDocument();
  });

  it("permissions still gate controls within a vertical that supports them", () => {
    setVertical("NAIL_TECHNICIAN");
    renderRoster(["staff.read"]);

    // Capability on, but no staff.update → still no manage-services control.
    expect(screen.queryByRole("button", { name: /manage services/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /add technician/i })).not.toBeInTheDocument();
  });

  it("switching vertical between renders leaves no stale terminology", () => {
    setVertical("NAIL_TECHNICIAN");
    const { rerender } = renderRoster(["staff.read", "staff.create"]);
    expect(screen.getByRole("button", { name: "Add technician" })).toBeInTheDocument();

    setVertical("TRANSPORT");
    rerender(<TeamRoster tenantId={TENANT_ID} />);

    expect(screen.queryByRole("button", { name: "Add technician" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add driver" })).toBeInTheDocument();
  });
});
