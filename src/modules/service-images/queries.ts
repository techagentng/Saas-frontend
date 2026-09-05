"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  deleteServiceImage,
  listServiceImages,
  reorderServiceImages,
  updateServiceImage,
  uploadServiceImages,
} from "@/modules/service-images/api";
import type { UpdateServiceImageInput } from "@/modules/service-images/api";
import { serviceImageKeys } from "@/modules/service-images/keys";
import { useAuth } from "@/providers/auth-provider";

/**
 * The image gallery for one service. Disabled until authentication has
 * settled and both a real tenant id and a real (already-created) service id
 * are present — a brand-new, not-yet-created service has no gallery to fetch
 * at all, which is exactly why the Add Service builder manages its own local
 * `File[]` state instead of calling this hook (see
 * `add-service-builder/service-image-picker.tsx`).
 */
export function useServiceImages(tenantId: string | undefined, serviceId: string | undefined) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: serviceImageKeys.list(tenantId ?? "", serviceId ?? ""),
    queryFn: ({ signal }) => listServiceImages(tenantId as string, serviceId as string, signal),
    enabled: isAuthenticated && Boolean(tenantId) && Boolean(serviceId),
  });
}

function useGalleryInvalidation(tenantId: string, serviceId: string) {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: serviceImageKeys.service(tenantId, serviceId) });
}

export function useUploadServiceImages(tenantId: string, serviceId: string) {
  const onGalleryChange = useGalleryInvalidation(tenantId, serviceId);

  return useMutation({
    mutationFn: (files: File[]) => uploadServiceImages(tenantId, serviceId, files),
    onSuccess: onGalleryChange,
  });
}

export function useDeleteServiceImage(tenantId: string, serviceId: string) {
  const onGalleryChange = useGalleryInvalidation(tenantId, serviceId);

  return useMutation({
    mutationFn: (imageId: string) => deleteServiceImage(tenantId, serviceId, imageId),
    onSuccess: onGalleryChange,
  });
}

export function useUpdateServiceImage(tenantId: string, serviceId: string) {
  const onGalleryChange = useGalleryInvalidation(tenantId, serviceId);

  return useMutation({
    mutationFn: ({ imageId, input }: { imageId: string; input: UpdateServiceImageInput }) =>
      updateServiceImage(tenantId, serviceId, imageId, input),
    onSuccess: onGalleryChange,
  });
}

export function useReorderServiceImages(tenantId: string, serviceId: string) {
  const onGalleryChange = useGalleryInvalidation(tenantId, serviceId);

  return useMutation({
    mutationFn: (imageIds: string[]) => reorderServiceImages(tenantId, serviceId, imageIds),
    onSuccess: onGalleryChange,
  });
}
