import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { badRequest, toApiError, tooManyRequests, unauthorized } from "@/src/lib/api/errors";
import { consumeAuthRateLimit } from "@/src/lib/auth/rate-limit";
import { logApiResult, startApiSpan } from "@/src/lib/observability/api";
import {
  createAuthSession,
  findUserByLogin,
  sanitizeLogin,
  verifyPassword,
} from "@/src/lib/auth/provider";

export const runtime = "nodejs";

type Payload = {
  identifier?: unknown;
  email?: unknown;
  password?: unknown;
};

export async function POST(request: Request) {
  const span = startApiSpan(request, "/api/auth/sign-in");
  try {
    const body = (await request.json().catch(() => ({}))) as Payload;
    const identifier = sanitizeLogin(body.identifier ?? body.email);
    const password = typeof body.password === "string" ? body.password : "";

    if (!identifier || !password) {
      const { status, body } = badRequest("identifier and password are required");
      logApiResult(span, status, { code: body.code, message: body.message });
      return NextResponse.json(body, { status });
    }

    const rateLimit = consumeAuthRateLimit({
      scope: "sign-in",
      headers: request.headers,
      email: identifier,
    });
    if (rateLimit.limited) {
      const { status, body } = tooManyRequests(
        "Too many sign-in attempts. Please try again later.",
      );
      logApiResult(span, status, { code: body.code, message: body.message });
      return NextResponse.json(body, {
        status,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
      });
    }

    const user = await findUserByLogin(identifier);
    if (!user || !user.passwordHash) {
      const { status, body } = unauthorized("Invalid credentials");
      logApiResult(span, status, { code: body.code, message: body.message });
      return NextResponse.json(body, { status });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      const { status, body } = unauthorized("Invalid credentials");
      logApiResult(span, status, { code: body.code, message: body.message });
      return NextResponse.json(body, { status });
    }

    const cookieStore = await cookies();
    await createAuthSession({
      userId: user.id,
      cookieStore,
    });

    logApiResult(span, 200, { code: "OK" });
    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        role: user.role,
        email: user.email,
        username: user.username,
        mustChangePassword: user.mustChangePassword ?? false,
      },
    });
  } catch (error) {
    const { status, body } = toApiError(error, {
      defaultCode: "AUTH_SIGN_IN_ERROR",
      defaultMessage: "Failed to sign in.",
    });
    logApiResult(span, status, { code: body.code, message: body.message });
    return NextResponse.json(body, { status });
  }
}
