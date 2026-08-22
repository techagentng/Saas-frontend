"use client";

import type { ReactNode } from "react";

import { useCan } from "@/providers/permissions-provider";
import type { Permission } from "@/types/permission";

type CanProps = {
  permission: Permission;
  /** Rendered when the permission is absent. Defaults to nothing. */
  fallback?: ReactNode;
  children: ReactNode;
};

/**
 * UX-only capability gate — hides/disables UI, never a security boundary.
 * The backend re-checks authorization on every request regardless.
 */
export function Can({ permission, fallback = null, children }: CanProps) {
  const allowed = useCan(permission);
  return <>{allowed ? children : fallback}</>;
}
