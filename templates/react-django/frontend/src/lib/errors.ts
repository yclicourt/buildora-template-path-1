/**
 * Turns backend errors into Spanish-friendly text for the forms.
 *
 * Known messages are translated, including when they arrive prefixed
 * with a field label ("password: ..." becomes "Contraseña: ..." with
 * the message itself translated too). Field errors with unknown
 * messages keep the backend message verbatim but get a Spanish field
 * label. Anything unknown is shown verbatim — a confusing message is
 * better than a silently invented one.
 */

import { ApiError } from "./api";

const KNOWN_MESSAGES: Record<string, string> = {
  "No active account found with the given credentials.":
    "Correo o contraseña incorrectos.",
  "A user with this email already exists.":
    "Ya existe una cuenta con ese correo.",
  "A refresh token is required.":
    "La sesión expiró. Inicia sesión de nuevo.",
  "Refresh token is invalid or expired.":
    "La sesión expiró. Inicia sesión de nuevo.",
  "This password is too short. It must contain at least 8 characters.":
    "La contraseña es muy corta. Debe tener al menos 8 caracteres.",
  "This password is too common.":
    "Esa contraseña es muy común. Elige otra menos predecible.",
  "This password is entirely numeric.":
    "La contraseña no puede ser solo números.",
  "The password is too similar to the username.":
    "La contraseña se parece demasiado a tu correo.",
  "The password is too similar to the email.":
    "La contraseña se parece demasiado a tu correo.",
};

const FIELD_LABELS: Record<string, string> = {
  name: "Nombre",
  email: "Correo",
  password: "Contraseña",
};

export function toSpanishMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const translated = KNOWN_MESSAGES[error.detail];
    if (translated) {
      return translated;
    }
    const fieldMatch = error.detail.match(/^(\w+):\s(.+)$/s);
    if (fieldMatch && FIELD_LABELS[fieldMatch[1]]) {
      const message = KNOWN_MESSAGES[fieldMatch[2]] ?? fieldMatch[2];
      return `${FIELD_LABELS[fieldMatch[1]]}: ${message}`;
    }
    return error.detail;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Ocurrió un error inesperado.";
}
