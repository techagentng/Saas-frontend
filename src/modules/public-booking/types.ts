import type { BusinessType } from "@/types/tenant";

/**
 * Frontend contract for the anonymous public booking surface (Scheduling S8),
 * mirroring the backend DTOs field for field:
 *
 *   - `PublicTenantIdentity` — internal/tenant/handler/public_tenant_handler.go
 *   - `PublicCatalogResponse` / `PublicCatalogItem`
 *       — internal/scheduling/handler/public_service_handler.go
 *
 * These are plain transport shapes with NO coupling to any React component,
 * so the Next.js booking page and the future React Native customer app
 * consume the identical types. Deliberately absent, because the backend never
 * sends them to an anonymous caller: internal tenant UUID, lifecycle status,
 * onboarding status/step, timestamps, private contact details, per-service
 * status/tenant_id.
 */

/** GET /api/v1/public/tenants/{slug} */
export type PublicTenant = {
  slug: string;
  name: string;
  /** Null when the business never set one. */
  description: string | null;
  /** IANA zone, or null. Not shown in S8 UI, but part of the wire shape. */
  timezone: string | null;
  /**
   * The one field that decides which customer experience to render. Null for a
   * pre-vertical legacy tenant; an unrecognized value is possible if the
   * backend adds a vertical before the frontend does — both are treated as
   * "online booking not available for this business type".
   */
  business_type: BusinessType | null;
};

/** One customer-facing service row. */
export type PublicService = {
  id: string;
  name: string;
  /** Null when the business never wrote one. */
  description: string | null;
  duration_minutes: number;
  /**
   * Integer minor units (e.g. kobo/cents), paired with the catalog-level
   * `currency`. Never parsed as a float — see `lib/money/money.ts`.
   */
  price_minor: number;
  /**
   * The category's display name, or null for an uncategorised service
   * (Scheduling SC1). There is deliberately no `category_id` — this is the
   * anonymous public surface, and the id is an internal detail the owner
   * dashboard needs but a customer never does. See
   * `modules/public-booking/categories.ts` for how this groups the catalogue.
   */
  category: string | null;
  /**
   * This service's photos, in display order — `[]` when none were uploaded.
   * Mirrors `PublicCatalogImage` (`internal/scheduling/handler/public_service_handler.go`)
   * field for field. See `components/service-image-carousel.tsx` for how the
   * public page renders 0/1/2+ of these.
   */
  images: PublicServiceImage[];
};

/** One customer-facing service photo. */
export type PublicServiceImage = {
  id: string;
  url: string;
  /** Null when the business never captioned it — callers fall back to the service's own name. */
  alt_text: string | null;
  sort_order: number;
  /** True for at most one image per service — the cover shown before any gallery interaction. */
  is_primary: boolean;
};

/**
 * One customer-facing technician (Scheduling S9).
 * `GET /api/v1/public/tenants/{slug}/services/{serviceID}/staff`.
 *
 * Exactly what a customer needs to choose who to book with. The backend
 * deliberately never sends more: no `user_id`, no status, no `is_bookable`,
 * no bio, no timestamps, and no authorization role — a business owner who
 * performs services appears here as an ordinary technician.
 */
export type PublicStaff = {
  id: string;
  name: string;
};

/** `GET .../services/{serviceID}/staff` envelope. `staff` may be empty. */
export type PublicServiceStaff = {
  service_id: string;
  staff: PublicStaff[];
};

/** One bookable window, tenant-local wall-clock "HH:MM" strings from the S7 engine. */
export type PublicAvailabilitySlot = {
  start: string;
  end: string;
};

/**
 * `GET /api/v1/public/tenants/{slug}/availability?service_id=&staff_id=&date=`
 * (Scheduling S9). Echoes the resolved query context — notably `timezone`,
 * the tenant's own authoritative zone the slots are expressed in — then the
 * slots. `slots` is `[]` for a day with no availability (a 200, never an
 * error). No internal scheduling data (instants, offsets, occupied intervals)
 * is exposed.
 */
export type PublicAvailability = {
  date: string;
  timezone: string;
  service_id: string;
  staff_id: string;
  slots: PublicAvailabilitySlot[];
};

/**
 * `POST /api/v1/public/tenants/{slug}/bookings` request body (Scheduling S10),
 * mirroring `publicBookingRequest` in
 * `internal/scheduling/handler/public_booking_handler.go` field for field.
 *
 * Deliberately NOT here (the backend derives or ignores every one): tenant id,
 * duration, the authoritative `end`, price, currency, timezone, service name,
 * staff name. Only `service_id`, `staff_id`, `date`, `start` and the customer.
 */
export type CreatePublicBookingInput = {
  service_id: string;
  staff_id: string;
  /** Tenant-local calendar date, `YYYY-MM-DD`. */
  date: string;
  /** Tenant-local wall-clock start, `HH:MM` — must be one of the slots S9 returned. */
  start: string;
  customer: {
    /** Required. Trimmed and length-bounded by the backend. */
    name: string;
    /** Optional free text. Omitted when blank. */
    phone?: string;
    /** Optional. Must be a valid address if present. Omitted when blank. */
    email?: string;
  };
};

/**
 * The persisted booking the backend returns on `201`. Customer-safe: no
 * tenant id, no customer PII echoed back, no timestamps, no internal
 * scheduling maths. `reference` is a display-only human tag ("NB-1A2B3C4D");
 * `id` is the canonical UUID.
 */
export type PublicBookingConfirmation = {
  id: string;
  reference: string;
  status: string;
  service: { id: string; name: string };
  staff: { id: string; name: string };
  date: string;
  start: string;
  end: string;
  timezone: string;
};

/** `POST .../bookings` `201` envelope — the booking under a `booking` key. */
export type CreatePublicBookingResponse = {
  booking: PublicBookingConfirmation;
};

/** GET /api/v1/public/tenants/{slug}/services */
export type PublicServiceCatalog = {
  /**
   * ISO 4217 code every `price_minor` in this catalog is denominated in.
   * Null until the business declares a currency (Scheduling S1 allows a
   * tenant to exist without one); the UI must render prices without crashing
   * and without assuming a currency in that case.
   */
  currency: string | null;
  /** Only ACTIVE services, in the backend's deterministic order. May be empty. */
  services: PublicService[];
};
