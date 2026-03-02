import { randomBytes } from "node:crypto";

import { forbidden, type ApiErrorResult } from "@/src/lib/api/errors";

export const CSRF_COOKIE_NAME = "csrf_token";

type CookieStoreLike = {
  get(name: string): { value: string } | undefined;
  set(options: {
    name: string;
    value: string;
    httpOnly?: boolean;
    sameSite?: "lax" | "strict" | "none";
    secure?: boolean;
    path?: string;
    maxAge?: number;
  }): void;
};

function newToken() {
  return randomBytes(32).toString("hex");
}

export function getOrCreateCsrfToken(cookieStore: CookieStoreLike) {
  const existing = cookieStore.get(CSRF_COOKIE_NAME)?.value;
  if (existing) return existing;

  const token = newToken();
  cookieStore.set({
    name: CSRF_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return token;
}

function isSafeMethod(method: string) {
  return method === "GET" || method === "HEAD" || method === "OPTIONS";
}

function originMatchesHost(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export function verifyCsrfRequest(
  request: Request,
  cookieStore: Pick<CookieStoreLike, "get">,
): ApiErrorResult | null {
  if (isSafeMethod(request.method)) return null;
  if (!originMatchesHost(request)) {
    return forbidden("CSRF validation failed (origin mismatch).", "CSRF_INVALID");
  }

  const cookieToken = cookieStore.get(CSRF_COOKIE_NAME)?.value ?? "";
  const headerToken = request.headers.get("x-csrf-token")?.trim() ?? "";
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return forbidden("CSRF validation failed (token mismatch).", "CSRF_INVALID");
  }
  return null;
}
