export type Tenant = {
  id: string;
  name: string;
  slug: string;
  /**
   * Permission identifiers granted to the current user within this tenant
   * (see types/permission.ts). Shape assumed pending the real backend
   * contract — see modules/tenant/api.ts.
   */
  permissions: string[];
};
