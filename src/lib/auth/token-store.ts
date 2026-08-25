import { useSyncExternalStore } from "react";

/**
 * In-memory only — deliberately never persisted to localStorage or
 * sessionStorage. The backend has no cookie/session mechanism at all
 * (confirmed: zero Set-Cookie anywhere in the Go monolith) and hands the
 * frontend a bare Bearer access+refresh token pair in the JSON response
 * body, so there is no httpOnly option available. Given that constraint,
 * memory-only is the smallest-exposure option: a hard reload signs the
 * user out rather than leaving a long-lived credential sitting in browser
 * storage indefinitely. See Frontend Epic 01 F4 correction report.
 */
export type Tokens = { accessToken: string; refreshToken: string } | null;

let tokens: Tokens = null;
const listeners = new Set<() => void>();

function emitChange(): void {
  for (const listener of listeners) listener();
}

export function getTokens(): Tokens {
  return tokens;
}

export function setTokens(next: Tokens): void {
  tokens = next;
  emitChange();
}

export function clearTokens(): void {
  setTokens(null);
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getServerSnapshot(): Tokens {
  return null;
}

/** Reactive read of the current tokens — re-renders on any setTokens/clearTokens call, from anywhere (e.g. the apiClient's background refresh). */
export function useTokens(): Tokens {
  return useSyncExternalStore(subscribe, getTokens, getServerSnapshot);
}
