import type { BusinessType } from "@/types/tenant";

/**
 * V1 — Vertical Experience Configuration.
 *
 * One typed record that translates the platform's *shared* domain concepts
 * (a `StaffProfile`, a bookable service, an availability window) into the
 * product language and module set a given `business_type` should actually
 * see. It is presentational + product-gating only — never authorization.
 * The backend re-checks every request regardless of what this returns, and
 * `business_type` is never consulted by its Authorizer (mirrors
 * `lib/tenant/scheduling.ts`).
 *
 * This is deliberately NOT a fake-genericity layer: a hotel is not a nail
 * salon with "technician" renamed. Where the shared domain genuinely
 * applies (a roster of people) the terminology adapts; where it does not
 * (appointment services, per-staff working hours feeding the S7 availability
 * engine) the capability is switched OFF and the UI hides it rather than
 * pretending a nail feature is a hotel feature. Real hotel/restaurant/
 * transport booking models are separate future features.
 */
export type VerticalExperience = {
  /**
   * Echoed back so callers can key a memo/`key` on it and so it is legible
   * in devtools. `null` means the tenant has no business type (a pre-F1
   * legacy tenant) OR the backend returned a value this build does not
   * recognize — both resolve to the conservative generic config below.
   */
  businessType: BusinessType | null;

  team: {
    /**
     * One member of the roster in product language, e.g. "Technician".
     * The domain/code layer still says `staff` / `StaffProfile` / `staffId`
     * everywhere — this is the UI word only, and the separation is
     * intentional.
     */
    singular: string;
    /**
     * The nav + Team-page label for this vertical's roster, e.g.
     * "Technicians" for nail, "Drivers" for transport, but just "Team" for
     * hotel/restaurant where the members have no distinctive title.
     */
    plural: string;
    /**
     * The members as a countable plural noun, e.g. "3 technicians", "3 staff
     * members". Distinct from `plural` because a collective label ("Team")
     * cannot take a count.
     */
    memberPlural: string;
    /** The create action, e.g. "Add technician". */
    addLabel: string;
  };

  /**
   * Nouns for shared concepts that keep the same *shape* across verticals
   * but read differently. Only concepts that genuinely survive translation
   * live here — a restaurant table is not a renamed service, so there is no
   * `table` key.
   */
  terminology: {
    service: string;
    services: string;
    booking: string;
    bookings: string;
  };

  capabilities: {
    /** A bookable service catalog exists for this vertical (Scheduling S2 / Catalog S8). */
    appointmentServices: boolean;
    /** Per-staff "which services can this person perform" assignment (S3 `staff_services`). */
    staffServiceCapabilities: boolean;
    /** Per-staff recurring weekly working hours (S5/S6). */
    staffWorkingHours: boolean;
    /** This vertical is wired into the appointment availability engine (S7). */
    appointmentAvailability: boolean;
    /** The appointment-oriented dashboard (today's schedule, technician overview, etc.). */
    appointmentDashboard: boolean;
  };
};

/**
 * The conservative fail-safe. Applied to an unset `business_type` and — by
 * design — to any future backend enum value this build predates, so a new
 * vertical can never accidentally inherit nail appointment functionality
 * before it has been deliberately configured here. Generic team language,
 * every appointment-specific capability off.
 */
export const GENERIC_VERTICAL_EXPERIENCE: VerticalExperience = {
  businessType: null,
  team: {
    singular: "Team member",
    plural: "Team",
    memberPlural: "team members",
    addLabel: "Add team member",
  },
  terminology: {
    service: "Service",
    services: "Services",
    booking: "Booking",
    bookings: "Bookings",
  },
  capabilities: {
    appointmentServices: false,
    staffServiceCapabilities: false,
    staffWorkingHours: false,
    appointmentAvailability: false,
    appointmentDashboard: false,
  },
};

/**
 * The one place a `business_type` is turned into product experience. Nothing
 * else in the app should branch on `business_type === "NAIL_TECHNICIAN"` for
 * presentation — that scatter is exactly what this table removes.
 */
const VERTICAL_EXPERIENCES: Record<BusinessType, VerticalExperience> = {
  /**
   * The fully-developed appointment vertical: `Service + Technician +
   * Duration + Time`. Every capability on.
   */
  NAIL_TECHNICIAN: {
    businessType: "NAIL_TECHNICIAN",
    team: {
      singular: "Technician",
      plural: "Technicians",
      memberPlural: "technicians",
      addLabel: "Add technician",
    },
    terminology: {
      service: "Service",
      services: "Services",
      booking: "Appointment",
      bookings: "Appointments",
    },
    capabilities: {
      appointmentServices: true,
      staffServiceCapabilities: true,
      staffWorkingHours: true,
      appointmentAvailability: true,
      appointmentDashboard: true,
    },
  },

  /**
   * `Route / Trip + Vehicle / Seat + Departure` (future). A driver roster is
   * a real shared concept, so the team language adapts; the existing
   * appointment services/availability are NOT routes and stay hidden.
   */
  TRANSPORT: {
    businessType: "TRANSPORT",
    team: {
      singular: "Driver",
      plural: "Drivers",
      memberPlural: "drivers",
      addLabel: "Add driver",
    },
    terminology: { ...GENERIC_VERTICAL_EXPERIENCE.terminology },
    capabilities: { ...GENERIC_VERTICAL_EXPERIENCE.capabilities },
  },

  /**
   * `Room / Room Type + Date Range + Inventory` (future). Hotel staff are a
   * team, not "technicians"; nothing appointment-specific applies.
   */
  HOTEL: {
    businessType: "HOTEL",
    team: {
      singular: "Staff member",
      plural: "Team",
      memberPlural: "staff members",
      addLabel: "Add staff member",
    },
    terminology: { ...GENERIC_VERTICAL_EXPERIENCE.terminology },
    capabilities: { ...GENERIC_VERTICAL_EXPERIENCE.capabilities },
  },

  /**
   * `Table / Capacity + Party Size + Time` (future). A restaurant team is a
   * team; a table is not a renamed service.
   */
  RESTAURANT: {
    businessType: "RESTAURANT",
    team: {
      singular: "Team member",
      plural: "Team",
      memberPlural: "team members",
      addLabel: "Add team member",
    },
    terminology: { ...GENERIC_VERTICAL_EXPERIENCE.terminology },
    capabilities: { ...GENERIC_VERTICAL_EXPERIENCE.capabilities },
  },
};

/**
 * Pure resolver — usable outside React (tests, and the `useVerticalExperience`
 * hook). `null`/`undefined`/unrecognized all fall through to the generic
 * fail-safe; there is no path that defaults an unknown vertical to nail.
 */
export function resolveVerticalExperience(
  businessType: BusinessType | null | undefined
): VerticalExperience {
  if (businessType == null) return GENERIC_VERTICAL_EXPERIENCE;
  return VERTICAL_EXPERIENCES[businessType] ?? GENERIC_VERTICAL_EXPERIENCE;
}
