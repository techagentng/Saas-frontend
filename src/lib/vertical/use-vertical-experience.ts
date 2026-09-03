"use client";

import { useMemo } from "react";

import { resolveVerticalExperience } from "@/lib/vertical/experience";
import type { VerticalExperience } from "@/lib/vertical/experience";
import { useTenant } from "@/providers/tenant-provider";

/**
 * The single hook every vertical-aware component calls:
 *
 *   const vertical = useVerticalExperience();
 *   vertical.team.plural
 *   vertical.team.addLabel
 *   vertical.capabilities.staffWorkingHours
 *
 * Derives purely from the selected workspace's persisted `business_type`
 * (never its name, slug, URL, or the user's role) via `useTenant`. No
 * provider and no local state, so there is no cross-tenant configuration to
 * leak: switching workspaces changes `currentTenant`, which changes
 * `business_type`, which recomputes the memo — `Technicians` becomes
 * `Drivers` immediately, with no stale nail UI left behind.
 *
 * The memo depends on the primitive `business_type` string, not the tenant
 * object identity, so it recomputes exactly when the vertical actually
 * changes and not on every unrelated tenant re-render.
 */
export function useVerticalExperience(): VerticalExperience {
  const { currentTenant } = useTenant();
  const businessType = currentTenant?.business_type ?? null;

  return useMemo(() => resolveVerticalExperience(businessType), [businessType]);
}
