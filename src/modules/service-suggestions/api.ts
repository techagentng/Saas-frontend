import { apiClient } from "@/lib/api/client";
import type { ServiceSuggestion } from "@/modules/service-suggestions/types";

/**
 * GET /api/v1/tenants/{tenantID}/service-suggestions — `service.read`.
 *
 * A tenant with no business type yet, or one whose vertical has no starter
 * catalogue defined, gets an empty list — a normal, successful response, not
 * an error. Never fetched from anywhere but this one tenant-scoped route:
 * there is no platform-wide "all suggestions" endpoint to accidentally call.
 */
export function listServiceSuggestions(
  tenantId: string,
  signal?: AbortSignal
): Promise<ServiceSuggestion[]> {
  return apiClient.get<ServiceSuggestion[]>(`/v1/tenants/${tenantId}/service-suggestions`, {
    signal,
  });
}
