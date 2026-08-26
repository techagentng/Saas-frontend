/**
 * Matches the Go backend's identity.PublicUser exactly (internal/identity/model/user.go)
 * — confirmed against source. There is no `name` field on the backend; the
 * earlier frontend assumption of one was fabricated and has been removed.
 */
export type AuthUser = {
  id: string;
  email: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type LoginCredentials = {
  email: string;
  password: string;
};

/**
 * Raw shape of POST /v1/auth/login and /v1/auth/refresh responses
 * (identity/handler.writeAuthenticationResult). There is deliberately no
 * `refresh_token` field: the refresh credential is delivered as an HttpOnly
 * cookie that JavaScript cannot read. Both endpoints return `user` — refresh
 * includes it so a reloaded browser can rebuild its identity without a
 * separate "current user" endpoint.
 */
export type AuthenticationResult = {
  user?: AuthUser;
  access_token: string;
  expires_in: number;
};

export type AuthState = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
};
