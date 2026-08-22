"use client";

import type { ReactNode } from "react";

import { AuthProvider } from "@/providers/auth-provider";
import { PermissionsProvider } from "@/providers/permissions-provider";
import { QueryProvider } from "@/providers/query-provider";
import { TenantProvider } from "@/providers/tenant-provider";

/**
 * Root client-side provider tree. Order matters — each layer depends on
 * the one above it: TenantProvider reads auth state, PermissionsProvider
 * reads the current tenant. Deliberately not one merged context.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <TenantProvider>
          <PermissionsProvider>{children}</PermissionsProvider>
        </TenantProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
