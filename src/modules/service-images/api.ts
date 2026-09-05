import { apiClient } from "@/lib/api/client";
import type { ServiceImage } from "@/modules/service-images/types";

/**
 * Raw calls against the service-image endpoints. Every route is tenant- and
 * service-scoped and sits behind Authentication → Tenant Context →
 * Authorization on the backend, reusing `service.read` (list) and
 * `service.update` (every write) rather than a parallel permission family —
 * the UI's own `useCan(...)` checks only hide controls; the backend remains
 * authoritative.
 */

/** GET /api/v1/tenants/{tenantID}/services/{serviceID}/images — `service.read`. */
export function listServiceImages(
  tenantId: string,
  serviceId: string,
  signal?: AbortSignal
): Promise<ServiceImage[]> {
  return apiClient.get<ServiceImage[]>(
    `/v1/tenants/${tenantId}/services/${serviceId}/images`,
    { signal }
  );
}

/**
 * POST /api/v1/tenants/{tenantID}/services/{serviceID}/images — `service.update`.
 *
 * multipart/form-data, one or more files under the repeated `images` field,
 * in the exact order they should be stored — the backend assigns
 * `sort_order` by that array position, and (only when the service has no
 * image at all yet) makes the FIRST file in the batch the cover. `FormData`
 * is handed to `apiClient.post` as-is; `lib/api/client.ts` recognizes it and
 * lets the browser attach its own multipart boundary rather than forcing a
 * JSON `Content-Type`.
 */
export function uploadServiceImages(
  tenantId: string,
  serviceId: string,
  files: File[],
  signal?: AbortSignal
): Promise<{ images: ServiceImage[] }> {
  const formData = new FormData();
  for (const file of files) formData.append("images", file);

  return apiClient.post<{ images: ServiceImage[] }>(
    `/v1/tenants/${tenantId}/services/${serviceId}/images`,
    formData,
    { signal }
  );
}

export type UpdateServiceImageInput = {
  alt_text?: string | null;
  /**
   * Only `true` is meaningful — the backend refuses `false` outright (there
   * is no "unset my own cover with no replacement" operation). Promote a
   * different image to change the cover instead.
   */
  is_primary?: true;
};

/** PATCH /api/v1/tenants/{tenantID}/services/{serviceID}/images/{imageID} — `service.update`. */
export function updateServiceImage(
  tenantId: string,
  serviceId: string,
  imageId: string,
  input: UpdateServiceImageInput,
  signal?: AbortSignal
): Promise<ServiceImage> {
  return apiClient.patch<ServiceImage>(
    `/v1/tenants/${tenantId}/services/${serviceId}/images/${imageId}`,
    input,
    { signal }
  );
}

/**
 * DELETE /api/v1/tenants/{tenantID}/services/{serviceID}/images/{imageID} — `service.update`.
 * 204 No Content — if the deleted image was the cover, the backend promotes
 * the next one (by `sort_order`) automatically; there is nothing for the
 * client to do about that beyond refetching.
 */
export function deleteServiceImage(
  tenantId: string,
  serviceId: string,
  imageId: string,
  signal?: AbortSignal
): Promise<void> {
  return apiClient.delete<void>(
    `/v1/tenants/${tenantId}/services/${serviceId}/images/${imageId}`,
    { signal }
  );
}

/**
 * PUT /api/v1/tenants/{tenantID}/services/{serviceID}/images/order — `service.update`.
 * `imageIds` must be exactly the service's current image ids, in the desired
 * order — no more, no fewer; the backend refuses anything else rather than
 * guessing.
 */
export function reorderServiceImages(
  tenantId: string,
  serviceId: string,
  imageIds: string[],
  signal?: AbortSignal
): Promise<ServiceImage[]> {
  return apiClient.put<ServiceImage[]>(
    `/v1/tenants/${tenantId}/services/${serviceId}/images/order`,
    { image_ids: imageIds },
    { signal }
  );
}
