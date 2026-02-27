import { NextRequest, NextResponse } from "next/server";

const LOCALES = ["ru", "en", "de"];
const DEFAULT_LOCALE = "ru";

function hasLocale(pathname: string) {
  return LOCALES.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
  );
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // do not rewrite next assets, api routes, and explicit file paths
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return;
  }

  if (hasLocale(pathname)) return;

  const url = req.nextUrl.clone();
  url.pathname = pathname === "/" ? `/${DEFAULT_LOCALE}` : `/${DEFAULT_LOCALE}${pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
