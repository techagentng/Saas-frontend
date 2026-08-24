/**
 * Authenticated tenant record as returned by the backend
 * (POST/GET/PATCH /api/v1/tenants...). Field names mirror the API's JSON
 * response as-is — there's no camelCase translation layer in the API client.
 */
export type Tenant = {
  id: string;
  name: string;
  slug: string;
  status: string;
  description: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
  /**
   * Permission identifiers granted to the current user within this tenant.
   * Not yet part of the confirmed backend tenant contract (see Frontend
   * Epic 01 audit, F11) — PermissionsProvider depends on this field, so
   * it's kept here and normalized to `[]` by the API layer
   * (modules/tenant/api.ts) until the backend actually returns it.
   */
  permissions: string[];
};
