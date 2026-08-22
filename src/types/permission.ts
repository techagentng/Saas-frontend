/**
 * Backend-defined capability identifier, e.g. "staff.create". No catalog is
 * enumerated here — the frontend treats permissions as opaque strings
 * sourced from the current tenant membership (Tenant.permissions) and never
 * hard-codes which ones exist.
 */
export type Permission = string;
