import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const AUTH_COOKIE_NAME = "voxora_auth";
const LOGIN_PATH = "/login";
const AUTH_DISABLED = false;

export function proxy(request: NextRequest) {
  if (AUTH_DISABLED) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  if (pathname === LOGIN_PATH) {
    return NextResponse.next();
  }

  const isAuthenticated =
    request.cookies.get(AUTH_COOKIE_NAME)?.value === "authenticated";

  if (isAuthenticated) {
    return NextResponse.next();
  }

  const loginUrl = new URL(LOGIN_PATH, request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
  ],
};
