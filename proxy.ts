import { NextResponse, type NextRequest } from "next/server";

import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
  REGISTRATION_TOKEN_COOKIE_NAME,
} from "@/shared/api";
import { loginRedirectReasons, routes } from "@/shared/routes";

const PUBLIC_PATHS: ReadonlySet<string> = new Set([
  routes.login,
  routes.localLogin,
  routes.offline,
]);

function hasSessionCookie(request: NextRequest): boolean {
  return (
    request.cookies.has(ACCESS_TOKEN_COOKIE_NAME) ||
    request.cookies.has(REFRESH_TOKEN_COOKIE_NAME)
  );
}

function isSignupPath(pathname: string): boolean {
  return pathname === routes.signup || pathname.startsWith(`${routes.signup}/`);
}

export function proxy(request: NextRequest) {
  if (isSignupPath(request.nextUrl.pathname)) {
    return request.cookies.has(REGISTRATION_TOKEN_COOKIE_NAME)
      ? NextResponse.next()
      : NextResponse.redirect(new URL(routes.login, request.nextUrl));
  }

  if (PUBLIC_PATHS.has(request.nextUrl.pathname) || hasSessionCookie(request)) {
    return NextResponse.next();
  }

  // 앱 첫 진입(홈)은 로그인 화면이 곧 시작 화면이라 안내하지 않는다.
  // 링크·알림으로 특정 화면에 바로 들어온 경우에만 로그인이 필요하다고 알린다.
  const loginPath =
    request.nextUrl.pathname === routes.home
      ? routes.login
      : routes.loginWithReason(loginRedirectReasons.authRequired);

  return NextResponse.redirect(new URL(loginPath, request.nextUrl));
}

export const config = {
  matcher: [
    "/((?!api|bug-reports|serwist/|_next/static|_next/image|manifest.webmanifest|mockServiceWorker.js|favicon.ico|.*\\.png$).*)",
  ],
};
