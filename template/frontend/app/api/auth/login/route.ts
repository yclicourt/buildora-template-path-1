import { NextRequest, NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/api-base";
import {
  REFRESH_COOKIE_NAME,
  refreshCookieOptions,
} from "@/lib/auth-cookie";

// BFF login: reenvía al backend (server a server, sin CORS), pone
// la cookie httpOnly con el refresh y devuelve SOLO el access.
// El refresh NUNCA va en el body.
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { message: "Body JSON inválido" },
      { status: 400 },
    );
  }
  const { email, password } = body as {
    email?: unknown;
    password?: unknown;
  };
  if (typeof email !== "string" || typeof password !== "string") {
    return NextResponse.json(
      { message: "email y password son obligatorios" },
      { status: 400 },
    );
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(`${getApiBaseUrl()}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    return NextResponse.json(
      { message: "No se pudo contactar al backend" },
      { status: 502 },
    );
  }

  const data = await backendRes.json().catch(() => null);
  if (!backendRes.ok) {
    return NextResponse.json(
      data ?? { message: `Error del backend (${backendRes.status})` },
      { status: backendRes.status },
    );
  }
  const { accessToken, refreshToken, expiresIn } = data as {
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: number;
  };
  if (typeof accessToken !== "string" || typeof refreshToken !== "string") {
    return NextResponse.json(
      { message: "Respuesta inesperada del backend" },
      { status: 502 },
    );
  }

  const res = NextResponse.json({ accessToken, expiresIn: expiresIn ?? 900 });
  res.cookies.set(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
  return res;
}
