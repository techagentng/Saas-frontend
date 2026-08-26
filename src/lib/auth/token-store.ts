import { useSyncExternalStore } from "react";

/**
 * The ACCESS token only, held in memory and deliberately never persisted to
 * localStorage or sessionStorage. Persistence across reloads is provided by
 * the backend's HttpOnly `bk_refresh` cookie instead, which JavaScript
 * cannot read — so an XSS payload can steal at most a token that expires in
 * minutes, never the long-lived session credential.
 *
 * Losing this on reload is expected and no longer signs the user out:
 * AuthProvider re-mints it from the refresh cookie at startup (see
 * providers/auth-provider.tsx).
 */
export type Tokens = { accessToken: string } | null;

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

/** Reactive read of the current access token — re-renders on any setTokens/clearTokens call, from anywhere (e.g. the apiClient's background refresh). */
export function useTokens(): Tokens {
  return useSyncExternalStore(subscribe, getTokens, getServerSnapshot);
}
