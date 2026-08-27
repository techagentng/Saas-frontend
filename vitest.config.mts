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
  },
});
