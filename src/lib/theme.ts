export type Theme = "light" | "dark";

/** localStorage key holding the user's explicit choice. */
export const THEME_STORAGE_KEY = "theme";

/**
 * What a visitor who has never used the toggle gets. Deliberately not the OS
 * preference: this is a light-mode product that offers dark as an opt-in, and
 * silently inheriting `prefers-color-scheme` is what produced pages rendered
 * half in each theme.
 */
export const DEFAULT_THEME: Theme = "light";

/** Narrows an untrusted string (localStorage, a DOM attribute) to a Theme. */
export function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}
