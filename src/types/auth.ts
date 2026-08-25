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
 * (identity/handler.writeAuthenticationResult). `user` is only present on
 * login — refresh omits it (omitempty, and the backend has no separate
 * "current user" endpoint to re-fetch it from).
 */
export type AuthenticationResult = {
  user?: AuthUser;
  access_token: string;
  refresh_token: string;
  expires_in: number;
};

export type AuthState = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
};
