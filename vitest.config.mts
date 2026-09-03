import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

/**
 * Per node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md.
 * `vite-tsconfig-paths` is what makes the project's own `@/*` alias resolve
 * inside tests, so test files import modules exactly as application code does
 * rather than through relative paths that would drift on every move.
 *
 * Async Server Components are explicitly unsupported by Vitest (same doc), so
 * every component test here targets a `"use client"` component — which is all
 * of the S2 UI.
 */
export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    // Public config the app reads through process.env at module load. Tests
    // that assert normalization behaviour override these per-case with
    // vi.stubEnv; everything else just needs them present so a helper does
    // not throw "not set" during an unrelated render.
    env: {
      NEXT_PUBLIC_API_URL: "http://localhost:8090/api",
      NEXT_PUBLIC_APP_URL: "https://www.iweapps.com",
    },
  },
});
