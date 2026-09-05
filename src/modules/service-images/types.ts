/**
 * Frontend contract for the authenticated, tenant-facing service-image
 * surface, mirroring the backend's `PublicServiceImage` DTO field for field
 * (`internal/scheduling/handler/service_image_handler.go`).
 *
 * `storage_key`, `tenant_id` and `service_id` are all absent for the same
 * reason they're absent from the backend response: every management action
 * (delete, reorder, set cover) addresses an image by its own `id`, and
 * tenant/service are already known from the route.
 */
export type ServiceImage = {
  id: string;
  url: string;
  /** Null when the owner never supplied a caption. */
  alt_text: string | null;
  sort_order: number;
  /** True for at most one image per service — the one shown as the cover. */
  is_primary: boolean;
};
