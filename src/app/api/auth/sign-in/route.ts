import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { badRequest, toApiError, tooManyRequests, unauthorized } from "@/src/lib/api/errors";
import { consumeAuthRateLimit } from "@/src/lib/auth/rate-limit";
import { logApiResult, startApiSpan } from "@/src/lib/observability/api";
import {
  createAuthSession,
  findUserByLogin,
  verifyPassword,
} from "@/src/lib/auth/provider";
import { validateSignInInput } from "@/src/lib/auth/validation";
import { writeAuditLog } from "@/src/lib/audit/log";
import { verifyCsrfRequest } from "@/src/lib/auth/csrf";

export const runtime = "nodejs";

type Payload = {
  identifier?: unknown;
  email?: unknown;
  password?: unknown;
};

export async function POST(request: Request) {
  const span = startApiSpan(request, "/api/auth/sign-in");
  try {
    const cookieStore = await cookies();
    const csrfError = verifyCsrfRequest(request, cookieStore);
    if (csrfError) {
      const { status, body } = csrfError;
      logApiResult(span, status, { code: body.code, message: body.message });
      return NextResponse.json(body, { status });
    }

    const body = (await request.json().catch(() => ({}))) as Payload;
    const input = validateSignInInput(body);
    if (!input.ok) {
      const { status, body } = badRequest(input.error.message, input.error.code);
      logApiResult(span, status, { code: body.code, message: body.message });
      return NextResponse.json(body, { status });
    }
    const { identifier, password } = input.value;

    const rateLimit = await consumeAuthRateLimit({
      scope: "sign-in",
      headers: request.headers,
      identifier,
    });
    if (rateLimit.limited) {
      await writeAuditLog({
        actorUserId: null,
        action: "auth.sign_in.blocked",
        entityType: "auth",
        entityId: identifier,
        payload: {
          reasons: rateLimit.reasons,
        },
      });
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
      await writeAuditLog({
        actorUserId: null,
        action: "auth.sign_in.failure",
        entityType: "auth",
        entityId: identifier,
        payload: {
          reason: "invalid_credentials",
        },
      });
      const { status, body } = unauthorized("Invalid credentials");
      logApiResult(span, status, { code: body.code, message: body.message });
      return NextResponse.json(body, { status });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      await writeAuditLog({
        actorUserId: user.id,
        action: "auth.sign_in.failure",
        entityType: "user",
        entityId: user.id,
        payload: {
          reason: "invalid_credentials",
        },
      });
      const { status, body } = unauthorized("Invalid credentials");
      logApiResult(span, status, { code: body.code, message: body.message });
      return NextResponse.json(body, { status });
    }

    await createAuthSession({
      userId: user.id,
      cookieStore,
    });
    await writeAuditLog({
      actorUserId: user.id,
      action: "auth.sign_in.success",
      entityType: "user",
      entityId: user.id,
      payload: {
        role: user.role,
      },
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
