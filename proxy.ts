import { NextResponse, type NextRequest } from "next/server";

import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
} from "@/shared/api";
import { loginRedirectReasons, routes } from "@/shared/routes";

const PUBLIC_PATHS: ReadonlySet<string> = new Set([
  routes.login,
  routes.offline,
]);

function hasSessionCookie(request: NextRequest): boolean {
  return (
    request.cookies.has(ACCESS_TOKEN_COOKIE_NAME) ||
    request.cookies.has(REFRESH_TOKEN_COOKIE_NAME)
  );
}

export function proxy(request: NextRequest) {
  if (PUBLIC_PATHS.has(request.nextUrl.pathname) || hasSessionCookie(request)) {
    return NextResponse.next();
  }

  return NextResponse.redirect(
    new URL(
      routes.loginWithReason(loginRedirectReasons.authRequired),
      request.nextUrl,
    ),
  );
}

export const config = {
  matcher: [
    "/((?!api|serwist/|_next/static|_next/image|manifest.webmanifest|favicon.ico|.*\\.png$).*)",
  ],
};
