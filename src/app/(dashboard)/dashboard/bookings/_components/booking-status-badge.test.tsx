import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { BookingStatus } from "@/modules/bookings/types";

import { BookingStatusBadge } from "./booking-status-badge";

describe("BookingStatusBadge — every backend status renders correctly", () => {
  const cases: Array<{ status: BookingStatus; label: string }> = [
    { status: "CONFIRMED", label: "Confirmed" },
    { status: "CANCELLED", label: "Cancelled" },
    { status: "COMPLETED", label: "Completed" },
    { status: "NO_SHOW", label: "No-show" },
  ];

  it.each(cases)("renders $status as \"$label\"", ({ status, label }) => {
    render(<BookingStatusBadge status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("gives each status a distinct visual treatment, not just text", () => {
    const classesByStatus = cases.map(({ status }) => {
      const { container, unmount } = render(<BookingStatusBadge status={status} />);
      const className = container.querySelector("span")?.className ?? "";
      unmount();
      return className;
    });

    expect(new Set(classesByStatus).size).toBe(cases.length);
  });

  it("never relies on colour alone — the label text always names the status", () => {
    for (const { status, label } of cases) {
      const { unmount } = render(<BookingStatusBadge status={status} />);
      const badge = screen.getByText(label);
      // The visible text node itself carries the meaning; no aria-hidden icon
      // pretending to substitute for it.
      expect(badge.textContent).toBe(label);
      unmount();
    }
  });
});
