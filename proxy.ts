import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth/constants";
import {
  DEFAULT_LOGIN_REDIRECT,
  PROTECTED_ROUTES,
  PUBLIC_AUTH_ROUTES,
} from "@/lib/auth/routes";
import { isValidSessionToken } from "@/lib/auth/proxy-session";

function matchesRoute(pathname: string, routes: readonly string[]) {
  return routes.some((route) => {
    if (pathname === route) return true;
    return pathname.startsWith(`${route}/`);
  });
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedRoute = matchesRoute(pathname, PROTECTED_ROUTES);
  const isPublicAuthRoute = matchesRoute(pathname, PUBLIC_AUTH_ROUTES);

  if (!isProtectedRoute && !isPublicAuthRoute) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const isAuthenticated = token ? await isValidSessionToken(token) : false;

  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isPublicAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/signup", "/documents/:path*"],
};
