import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Testing Library's auto-cleanup only runs when a global `afterEach` exists,
// which it does not here — this project uses explicit vitest imports rather
// than `globals: true`, so the teardown is wired by hand.
afterEach(() => {
  cleanup();
});
