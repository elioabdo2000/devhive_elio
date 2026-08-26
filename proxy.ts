import { auth } from "@/auth";
import { NextResponse } from "next/server";

const protectedRoutes = ["/blogs/new", "/profile/edit", "/communities/new"];
const ownerOnlyPatterns = [/^\/blogs\/[^/]+\/edit$/];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isProtected =
    protectedRoutes.includes(pathname) ||
    ownerOnlyPatterns.some((pattern) => pattern.test(pathname));

  if (isProtected && !req.auth) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/blogs/new", "/blogs/:slug*/edit", "/profile/edit", "/communities/new"],
};
