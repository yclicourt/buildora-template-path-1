// Cliente de auth del frontend.
//
// - El ciclo de la cookie (login/refresh/logout) pasa por el BFF
//   (/api/auth/*): el navegador nunca ve el refresh token.
// - Los datos (/me, registro) van directos al backend.
// - El access token vive SOLO en memoria. Prohibido localStorage
//   y sessionStorage para tokens en este proyecto.

import { getApiBaseUrl } from "./api-base";

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthTokens {
  accessToken: string;
  expiresIn: number;
}

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

let accessToken: string | null = null;
let refreshPromise: Promise<AuthTokens> | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function clearSession(): void {
  accessToken = null;
  refreshPromise = null;
}

function redirectToLogin(): void {
  if (
    typeof window !== "undefined" &&
    window.location.pathname !== "/login"
  ) {
    window.location.href = "/login";
  }
}

async function parseError(res: Response): Promise<ApiError> {
  let message = `Error ${res.status}`;
  let code: string | undefined;
  try {
    const body = (await res.json()) as {
      message?: unknown;
      code?: unknown;
      error?: unknown;
    };
    if (typeof body.message === "string") message = body.message;
    if (typeof body.code === "string") code = body.code;
    if (typeof body.error === "string") message = body.error;
  } catch {
    // Cuerpo no-JSON: se queda el mensaje genérico.
  }
  return new ApiError(res.status, message, code);
}

export async function login(
  email: string,
  password: string,
): Promise<AuthTokens> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw await parseError(res);
  const data = (await res.json()) as AuthTokens;
  accessToken = data.accessToken;
  return data;
}

export async function register(
  email: string,
  name: string,
  password: string,
): Promise<User> {
  const res = await fetch(`${getApiBaseUrl()}/api/v1/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, name, password }),
  });
  if (!res.ok) throw await parseError(res);
  return (await res.json()) as User;
}

async function doRefresh(): Promise<AuthTokens> {
  const res = await fetch("/api/auth/refresh", { method: "POST" });
  if (!res.ok) {
    accessToken = null;
    throw await parseError(res);
  }
  const data = (await res.json()) as AuthTokens;
  accessToken = data.accessToken;
  return data;
}

// Single-flight: si varias llamadas piden refresh a la vez, solo
// sale una request y las demás esperan la misma promesa.
export function refresh(): Promise<AuthTokens> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        return await doRefresh();
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

export async function logout(): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } finally {
    clearSession();
  }
}

async function fetchMe(token: string): Promise<Response> {
  return fetch(`${getApiBaseUrl()}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getMe(): Promise<User> {
  const res = await fetchMe(accessToken ?? "");
  if (res.status === 401) {
    // Un intento de refresh y un solo reintento.
    try {
      await refresh();
    } catch {
      clearSession();
      redirectToLogin();
      throw new ApiError(401, "Sesión expirada");
    }
    const retry = await fetchMe(accessToken ?? "");
    if (!retry.ok) {
      clearSession();
      redirectToLogin();
      throw await parseError(retry);
    }
    return (await retry.json()) as User;
  }
  if (!res.ok) throw await parseError(res);
  return (await res.json()) as User;
}
