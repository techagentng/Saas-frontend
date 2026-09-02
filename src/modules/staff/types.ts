/**
 * Frontend contract for the Scheduling S3 staff roster, mirroring the
 * backend's `PublicStaff` DTO field for field
 * (`internal/scheduling/handler/staff_handler.go`).
 *
 * `tenant_id` is absent on purpose — it is already the caller's own tenant,
 * named in the route — matching how `Service` omits it too.
 */

/**
 * ACTIVE/ARCHIVED, the same vocabulary the service catalog uses, for the same
 * reason: a staff profile is archived, not "disabled" — DISABLED means "an
 * actor is barred from acting" everywhere else in this codebase, and a
 * schedulable resource is not an actor.
 */
export type StaffStatus = "ACTIVE" | "ARCHIVED";

export type StaffProfile = {
  id: string;
  /**
   * Null for a non-login worker who has no `users` row. When set, it names
   * an existing platform user who held an ACTIVE membership in this tenant
   * at write time — a reference, never an authorization fact. It cannot be
   * changed after creation (see `UpdateStaffInput`).
   */
  user_id: string | null;
  display_name: string;
  /** Null when never supplied; an empty string is a distinct, legitimate state ("bio cleared"). */
  bio: string | null;
  /**
   * Independent of `status`. A receptionist can be ACTIVE and not bookable;
   * an ARCHIVED profile is someone who no longer works here regardless of
   * this flag.
   */
  is_bookable: boolean;
  status: StaffStatus;
  created_at: string;
  updated_at: string;
};

/**
 * The `?status=` values `ParseStaffStatusFilter` accepts, mirroring the
 * catalog's own filter vocabulary. An omitted parameter means ACTIVE; an
 * unrecognized one is rejected with VALIDATION_FAILED rather than silently
 * defaulting, so this union must stay exact.
 */
export type StaffListFilter = "ACTIVE" | "ARCHIVED" | "ALL";

/** GET/PUT .../staff/{staffID}/services — service ids only. Resolving them to full service records is the catalog's job. */
export type StaffCapabilities = {
  service_ids: string[];
};
