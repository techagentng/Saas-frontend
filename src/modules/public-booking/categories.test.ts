import { describe, expect, it } from "vitest";

import {
  ALL_SERVICES_CATEGORY_ID,
  groupServicesByCategory,
} from "@/modules/public-booking/categories";
import type { PublicService } from "@/modules/public-booking/types";

const svc = (id: string, name: string, extra: Record<string, unknown> = {}): PublicService =>
  ({
    id,
    name,
    description: null,
    duration_minutes: 30,
    price_minor: 1000,
    category: null,
    ...extra,
  }) as PublicService;

describe("groupServicesByCategory — no backend category field (today)", () => {
  it("returns a single 'All Services' group over the real data, in order", () => {
    const services = [svc("a", "Russian Manicure"), svc("b", "Gel X Full Set"), svc("c", "Classic Pedicure")];

    const groups = groupServicesByCategory(services);

    expect(groups).toHaveLength(1);
    expect(groups[0].id).toBe(ALL_SERVICES_CATEGORY_ID);
    expect(groups[0].label).toBe("All Services");
    expect(groups[0].services).toEqual(services);
  });

  it("does NOT infer categories from service names", () => {
    const groups = groupServicesByCategory([
      svc("a", "Acrylic Powder on Nail Tips"),
      svc("b", "Spa Pedicure"),
      svc("c", "Nail Art"),
    ]);

    // "Extensions", "Pedicures", "Add-Ons" are NOT invented from the names.
    expect(groups.map((g) => g.label)).toEqual(["All Services"]);
  });

  it("returns an empty 'All Services' group for an empty catalogue", () => {
    expect(groupServicesByCategory([])).toEqual([
      { id: ALL_SERVICES_CATEGORY_ID, label: "All Services", services: [] },
    ]);
  });
});

describe("groupServicesByCategory — category-ready (when the backend adds `category`)", () => {
  it("groups by the real category field, preserving first-seen order", () => {
    const services = [
      svc("a", "Russian Manicure", { category: "Natural Nails" }),
      svc("b", "Gel X Full Set", { category: "Nail Extensions" }),
      svc("c", "Builder Gel (BIAB)", { category: "Natural Nails" }),
      svc("d", "Chrome Powder", { category: "Add-Ons" }),
    ];

    const groups = groupServicesByCategory(services);

    expect(groups.map((g) => g.label)).toEqual(["Natural Nails", "Nail Extensions", "Add-Ons"]);
    expect(groups[0].services.map((s) => s.id)).toEqual(["a", "c"]);
    expect(groups[0].id).toBe("natural-nails");
  });

  it("collects uncategorised services under 'Other'", () => {
    const groups = groupServicesByCategory([
      svc("a", "Nail Art", { category: "Add-Ons" }),
      svc("b", "Mystery Service", { category: null }),
      svc("c", "Blank Service", { category: "  " }),
    ]);

    expect(groups.map((g) => g.label)).toEqual(["Add-Ons", "Other"]);
    expect(groups[1].services.map((s) => s.id)).toEqual(["b", "c"]);
  });
});
