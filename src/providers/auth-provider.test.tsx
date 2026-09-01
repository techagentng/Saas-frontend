import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { clearTokens, setTokens } from "@/lib/auth/token-store";
import { AuthProvider, useAuth } from "@/providers/auth-provider";
import type { AuthUser } from "@/types/auth";

const refreshAccessToken = vi.fn();

vi.mock("@/lib/api/client", () => ({
  refreshAccessToken: () => refreshAccessToken(),
}));

vi.mock("@/modules/auth/api", () => ({
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
}));

const person: AuthUser = {
  id: "550e8400-e29b-41d4-a716-446655440040",
  email: "person@example.com",
  status: "ACTIVE",
  created_at: "2026-08-30T10:00:00Z",
  updated_at: "2026-08-30T10:00:00Z",
};

function Probe() {
  const { user, isAuthenticated, isLoading } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <span data-testid="email">{user?.email ?? ""}</span>
    </div>
  );
}

beforeEach(() => {
  refreshAccessToken.mockReset();
  clearTokens();
});

afterEach(() => {
  clearTokens();
});

/**
 * This is the last step of the Google OAuth flow. The backend callback sets the
 * HttpOnly refresh cookie and redirects the browser here; the frontend has no
 * access token in memory and cannot read that cookie, so the ONLY thing it does
 * is the session bootstrap it already performs on every reload.
 *
 * These tests assert that bootstrap, which is what makes Google sign-in need no
 * OAuth-specific frontend state at all.
 */
describe("session bootstrap after an OAuth redirect", () => {
  it("establishes the session from the refresh cookie alone", async () => {
    refreshAccessToken.mockImplementation(async () => {
      setTokens({ accessToken: "access-token" });
      return { accessToken: "access-token", user: person };
    });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
    expect(screen.getByTestId("authenticated")).toHaveTextContent("true");
    expect(screen.getByTestId("email")).toHaveTextContent(person.email);
    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
  });

  // No Google token store, and nothing OAuth-specific in this provider: the
  // session is rebuilt through exactly one call, the same one password login
  // relies on after a reload.
  it("uses the existing refresh mechanism and nothing else", async () => {
    refreshAccessToken.mockResolvedValue(null);

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
  });

  it("settles into a clean signed-out state when there is no valid cookie", async () => {
    refreshAccessToken.mockResolvedValue(null);

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
    expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
    expect(screen.getByTestId("email")).toHaveTextContent("");
  });
});
