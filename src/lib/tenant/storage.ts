import { useSyncExternalStore } from "react";

/**
 * Persists only the *selected tenant id* as a UX convenience (remember the
 * last-viewed tenant across visits). This is never treated as proof of
 * membership or authorization — the backend re-verifies access to a tenant
 * on every request regardless of what's stored here.
 */
const TENANT_STORAGE_KEY = "bk_current_tenant_id";

type Listener = () => void;
const listeners = new Set<Listener>();

function emitChange(): void {
  for (const listener of listeners) listener();
}

export function getPersistedTenantId(): string | null {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage.getItem(TENANT_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setPersistedTenantId(tenantId: string): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(TENANT_STORAGE_KEY, tenantId);
  } catch {
    // Storage unavailable (private browsing, quota) — selection just won't persist.
  }

  emitChange();
}

export function clearPersistedTenantId(): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(TENANT_STORAGE_KEY);
  } catch {
    // no-op
  }

  emitChange();
}

function subscribe(callback: Listener): () => void {
  listeners.add(callback);
  window.addEventListener("storage", callback); // keeps other tabs in sync
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

function getServerSnapshot(): string | null {
  return null;
}

/**
 * Reads the persisted tenant id, re-rendering on same-tab writes (via
 * set/clearPersistedTenantId) and cross-tab writes (via the `storage`
 * event). Safe across SSR/hydration: the server snapshot is always `null`,
 * React reconciles the real value after mount without a hydration warning.
 */
export function usePersistedTenantId(): string | null {
  return useSyncExternalStore(subscribe, getPersistedTenantId, getServerSnapshot);
}
