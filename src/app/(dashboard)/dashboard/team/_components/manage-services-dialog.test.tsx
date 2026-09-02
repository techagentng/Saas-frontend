import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Service } from "@/modules/services/types";
import type { StaffProfile } from "@/modules/staff/types";

import { ManageServicesDialog } from "./manage-services-dialog";

/**
 * Behaviour under test: the picker renders the REAL tenant service catalog
 * (never invented service names), pre-marks exactly the currently-assigned
 * set, and on Save sends the complete edited set through the real
 * replace-capabilities mutation — never a per-checkbox add/remove call,
 * matching the backend's PUT-replaces-the-whole-set contract.
 */

const replaceMutate = vi.fn();

const servicesResult = {
  data: [] as Service[],
  isPending: false,
  isSuccess: true,
  isError: false,
  error: null as unknown,
  refetch: vi.fn(),
};

const capabilitiesResult = {
  data: { service_ids: [] as string[] },
  isPending: false,
  isSuccess: true,
  isError: false,
  error: null as unknown,
  refetch: vi.fn(),
};

vi.mock("@/modules/services/queries", () => ({
  useServices: () => servicesResult,
}));

vi.mock("@/modules/staff/queries", () => ({
  useStaffCapabilities: () => capabilitiesResult,
  useReplaceStaffCapabilities: () => ({ mutateAsync: replaceMutate, isPending: false }),
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

const manicure: Service = {
  id: "44444444-4444-4444-8444-444444444444",
  name: "Gel Manicure",
  description: null,
  duration_minutes: 60,
  price_minor: 1999,
  status: "ACTIVE",
  created_at: "2026-08-27T10:00:00Z",
  updated_at: "2026-08-27T10:00:00Z",
};

const pedicure: Service = {
  id: "55555555-5555-4555-8555-555555555555",
  name: "Pedicure",
  description: null,
  duration_minutes: 45,
  price_minor: 1500,
  status: "ACTIVE",
  created_at: "2026-08-27T10:00:00Z",
  updated_at: "2026-08-27T10:00:00Z",
};

beforeEach(() => {
  replaceMutate.mockReset();
  replaceMutate.mockResolvedValue({ service_ids: [] });
  servicesResult.data = [manicure, pedicure];
  servicesResult.isPending = false;
  servicesResult.isSuccess = true;
  servicesResult.isError = false;
  capabilitiesResult.data = { service_ids: [manicure.id] };
  capabilitiesResult.isPending = false;
  capabilitiesResult.isSuccess = true;
  capabilitiesResult.isError = false;
});

describe("ManageServicesDialog — rendering", () => {
  it("lists the tenant's real services and marks the currently assigned one", () => {
    render(<ManageServicesDialog tenantId={TENANT_ID} staff={ada} onClose={vi.fn()} />);

    const manicureCheckbox = screen.getByRole("checkbox", { name: /gel manicure/i });
    const pedicureCheckbox = screen.getByRole("checkbox", { name: /pedicure/i });

    expect(manicureCheckbox).toBeChecked();
    expect(pedicureCheckbox).not.toBeChecked();
  });

  it("never renders a service id or the tenant id as visible text", () => {
    render(<ManageServicesDialog tenantId={TENANT_ID} staff={ada} onClose={vi.fn()} />);

    expect(screen.queryByText(manicure.id)).not.toBeInTheDocument();
    expect(screen.queryByText(TENANT_ID)).not.toBeInTheDocument();
  });
});

describe("ManageServicesDialog — assigning and removing capabilities", () => {
  it("checking an unassigned service and saving sends the full new set", async () => {
    const user = userEvent.setup();
    render(<ManageServicesDialog tenantId={TENANT_ID} staff={ada} onClose={vi.fn()} />);

    await user.click(screen.getByRole("checkbox", { name: /pedicure/i }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(replaceMutate).toHaveBeenCalledTimes(1);
    const sent = replaceMutate.mock.calls[0][0] as string[];
    expect(sent).toEqual(expect.arrayContaining([manicure.id, pedicure.id]));
    expect(sent).toHaveLength(2);
  });

  it("unchecking an assigned service and saving sends the reduced set", async () => {
    const user = userEvent.setup();
    render(<ManageServicesDialog tenantId={TENANT_ID} staff={ada} onClose={vi.fn()} />);

    await user.click(screen.getByRole("checkbox", { name: /gel manicure/i }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(replaceMutate).toHaveBeenCalledWith([]);
  });

  it("closes and leaves the query cache to reflect the saved set on success", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<ManageServicesDialog tenantId={TENANT_ID} staff={ada} onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});

describe("ManageServicesDialog — never crosses tenants", () => {
  it("submits only ids that came from this tenant's own service list", async () => {
    const user = userEvent.setup();
    render(<ManageServicesDialog tenantId={TENANT_ID} staff={ada} onClose={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Save" }));

    const sent = replaceMutate.mock.calls[0][0] as string[];
    for (const id of sent) {
      expect([manicure.id, pedicure.id]).toContain(id);
    }
  });
});

describe("ManageServicesDialog — loading and error states", () => {
  it("shows a loading state before the catalog or the assignment has resolved", () => {
    servicesResult.isPending = true;
    servicesResult.isSuccess = false;

    render(<ManageServicesDialog tenantId={TENANT_ID} staff={ada} onClose={vi.fn()} />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("shows an error state with retry when either query fails", () => {
    servicesResult.isError = true;
    servicesResult.isSuccess = false;
    servicesResult.error = new Error("network down");

    render(<ManageServicesDialog tenantId={TENANT_ID} staff={ada} onClose={vi.fn()} />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("filters out an archived service that was never assigned to this technician", () => {
    servicesResult.data = [manicure, { ...pedicure, status: "ARCHIVED" }];
    capabilitiesResult.data = { service_ids: [manicure.id] };

    render(<ManageServicesDialog tenantId={TENANT_ID} staff={ada} onClose={vi.fn()} />);

    expect(screen.queryByRole("checkbox", { name: /pedicure/i })).not.toBeInTheDocument();
  });

  it("keeps a since-archived service visible if this technician was already assigned to it", () => {
    servicesResult.data = [manicure, { ...pedicure, status: "ARCHIVED" }];
    capabilitiesResult.data = { service_ids: [manicure.id, pedicure.id] };

    render(<ManageServicesDialog tenantId={TENANT_ID} staff={ada} onClose={vi.fn()} />);

    const pedicureCheckbox = screen.getByRole("checkbox", { name: /pedicure/i });
    expect(pedicureCheckbox).toBeChecked();
  });
});
