/**
 * Typed API client for the Django backend.
 *
 * Every request sends `credentials: "include"` so the browser attaches
 * the httpOnly refresh cookie on the cross-origin calls (Vite :{{FRONTEND_PORT}} ->
 * API :{{BACKEND_PORT}}). The access token, when given, goes in the Authorization
 * header and lives in frontend memory only — never in localStorage or
 * sessionStorage (see lib/auth.tsx).
 */

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:{{BACKEND_PORT}}";

export type FetchInit = Omit<RequestInit, "headers" | "body"> & {
  headers?: Record<string, string>;
  body?: string;
};

/** An HTTP error with the backend's message already extracted. */
export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

/**
 * Turns a DRF error body into one readable line. DRF answers either
 * `{"detail": "..."}` or field errors `{"email": ["..."]}`; both are
 * flattened, and unknown shapes fall back to the HTTP status.
 */
function extractDetail(body: unknown, status: number): string {
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    if (typeof record.detail === "string") {
      return record.detail;
    }
    const parts: string[] = [];
    for (const [field, messages] of Object.entries(record)) {
      if (Array.isArray(messages)) {
        parts.push(`${field}: ${messages.join(" ")}`);
      } else if (typeof messages === "string") {
        parts.push(`${field}: ${messages}`);
      }
    }
    if (parts.length > 0) {
      return parts.join(" ");
    }
  }
  return `Error ${status}`;
}

export async function apiFetch<T>(
  path: string,
  init: FetchInit = {},
  accessToken?: string | null,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers ?? {}),
  };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers,
  });
  if (!response.ok) {
    let detail = `Error ${response.status}`;
    try {
      detail = extractDetail(await response.json(), response.status);
    } catch {
      // Keep the status fallback when the body is not JSON.
    }
    throw new ApiError(response.status, detail);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export function getHealth(): Promise<{ status: string }> {
  return apiFetch<{ status: string }>("/api/health/");
}
