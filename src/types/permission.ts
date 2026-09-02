/**
 * Stable permission codes currently seeded on the backend
 * (migrations/000006_seed_roles_permissions.up.sql in the Go monolith).
 * Not a speculative catalog — every code here is actually assigned to a
 * role today. Kept as a union purely for compile-time safety at
 * `can(...)`/`<Can permission=...>` call sites; see `Permission` below for
 * why unrecognized codes still work at runtime.
 */
export type KnownPermissionCode =
  | "user.read"
  | "user.create"
  | "user.update"
  | "user.disable"
  | "tenant.read"
  | "tenant.update"
  | "role.read"
  | "role.create"
  | "role.update"
  | "role.delete"
  | "role.assign"
  | "permission.read"
  | "permission.assign"
  // Scheduling S1 (migration 000011_seed_service_permissions). BUSINESS_OWNER
  // holds all four; STAFF holds `service.read` only — a technician needs to
  // see the menu, while pricing and catalog structure are owner decisions.
  | "service.read"
  | "service.create"
  | "service.update"
  | "service.archive"
  // Scheduling S3 (migration 000013_seed_staff_permissions). BUSINESS_OWNER
  // holds all four; STAFF holds `staff.read` only — a technician can see the
  // roster, but who is employed and what they can perform are owner
  // decisions. There is deliberately no `staff.assign`: capability
  // assignment rides on `staff.update`.
  | "staff.read"
  | "staff.create"
  | "staff.update"
  | "staff.archive";

/**
 * Backend-defined capability identifier. Not restricted to
 * `KnownPermissionCode` — the frontend must keep working if the backend
 * adds a new permission code without a matching frontend release, so
 * unrecognized strings from the effective-permissions response still flow
 * through and behave correctly (just without editor autocomplete).
 */
export type Permission = KnownPermissionCode | (string & {});
