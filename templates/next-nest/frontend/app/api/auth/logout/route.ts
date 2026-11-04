import { NextRequest, NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/api-base";
import {
  REFRESH_COOKIE_NAME,
  clearRefreshCookieOptions,
} from "@/lib/auth-cookie";

// BFF logout: reenvía el refresh al backend (quema la familia)
// y borra la cookie. Sin cookie, igual 204: logout idempotente.
export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get(REFRESH_COOKIE_NAME)?.value;
  if (refreshToken) {
    try {
      await fetch(`${getApiBaseUrl()}/api/v1/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      // Igual se borra la cookie: el logout no falla por el backend.
    }
  }

  const res = new NextResponse(null, { status: 204 });
  res.cookies.set(REFRESH_COOKIE_NAME, "", clearRefreshCookieOptions());
  return res;
}
