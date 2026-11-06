import { HttpErrorResponse } from '@angular/common/http';

/**
 * Human-readable message from a FastAPI error response.
 *
 * FastAPI answers validation errors (422) with `{ detail: [{ msg, ... }] }`
 * and domain errors (400/401/...) with `{ detail: "…" }`. Anything else
 * falls back to the HTTP status text.
 */
export function apiErrorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    const detail: unknown = (err.error as { detail?: unknown } | null)?.detail;
    if (typeof detail === 'string' && detail.length > 0) {
      return detail;
    }
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0] as { msg?: unknown } | undefined;
      if (first && typeof first.msg === 'string') {
        return first.msg;
      }
    }
    if (err.status === 0) {
      return 'No se pudo conectar con el servidor. Revisa que el backend esté corriendo.';
    }
    return `Error ${err.status}: ${err.statusText || 'petición fallida'}`;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return 'Error desconocido';
}
