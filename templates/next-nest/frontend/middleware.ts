import { NextRequest, NextResponse } from "next/server";
import { REFRESH_COOKIE_NAME } from "@/lib/auth-cookie";

// Solo presencia de la cookie: no prueba validez (eso lo confirma
// /me). Sin cookie en ruta protegida, a /login. Sin lógica de JWT aquí.
export function middleware(req: NextRequest) {
  const hasSession = Boolean(req.cookies.get(REFRESH_COOKIE_NAME)?.value);
  if (!hasSession) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
