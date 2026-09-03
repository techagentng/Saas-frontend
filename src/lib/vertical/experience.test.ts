import { describe, expect, it } from "vitest";

import {
  GENERIC_VERTICAL_EXPERIENCE,
  resolveVerticalExperience,
} from "@/lib/vertical/experience";
import type { BusinessType } from "@/types/tenant";

describe("resolveVerticalExperience — NAIL_TECHNICIAN", () => {
  const nail = resolveVerticalExperience("NAIL_TECHNICIAN");

  it("uses technician team language", () => {
    expect(nail.team.singular).toBe("Technician");
    expect(nail.team.plural).toBe("Technicians");
    expect(nail.team.addLabel).toBe("Add technician");
  });

  it("calls a booking an appointment", () => {
    expect(nail.terminology.booking).toBe("Appointment");
    expect(nail.terminology.bookings).toBe("Appointments");
  });

  it("enables every appointment capability — the fully developed vertical", () => {
    expect(nail.capabilities).toEqual({
      appointmentServices: true,
      staffServiceCapabilities: true,
      staffWorkingHours: true,
      appointmentAvailability: true,
      appointmentDashboard: true,
    });
  });
});

describe("resolveVerticalExperience — TRANSPORT", () => {
  const transport = resolveVerticalExperience("TRANSPORT");

  it("uses driver team language", () => {
    expect(transport.team.singular).toBe("Driver");
    expect(transport.team.plural).toBe("Drivers");
    expect(transport.team.addLabel).toBe("Add driver");
  });

  it("never says technician", () => {
    expect(JSON.stringify(transport).toLowerCase()).not.toContain("technician");
  });

  it("hides every appointment capability — existing services are not routes", () => {
    expect(transport.capabilities.appointmentServices).toBe(false);
    expect(transport.capabilities.staffServiceCapabilities).toBe(false);
    expect(transport.capabilities.staffWorkingHours).toBe(false);
    expect(transport.capabilities.appointmentAvailability).toBe(false);
    expect(transport.capabilities.appointmentDashboard).toBe(false);
  });
});

describe("resolveVerticalExperience — HOTEL", () => {
  const hotel = resolveVerticalExperience("HOTEL");

  it("uses generic staff-member / Team language", () => {
    expect(hotel.team.singular).toBe("Staff member");
    expect(hotel.team.plural).toBe("Team");
    expect(hotel.team.addLabel).toBe("Add staff member");
  });

  it("never says technician", () => {
    expect(JSON.stringify(hotel).toLowerCase()).not.toContain("technician");
  });

  it("hides every appointment capability — no fake hotel rooms/stays", () => {
    expect(Object.values(hotel.capabilities).every((v) => v === false)).toBe(true);
  });
});

describe("resolveVerticalExperience — RESTAURANT", () => {
  const restaurant = resolveVerticalExperience("RESTAURANT");

  it("uses generic team-member / Team language", () => {
    expect(restaurant.team.singular).toBe("Team member");
    expect(restaurant.team.plural).toBe("Team");
    expect(restaurant.team.addLabel).toBe("Add team member");
  });

  it("never says technician", () => {
    expect(JSON.stringify(restaurant).toLowerCase()).not.toContain("technician");
  });

  it("hides every appointment capability — a table is not a renamed service", () => {
    expect(Object.values(restaurant.capabilities).every((v) => v === false)).toBe(true);
  });
});

describe("resolveVerticalExperience — unknown / unset business type fails safe", () => {
  it("returns the conservative generic config for null", () => {
    expect(resolveVerticalExperience(null)).toBe(GENERIC_VERTICAL_EXPERIENCE);
  });

  it("returns the conservative generic config for undefined", () => {
    expect(resolveVerticalExperience(undefined)).toBe(GENERIC_VERTICAL_EXPERIENCE);
  });

  it("returns the conservative generic config for a future backend enum this build predates", () => {
    // Cast models a value the backend adds before the frontend knows it.
    const future = resolveVerticalExperience("SPA" as BusinessType);

    expect(future).toBe(GENERIC_VERTICAL_EXPERIENCE);
    expect(future.team.plural).toBe("Team");
    expect(future.capabilities.appointmentDashboard).toBe(false);
  });

  it("never defaults an unknown vertical to nail", () => {
    const future = resolveVerticalExperience("SPA" as BusinessType);

    expect(future.team.singular).not.toBe("Technician");
    expect(future.terminology.booking).not.toBe("Appointment");
  });
});

describe("resolveVerticalExperience — no cross-vertical state", () => {
  it("returns a stable value per business type and does not mutate between calls", () => {
    const first = resolveVerticalExperience("NAIL_TECHNICIAN");
    resolveVerticalExperience("TRANSPORT");
    const second = resolveVerticalExperience("NAIL_TECHNICIAN");

    expect(second).toEqual(first);
    expect(second.team.plural).toBe("Technicians");
  });
});
