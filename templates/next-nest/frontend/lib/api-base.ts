// URL base del backend (NestJS). Se lee de NEXT_PUBLIC_API_URL
// (ver .env.example); el fallback es el puerto local del backend.
export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:{{BACKEND_PORT}}";
}
