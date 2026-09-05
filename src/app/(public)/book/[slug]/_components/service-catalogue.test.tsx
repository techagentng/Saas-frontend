import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import type { PublicService } from "@/modules/public-booking/types";

import { ServiceCatalogue } from "./service-catalogue";

const svc = (id: string, name: string, extra: Record<string, unknown> = {}): PublicService =>
  ({
    id,
    name,
    description: "A meticulous manicure technique that includes cuticle care.",
    duration_minutes: 45,
    price_minor: 1500000,
    category: null,
    images: [],
    ...extra,
  }) as PublicService;

describe("ServiceCatalogue — today (no backend categories)", () => {
  it("shows a single 'All Services' label rather than a lone tab, and every service row", () => {
    render(
      <ServiceCatalogue
        slug="luxe-nails"
        currency="NGN"
        services={[svc("a", "Russian Manicure with Gel Polish"), svc("b", "Gel X Full Set")]}
      />
    );

    expect(screen.getByText("All Services")).toBeInTheDocument();
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("renders real backend values and a Select link into the S9 flow", () => {
    render(<ServiceCatalogue slug="luxe-nails" currency="NGN" services={[svc("a", "Russian Manicure with Gel Polish")]} />);

    const row = screen.getByRole("listitem");
    expect(within(row).getByRole("heading", { name: "Russian Manicure with Gel Polish" })).toBeInTheDocument();
    expect(within(row).getByText(/meticulous manicure technique/i)).toBeInTheDocument();
    expect(within(row).getByText("45 min")).toBeInTheDocument();
    expect(within(row).getByText("₦15,000.00")).toBeInTheDocument();
    expect(within(row).getByRole("link", { name: "Select Russian Manicure with Gel Polish" })).toHaveAttribute(
      "href",
      "/book/luxe-nails/availability?service_id=a"
    );
  });

  it("null currency stays symbol-free", () => {
    render(<ServiceCatalogue slug="luxe-nails" currency={null} services={[svc("a", "Builder Gel")]} />);

    const row = screen.getByRole("listitem");
    expect(within(row).getAllByText("15,000.00").length).toBeGreaterThan(0);
    expect(within(row).queryByText(/₦/)).not.toBeInTheDocument();
  });

  it("marks the pre-selected service", () => {
    render(
      <ServiceCatalogue
        slug="luxe-nails"
        currency="NGN"
        selectedServiceId="b"
        services={[svc("a", "Russian Manicure"), svc("b", "Gel X Full Set")]}
      />
    );

    expect(screen.getByRole("link", { name: "Select Gel X Full Set" })).toHaveTextContent("Selected");
    expect(screen.getByRole("link", { name: "Select Russian Manicure" })).toHaveTextContent("Select");
  });
});

describe("ServiceCatalogue — category-ready (backend `category` present)", () => {
  const services = [
    svc("a", "Russian Manicure", { category: "Natural Nails" }),
    svc("b", "Gel X Full Set", { category: "Nail Extensions" }),
    svc("c", "Builder Gel", { category: "Natural Nails" }),
  ];

  it("renders one real tab per category and filters the rows on selection", async () => {
    render(<ServiceCatalogue slug="luxe-nails" currency="NGN" services={services} />);

    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((t) => t.textContent)).toEqual(["Natural Nails2", "Nail Extensions1"]);

    // First tab active by default → 2 rows.
    expect(screen.getAllByRole("listitem")).toHaveLength(2);

    await userEvent.click(screen.getByRole("tab", { name: /Nail Extensions/ }));
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "Gel X Full Set" })).toBeInTheDocument();
  });
});
