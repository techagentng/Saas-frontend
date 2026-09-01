import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LoginForm } from "./login-form";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => searchParams,
}));

const login = vi.fn();

vi.mock("@/providers/auth-provider", () => ({
  useAuth: () => ({ login }),
}));

let searchParams = new URLSearchParams();

beforeEach(() => {
  searchParams = new URLSearchParams();
  replace.mockReset();
  login.mockReset();
  login.mockResolvedValue({ id: "user-id", email: "person@example.com" });
  vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:8090/api");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function googleLink(): HTMLAnchorElement {
  return screen.getByRole("link", { name: /continue with google/i });
}

describe("the Google sign-in button", () => {
  it("navigates to the backend start endpoint", () => {
    render(<LoginForm />);

    expect(googleLink()).toHaveAttribute("href", "http://localhost:8090/api/v1/auth/google");
  });

  // OAuth is a chain of top-level redirects. An XHR could not follow the
  // cross-origin hop to Google, and the HttpOnly session cookie the callback
  // sets would never be stored — so this must stay a real navigation.
  it("is a plain anchor rather than a scripted request", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    render(<LoginForm />);

    const link = googleLink();
    expect(link.tagName).toBe("A");
    await userEvent.click(link);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(login).not.toHaveBeenCalled();
  });

  // The authorization-code exchange is the backend's job: it needs the client
  // secret, which must never reach the browser.
  it("never carries Google client credentials", () => {
    render(<LoginForm />);

    const href = googleLink().getAttribute("href") ?? "";
    expect(href).not.toContain("client_secret");
    expect(href).not.toContain("client_id");
    expect(href).not.toContain("accounts.google.com");
  });

  it("preserves the deep link the visitor was bounced from", () => {
    searchParams = new URLSearchParams("redirect=/dashboard/services");
    render(<LoginForm />);

    expect(googleLink().getAttribute("href")).toBe(
      "http://localhost:8090/api/v1/auth/google?return_to=%2Fdashboard%2Fservices"
    );
  });
});

describe("a failed Google sign-in", () => {
  it("shows safe copy and still allows a retry", () => {
    searchParams = new URLSearchParams("auth_error=OAUTH_DENIED");
    render(<LoginForm />);

    expect(screen.getByRole("alert")).toHaveTextContent(/cancelled/i);
    // The flow stays retryable: the button and the password form are both
    // still there.
    expect(googleLink()).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("does not render an unrecognized code back to the page", () => {
    searchParams = new URLSearchParams("auth_error=<img src=x onerror=alert(1)>");
    render(<LoginForm />);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(/couldn't complete sign-in with Google/i);
    expect(alert.textContent).not.toContain("onerror");
  });

  it("is absent when the visitor simply opened the login page", () => {
    render(<LoginForm />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

// The Google button is additive: the existing credential flow is untouched.
describe("password sign-in", () => {
  it("still signs in and lands on the dashboard", async () => {
    render(<LoginForm />);

    await userEvent.type(screen.getByLabelText(/email address/i), "person@example.com");
    await userEvent.type(screen.getByLabelText(/^password$/i), "correct-horse");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(login).toHaveBeenCalledWith({ email: "person@example.com", password: "correct-horse" });
    expect(replace).toHaveBeenCalledWith("/dashboard");
  });

  it("honors the redirect parameter after a successful sign-in", async () => {
    searchParams = new URLSearchParams("redirect=/dashboard/services");
    render(<LoginForm />);

    await userEvent.type(screen.getByLabelText(/email address/i), "person@example.com");
    await userEvent.type(screen.getByLabelText(/^password$/i), "correct-horse");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(replace).toHaveBeenCalledWith("/dashboard/services");
  });
});
