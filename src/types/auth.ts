/**
 * Minimal authenticated-user shape. Deliberately excludes tenant/role data —
 * tenant state is out of scope for this phase (see AGENTS.md).
 */
export type AuthUser = {
  id: string;
  email: string;
  name?: string;
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export type AuthState = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
};
