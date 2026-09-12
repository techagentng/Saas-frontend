import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Service } from "@/modules/services/types";
import type { StaffProfile } from "@/modules/staff/types";

import { ManageServiceTechniciansDialog } from "./manage-service-technicians-dialog";

/**
 * SC2's service-side mirror of `manage-services-dialog.test.tsx`: the picker
 * renders the REAL tenant roster (never invented technician names),
 * pre-marks exactly the currently-assigned set, and on Save sends the
 * complete edited set through the real replace-service-staff mutation —
 * never a per-checkbox add/remove call, matching the backend's
 * PUT-replaces-the-whole-set contract.
 */

const replaceMutate = vi.fn();

const staffListResult = {
  data: [] as StaffProfile[],
  isPending: false,
  isSuccess: true,
  isError: false,
  error: null as unknown,
  refetch: vi.fn(),
};

const assignedResult = {
  data: { staff_ids: [] as string[] },
  isPending: false,
  isSuccess: true,
  isError: false,
  error: null as unknown,
  refetch: vi.fn(),
};

vi.mock("@/modules/staff/queries", () => ({
  useStaffList: () => staffListResult,
  useServiceStaff: () => assignedResult,
  useReplaceServiceStaff: () => ({ mutateAsync: replaceMutate, isPending: false }),
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

const bola: StaffProfile = {
  id: "66666666-6666-4666-8666-666666666666",
  user_id: null,
  display_name: "Bola Adeyemi",
  bio: null,
  is_bookable: true,
  status: "ACTIVE",
  created_at: "2026-08-27T10:00:00Z",
  updated_at: "2026-08-27T10:00:00Z",
};

const manicure: Service = {
  id: "44444444-4444-4444-8444-444444444444",
  name: "Gel Manicure",
  description: null,
  duration_minutes: 60,
  price_minor: 1999,
  category_id: null,
  status: "ACTIVE",
  created_at: "2026-08-27T10:00:00Z",
  updated_at: "2026-08-27T10:00:00Z",
};

beforeEach(() => {
  replaceMutate.mockReset();
  replaceMutate.mockResolvedValue({ staff_ids: [] });
  staffListResult.data = [ada, bola];
  staffListResult.isPending = false;
  staffListResult.isSuccess = true;
  staffListResult.isError = false;
  assignedResult.data = { staff_ids: [ada.id] };
  assignedResult.isPending = false;
  assignedResult.isSuccess = true;
  assignedResult.isError = false;
});

describe("ManageServiceTechniciansDialog — rendering", () => {
  it("lists the tenant's real technicians and marks the currently assigned one", () => {
    render(<ManageServiceTechniciansDialog tenantId={TENANT_ID} service={manicure} onClose={vi.fn()} />);

    expect(screen.getByRole("checkbox", { name: /ada okafor/i })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /bola adeyemi/i })).not.toBeChecked();
  });

  it("never renders a staff id, service id, or the tenant id as visible text", () => {
    render(<ManageServiceTechniciansDialog tenantId={TENANT_ID} service={manicure} onClose={vi.fn()} />);

    expect(screen.queryByText(ada.id)).not.toBeInTheDocument();
    expect(screen.queryByText(manicure.id)).not.toBeInTheDocument();
    expect(screen.queryByText(TENANT_ID)).not.toBeInTheDocument();
  });
});

describe("ManageServiceTechniciansDialog — assigning and removing technicians", () => {
  it("checking an unassigned technician and saving sends the full new set", async () => {
    const user = userEvent.setup();
    render(<ManageServiceTechniciansDialog tenantId={TENANT_ID} service={manicure} onClose={vi.fn()} />);

    await user.click(screen.getByRole("checkbox", { name: /bola adeyemi/i }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(replaceMutate).toHaveBeenCalledTimes(1);
    const sent = replaceMutate.mock.calls[0][0] as string[];
    expect(sent).toEqual(expect.arrayContaining([ada.id, bola.id]));
    expect(sent).toHaveLength(2);
  });

  it("unchecking an assigned technician and saving sends the reduced set", async () => {
    const user = userEvent.setup();
    render(<ManageServiceTechniciansDialog tenantId={TENANT_ID} service={manicure} onClose={vi.fn()} />);

    await user.click(screen.getByRole("checkbox", { name: /ada okafor/i }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(replaceMutate).toHaveBeenCalledWith([]);
  });

  it("closes and leaves the query cache to reflect the saved set on success", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<ManageServiceTechniciansDialog tenantId={TENANT_ID} service={manicure} onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});

describe("ManageServiceTechniciansDialog — never crosses tenants", () => {
  it("submits only ids that came from this tenant's own staff list", async () => {
    const user = userEvent.setup();
    render(<ManageServiceTechniciansDialog tenantId={TENANT_ID} service={manicure} onClose={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Save" }));

    const sent = replaceMutate.mock.calls[0][0] as string[];
    for (const id of sent) {
      expect([ada.id, bola.id]).toContain(id);
    }
  });
});

describe("ManageServiceTechniciansDialog — loading and error states", () => {
  it("shows a loading state before the roster or the assignment has resolved", () => {
    staffListResult.isPending = true;
    staffListResult.isSuccess = false;

    render(<ManageServiceTechniciansDialog tenantId={TENANT_ID} service={manicure} onClose={vi.fn()} />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("shows an error state with retry when either query fails", () => {
    staffListResult.isError = true;
    staffListResult.isSuccess = false;
    staffListResult.error = new Error("network down");

    render(<ManageServiceTechniciansDialog tenantId={TENANT_ID} service={manicure} onClose={vi.fn()} />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("filters out an archived technician who was never assigned to this service", () => {
    staffListResult.data = [ada, { ...bola, status: "ARCHIVED" }];
    assignedResult.data = { staff_ids: [ada.id] };

    render(<ManageServiceTechniciansDialog tenantId={TENANT_ID} service={manicure} onClose={vi.fn()} />);

    expect(screen.queryByRole("checkbox", { name: /bola adeyemi/i })).not.toBeInTheDocument();
  });

  it("keeps a since-archived technician visible if they were already assigned to this service", () => {
    staffListResult.data = [ada, { ...bola, status: "ARCHIVED" }];
    assignedResult.data = { staff_ids: [ada.id, bola.id] };

    render(<ManageServiceTechniciansDialog tenantId={TENANT_ID} service={manicure} onClose={vi.fn()} />);

    const bolaCheckbox = screen.getByRole("checkbox", { name: /bola adeyemi/i });
    expect(bolaCheckbox).toBeChecked();
  });

  it("shows an empty-roster message when the tenant has no technicians yet", () => {
    staffListResult.data = [];

    render(<ManageServiceTechniciansDialog tenantId={TENANT_ID} service={manicure} onClose={vi.fn()} />);

    expect(screen.getByText(/haven.t added any technicians yet/i)).toBeInTheDocument();
  });
});
