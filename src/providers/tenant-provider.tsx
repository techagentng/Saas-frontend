"use client";

import { createContext, useCallback, useContext, useEffect, useMemo } from "react";
import type { ReactNode } from "react";

import { clearPersistedTenantId, setPersistedTenantId, usePersistedTenantId } from "@/lib/tenant/storage";
import { useTenants } from "@/modules/tenant/queries";
import { useAuth } from "@/providers/auth-provider";
import type { Tenant } from "@/types/tenant";

type TenantContextValue = {
  availableTenants: Tenant[];
  currentTenant: Tenant | null;
  setCurrentTenant: (tenant: Tenant | null) => void;
  isTenantLoading: boolean;
  clearTenant: () => void;
};

const TenantContext = createContext<TenantContextValue | null>(null);

export function TenantProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const tenantsQuery = useTenants();
  const availableTenants = useMemo(() => tenantsQuery.data ?? [], [tenantsQuery.data]);
  const persistedTenantId = usePersistedTenantId();

  // A stale tenant selection must never carry across sessions or users.
  useEffect(() => {
    if (!isAuthenticated) {
      clearPersistedTenantId();
    }
  }, [isAuthenticated]);

  const currentTenant = useMemo(() => {
    if (!isAuthenticated) return null;

    const selected = availableTenants.find((tenant) => tenant.id === persistedTenantId);
    if (selected) return selected;

    // No selection (or the persisted id no longer matches an available tenant):
    // auto-select when there's only one option, otherwise defer to a selector.
    if (availableTenants.length === 1) return availableTenants[0];

    return null;
  }, [isAuthenticated, availableTenants, persistedTenantId]);

  const setCurrentTenant = useCallback((tenant: Tenant | null) => {
    if (tenant) {
      setPersistedTenantId(tenant.id);
    } else {
      clearPersistedTenantId();
    }
  }, []);

  const clearTenant = useCallback(() => {
    clearPersistedTenantId();
  }, []);

  const isTenantLoading = isAuthenticated && tenantsQuery.isLoading;

  const value = useMemo<TenantContextValue>(
    () => ({
      availableTenants,
      currentTenant,
      setCurrentTenant,
      isTenantLoading,
      clearTenant,
    }),
    [availableTenants, currentTenant, setCurrentTenant, isTenantLoading, clearTenant]
  );

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant(): TenantContextValue {
  const context = useContext(TenantContext);

  if (!context) {
    throw new Error("useTenant must be used within a TenantProvider");
  }

  return context;
}
