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
};
