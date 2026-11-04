import { NextRequest, NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/api-base";
import {
  REFRESH_COOKIE_NAME,
  clearRefreshCookieOptions,
  refreshCookieOptions,
} from "@/lib/auth-cookie";

// BFF refresh: lee la cookie, pide par nuevo al backend, repone
// la cookie y devuelve el access nuevo. Si el backend da 401
// (refresh inválido o familia quemada), borra la cookie y da 401.
export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get(REFRESH_COOKIE_NAME)?.value;
  if (!refreshToken) {
    return NextResponse.json({ message: "Sin sesión" }, { status: 401 });
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(`${getApiBaseUrl()}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    return NextResponse.json(
      { message: "No se pudo contactar al backend" },
      { status: 502 },
    );
  }

  const data = await backendRes.json().catch(() => null);
  if (!backendRes.ok) {
    const res = NextResponse.json(
      data ?? { message: "Sesión inválida" },
      { status: backendRes.status },
    );
    // Solo se borra la cookie con 401: un error transitorio del
    // backend no debe matar una sesión válida.
    if (backendRes.status === 401) {
      res.cookies.set(
        REFRESH_COOKIE_NAME,
        "",
        clearRefreshCookieOptions(),
      );
    }
    return res;
  }
  const {
    accessToken,
    refreshToken: newRefreshToken,
    expiresIn,
  } = data as {
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: number;
  };
  if (typeof accessToken !== "string" || typeof newRefreshToken !== "string") {
    return NextResponse.json(
      { message: "Respuesta inesperada del backend" },
      { status: 502 },
    );
  }

  const res = NextResponse.json({ accessToken, expiresIn: expiresIn ?? 900 });
  res.cookies.set(
    REFRESH_COOKIE_NAME,
    newRefreshToken,
    refreshCookieOptions(),
  );
  return res;
}
