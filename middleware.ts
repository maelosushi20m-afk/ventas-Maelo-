import { NextResponse, NextRequest } from "next/server";

// Middleware ligero: protección a nivel cliente con AuthGuard.
// Aquí solo redirigimos raíz a /login si no hay sesión cookie marker.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/"]
};
