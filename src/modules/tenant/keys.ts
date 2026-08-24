/**
 * Single source of truth for tenant React Query keys. Invalidating
 * `tenantKeys.all` covers both the list and every detail query, since
 * TanStack Query matches keys by prefix.
 */
export const tenantKeys = {
  all: ["tenants"] as const,
  list: () => [...tenantKeys.all, "list"] as const,
  detail: (tenantId: string) => [...tenantKeys.all, "detail", tenantId] as const,
};
