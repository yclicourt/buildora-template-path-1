// Definición exacta de la cookie de refresh (spec §3.2).
// Solo constantes: este módulo no importa next/headers ni nada
// de cliente, así que lo pueden usar handlers, middleware y lib.

export const REFRESH_COOKIE_NAME = "{{PROJECT_NAME}}_refresh_token";
export const REFRESH_COOKIE_PATH = "/";
// 7 días en segundos: igual al default JWT_REFRESH_EXPIRES_IN del backend.
// Si ese default cambia en el backend, cambiar aquí también.
export const REFRESH_COOKIE_MAX_AGE = 604800;

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

export function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "lax" as const,
    path: REFRESH_COOKIE_PATH,
    maxAge: REFRESH_COOKIE_MAX_AGE,
  };
}

export function clearRefreshCookieOptions() {
  return {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "lax" as const,
    path: REFRESH_COOKIE_PATH,
    maxAge: 0,
  };
}
