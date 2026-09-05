/**
 * Frontend contract for the SC1 platform suggestion catalogue, mirroring the
 * backend's `ServiceSuggestion` DTO field for field
 * (`internal/scheduling/handler/suggestion_handler.go`).
 *
 * A suggestion has no `id`: it is never persisted and never referenced
 * afterward — a template the owner copies into their own catalog, once,
 * after which the tenant owns the copy outright. There is deliberately no
 * price field of any name; price is salon-specific and entered only when the
 * tenant creates the real service.
 */
export type ServiceSuggestion = {
  category: string;
  name: string;
  description: string;
  suggested_duration_minutes: number;
};
