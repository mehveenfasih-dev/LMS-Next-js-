// import NextAuth from "next-auth";
// import { NextResponse } from "next/server";
// import { authConfig } from "./auth-config";

// const { auth } = NextAuth(authConfig);

// export default auth((request) => {
//   const pathname = request.nextUrl.pathname;
//   const role = request.auth?.user?.role;
//   const isAdminRoute = [
//     "/dashboard",
//     "/books",
//     "/requests",
//     "/users",
//     "/reports",
//     "/settings",
//   ].some((route) => pathname === route || pathname.startsWith(`${route}/`));
//   const isMemberRoute =
//     pathname === "/my-requests" ||
//     pathname.startsWith("/my-requests/") ||
//     pathname === "/profile" ||
//     pathname.startsWith("/profile/");

//   if ((isAdminRoute && role !== "admin") || (isMemberRoute && !role)) {
//     const loginUrl = new URL("/login", request.url);
//     loginUrl.searchParams.set("next", pathname);
//     return NextResponse.redirect(loginUrl);
//   }

//   if (isMemberRoute && role === "admin") {
//     return NextResponse.redirect(new URL("/dashboard", request.url));
//   }

//   return NextResponse.next();
// });

// export const config = {
//   matcher: [
//     "/dashboard/:path*",
//     "/books/:path*",
//     "/requests/:path*",
//     "/users/:path*",
//     "/reports/:path*",
//     "/settings/:path*",
//     "/my-requests/:path*",
//     "/profile/:path*",
//   ],
// };




import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth-config";

const { auth } = NextAuth(authConfig);

export default auth((request) => {
  const pathname = request.nextUrl.pathname;
  const role = request.auth?.user?.role;

  // 1. Request logging
  console.info(
    `[Proxy] ${request.method} ${pathname}`,
  );

  // 2. Existing admin route checks
  const isAdminRoute = [
    "/dashboard",
    "/books",
    "/requests",
    "/users",
    "/reports",
    "/settings",
  ].some(
    (route) =>
      pathname === route ||
      pathname.startsWith(`${route}/`),
  );

  // 3. Existing member route checks
  const isMemberRoute =
    pathname === "/my-requests" ||
    pathname.startsWith("/my-requests/") ||
    pathname === "/profile" ||
    pathname.startsWith("/profile/");

  // 4. Existing authentication and authorization
  if (
    (isAdminRoute && role !== "admin") ||
    (isMemberRoute && !role)
  ) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);

    return NextResponse.redirect(loginUrl);
  }

  if (isMemberRoute && role === "admin") {
    return NextResponse.redirect(
      new URL("/dashboard", request.url),
    );
  }

  // 5. Optional geo-routing
  // Enable only if your hosting platform provides
  // a trusted country header.
  const country = request.headers.get("x-vercel-ip-country");

  if (pathname === "/" && country === "US") {
    return NextResponse.redirect(
      new URL("/us", request.url),
    );
  }

  // 6. Locale routing
  // Redirect the root page to the default English locale.
  // Keep this disabled if your app doesn't use /en routes.
  // if (pathname === "/") {
  //   return NextResponse.redirect(
  //     new URL("/en", request.url),
  //   );
  // }

  // 7. A/B testing
  // Assign a stable variant cookie to users who don't
  // already have one. Your page must read the cookie
  // to render the appropriate variant.
  const response = NextResponse.next();

if (!request.cookies.get("experiment")) {
  const variant = Math.random() < 0.5 ? "B" : "A";

  response.cookies.set("experiment", variant, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
  });
}

return response;
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
    "/",
  ],
};
