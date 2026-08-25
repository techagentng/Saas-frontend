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
  | "permission.assign";

/**
 * Backend-defined capability identifier. Not restricted to
 * `KnownPermissionCode` — the frontend must keep working if the backend
 * adds a new permission code without a matching frontend release, so
 * unrecognized strings from the effective-permissions response still flow
 * through and behave correctly (just without editor autocomplete).
 */
export type Permission = KnownPermissionCode | (string & {});
