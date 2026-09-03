import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Permission } from "@/types/permission";

import { QuickActions } from "./QuickActions";

const granted = new Set<Permission>();

vi.mock("@/providers/permissions-provider", () => ({
  usePermissions: () => granted,
}));

let bookingHref: string | null = "https://www.iweapps.com/book/glamour-nails";

vi.mock("@/lib/tenant/use-booking-page-href", () => ({
  useBookingPageHref: () => ({ absolute: bookingHref, href: bookingHref }),
}));

beforeEach(() => {
  granted.clear();
  bookingHref = "https://www.iweapps.com/book/glamour-nails";
});

describe("QuickActions", () => {
  it("wires 'Add service' to the real Services page for a user who can create services", () => {
    granted.add("service.create");
    render(<QuickActions />);

    const link = screen.getByRole("link", { name: /add service/i });
    expect(link).toHaveAttribute("href", "/dashboard/services");
  });

  it("hides 'Add service' without service.create (backend still enforces)", () => {
    render(<QuickActions />); // no permissions

    expect(screen.queryByRole("link", { name: /add service/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/add service/i)).not.toBeInTheDocument();
  });

  it("wires the team and booking-page actions to their real destinations", () => {
    granted.add("staff.create");
    granted.add("staff.read");
    render(<QuickActions />);

    expect(screen.getByRole("link", { name: /add technician/i })).toHaveAttribute(
      "href",
      "/dashboard/team"
    );
    const bookingLink = screen.getByRole("link", { name: /open booking page/i });
    expect(bookingLink).toHaveAttribute("href", "https://www.iweapps.com/book/glamour-nails");
    expect(bookingLink).toHaveAttribute("target", "_blank");
  });

  it("renders no dead buttons — every remaining action is a link or an explicit 'Soon'", () => {
    granted.add("service.create");
    granted.add("staff.create");
    granted.add("staff.read");
    render(<QuickActions />);

    // The only non-link actions are the not-yet-built ones, each badged Soon.
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    const soon = screen.getAllByText("Soon");
    expect(soon.length).toBe(2); // New booking, View customers
  });

  it("does not render 'Open booking page' as a link when no slug is resolved", () => {
    bookingHref = null;
    render(<QuickActions />);

    expect(screen.queryByRole("link", { name: /open booking page/i })).not.toBeInTheDocument();
    // Falls back to a disabled 'Soon' rather than a broken link.
    expect(screen.getByText(/open booking page/i)).toBeInTheDocument();
  });
});
