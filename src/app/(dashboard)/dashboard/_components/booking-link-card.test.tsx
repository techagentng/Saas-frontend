import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { resolveVerticalExperience } from "@/lib/vertical/experience";
import type { Tenant } from "@/types/tenant";

import { BookingLinkCard } from "./booking-link-card";

let currentTenant: Tenant | null = null;
let vertical = resolveVerticalExperience("NAIL_TECHNICIAN");

vi.mock("@/providers/tenant-provider", () => ({
  useTenant: () => ({ currentTenant }),
}));

vi.mock("@/lib/vertical/use-vertical-experience", () => ({
  useVerticalExperience: () => vertical,
}));

function tenant(overrides: Partial<Tenant> = {}): Tenant {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Glamour Nails",
    slug: "glamour-nails",
    status: "ACTIVE",
    description: null,
    contact_email: null,
    contact_phone: null,
    timezone: null,
    business_type: "NAIL_TECHNICIAN",
    onboarding_status: "COMPLETED",
    onboarding_step: null,
    currency: "NGN",
    created_at: "2026-09-01T00:00:00Z",
    updated_at: "2026-09-01T00:00:00Z",
    ...overrides,
  };
}

const writeText = vi.fn().mockResolvedValue(undefined);

beforeEach(() => {
  currentTenant = tenant();
  vertical = resolveVerticalExperience("NAIL_TECHNICIAN");
  writeText.mockClear();
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
});

describe("BookingLinkCard", () => {
  it("shows the canonical booking URL built from NEXT_PUBLIC_APP_URL", () => {
    render(<BookingLinkCard />);

    expect(screen.getByText("https://www.iweapps.com/book/glamour-nails")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open booking page/i })).toHaveAttribute(
      "href",
      "https://www.iweapps.com/book/glamour-nails"
    );
  });

  it("copies the link to the clipboard and shows transient feedback", async () => {
    render(<BookingLinkCard />);

    await userEvent.click(screen.getByRole("button", { name: /copy link/i }));

    expect(writeText).toHaveBeenCalledWith("https://www.iweapps.com/book/glamour-nails");
    expect(await screen.findByText("Copied")).toBeInTheDocument();
    // The button keeps its label — feedback is a separate status region.
    expect(screen.getByRole("button", { name: /copy link/i })).toBeInTheDocument();
  });

  it("renders nothing for a vertical without the appointment dashboard", () => {
    vertical = resolveVerticalExperience("HOTEL");
    const { container } = render(<BookingLinkCard />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when there is no tenant slug", () => {
    currentTenant = null;
    const { container } = render(<BookingLinkCard />);

    expect(container).toBeEmptyDOMElement();
  });
});
