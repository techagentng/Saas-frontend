/**
 * Tenant-scoped query keys for the SC1 suggestion catalogue. Read-only (no
 * mutations exist for this resource), but still tenant-scoped: a suggestion
 * list is derived from the tenant's `business_type`, so a global key would let
 * Tenant A's NAIL_TECHNICIAN suggestions render while Tenant B (a different
 * vertical) is selected.
 */
export const serviceSuggestionKeys = {
  all: ["service-suggestions"] as const,
  tenant: (tenantId: string) => [...serviceSuggestionKeys.all, "tenant", tenantId] as const,
  list: (tenantId: string) => [...serviceSuggestionKeys.tenant(tenantId), "list"] as const,
};
