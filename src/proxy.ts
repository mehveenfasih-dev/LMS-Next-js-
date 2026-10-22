import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth-config";

const { auth } = NextAuth(authConfig);

export default auth((request) => {
  const pathname = request.nextUrl.pathname;
  const role = request.auth?.user?.role;
  const isAdminRoute = [
    "/dashboard",
    "/books",
    "/requests",
    "/users",
    "/reports",
    "/settings",
  ].some((route) => pathname === route || pathname.startsWith(`${route}/`));
  const isMemberRoute =
    pathname === "/my-requests" ||
    pathname.startsWith("/my-requests/") ||
    pathname === "/profile" ||
    pathname.startsWith("/profile/");

  if ((isAdminRoute && role !== "admin") || (isMemberRoute && !role)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isMemberRoute && role === "admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/books/:path*",
    "/requests/:path*",
    "/users/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/my-requests/:path*",
    "/profile/:path*",
  ],
};
