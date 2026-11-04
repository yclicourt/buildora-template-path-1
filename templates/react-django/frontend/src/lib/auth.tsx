/**
 * Session state for the SPA.
 *
 * Token handling (non-negotiable, mirrors the path-1 BFF idea adapted
 * to an SPA):
 *
 * - The access token lives in React memory only (a ref). It is never
 *   written to localStorage or sessionStorage, so a script injection
 *   cannot steal a long-lived credential from storage.
 * - The refresh token lives in Django's httpOnly cookie
 *   (`refresh_token`, path `/api/auth/`, SameSite=Lax). JavaScript
 *   cannot read it; the browser sends it automatically with
 *   `credentials: "include"` requests. The login JSON still carries a
 *   `refresh` field for backwards compatibility — this module ignores
 *   it on purpose and uses the cookie path only.
 * - `authFetch` retries once after a 401: it refreshes the access
 *   token (single-flight, so concurrent 401s share one refresh call)
 *   and replays the request exactly once. If the refresh fails, the
 *   session is cleared and the caller gets the original error.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ApiError, apiFetch, type FetchInit } from "./api";

export interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "user";
}

export type AuthStatus = "loading" | "authenticated" | "anonymous";

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  authFetch: <T>(path: string, init?: FetchInit) => Promise<T>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Single-flight refresh shared by every concurrent 401 retry. */
let refreshPromise: Promise<string | null> | null = null;

function refreshAccess(): Promise<string | null> {
  if (!refreshPromise) {
    // Empty JSON body: DRF parses it as {} and the backend reads the
    // refresh token from the httpOnly cookie instead.
    refreshPromise = apiFetch<{ access: string }>("/api/auth/refresh/", {
      method: "POST",
      body: "{}",
    })
      .then((data) => data.access)
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const accessRef = useRef<string | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<User | null>(null);

  const clearSession = useCallback(() => {
    accessRef.current = null;
    setUser(null);
    setStatus("anonymous");
  }, []);

  const authFetch = useCallback(
    async <T,>(path: string, init: FetchInit = {}): Promise<T> => {
      try {
        return await apiFetch<T>(path, init, accessRef.current);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          const access = await refreshAccess();
          if (access) {
            accessRef.current = access;
            return await apiFetch<T>(path, init, access);
          }
          clearSession();
        }
        throw error;
      }
    },
    [clearSession],
  );

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiFetch<{ access: string }>("/api/auth/login/", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    // The JSON `refresh` field is ignored on purpose: the cookie set
    // by login carries the refresh token from here on.
    accessRef.current = data.access;
    const me = await apiFetch<User>("/api/auth/me/", {}, data.access);
    setUser(me);
    setStatus("authenticated");
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      await apiFetch("/api/auth/register/", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      // No auto-login: the backend returns no tokens on register, so
      // the user signs in afterwards (same contract as path 1).
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      // Empty JSON body: the backend reads the refresh token from the
      // cookie and blacklists it, then clears the cookie.
      await apiFetch("/api/auth/logout/", {
        method: "POST",
        body: "{}",
      }, accessRef.current);
    } catch {
      // Logging out locally even if the server call fails (expired
      // access token, network error): a dead session must not linger.
    } finally {
      clearSession();
    }
  }, [clearSession]);

  // Restore the session on load: me() succeeds when the access token
  // is still valid, and authFetch's 401 -> refresh -> retry covers the
  // case where only the cookie survived (e.g. after a page reload).
  useEffect(() => {
    let cancelled = false;
    authFetch<User>("/api/auth/me/")
      .then((me) => {
        if (!cancelled) {
          setUser(me);
          setStatus("authenticated");
        }
      })
      .catch(() => {
        if (!cancelled) {
          clearSession();
        }
      });
    return () => {
      cancelled = true;
    };
  }, [authFetch, clearSession]);

  const value = useMemo(
    () => ({ status, user, login, register, logout, authFetch }),
    [status, user, login, register, logout, authFetch],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
