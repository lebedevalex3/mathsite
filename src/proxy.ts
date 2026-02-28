import { NextRequest, NextResponse } from "next/server";

const LOCALES = ["ru", "en", "de"] as const;
const DEFAULT_LOCALE = "ru";
const LOCALE_HEADER = "x-mathsite-locale";
type Locale = (typeof LOCALES)[number];

function resolveLocale(pathname: string): Locale | null {
  for (const locale of LOCALES) {
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
      return locale;
    }
  }
  return null;
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

  const locale = resolveLocale(pathname);
  if (!locale) {
    const url = req.nextUrl.clone();
    url.pathname = pathname === "/" ? `/${DEFAULT_LOCALE}` : `/${DEFAULT_LOCALE}${pathname}`;
    return NextResponse.redirect(url);
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set(LOCALE_HEADER, locale);
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
