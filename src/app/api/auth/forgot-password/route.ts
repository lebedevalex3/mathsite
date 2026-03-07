import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { badRequest, toApiError, tooManyRequests } from "@/src/lib/api/errors";
import { verifyCsrfRequest } from "@/src/lib/auth/csrf";
import { findUserByEmail } from "@/src/lib/auth/provider";
import { consumeAuthRateLimit } from "@/src/lib/auth/rate-limit";
import { validateForgotPasswordInput } from "@/src/lib/auth/validation";
import { buildPasswordResetUrl, issuePasswordResetToken } from "@/src/lib/auth/password-reset";
import { writeAuditLog } from "@/src/lib/audit/log";
import { logApiResult, startApiSpan } from "@/src/lib/observability/api";

export const runtime = "nodejs";

type Payload = {
  email?: unknown;
  locale?: unknown;
};

function parseLocale(value: unknown): "ru" | "en" | "de" {
  if (value === "en" || value === "de") return value;
  return "ru";
}

function shouldExposeDevResetUrl() {
  if (process.env.AUTH_PASSWORD_RESET_RETURN_LINK === "1") return true;
  return process.env.NODE_ENV !== "production";
}

export async function POST(request: Request) {
  const span = startApiSpan(request, "/api/auth/forgot-password");
  try {
    const cookieStore = await cookies();
    const csrfError = verifyCsrfRequest(request, cookieStore);
    if (csrfError) {
      const { status, body } = csrfError;
      logApiResult(span, status, { code: body.code, message: body.message });
      return NextResponse.json(body, { status });
    }

    const body = (await request.json().catch(() => ({}))) as Payload;
    const input = validateForgotPasswordInput(body);
    if (!input.ok) {
      const { status, body: err } = badRequest(input.error.message, input.error.code);
      logApiResult(span, status, { code: err.code, message: err.message });
      return NextResponse.json(err, { status });
    }
    const { email } = input.value;
    const locale = parseLocale(body.locale);

    const rateLimit = await consumeAuthRateLimit({
      scope: "forgot-password",
      headers: request.headers,
      identifier: email,
    });
    if (rateLimit.limited) {
      await writeAuditLog({
        actorUserId: null,
        action: "auth.password_reset.blocked",
        entityType: "auth",
        entityId: email,
        payload: {
          reasons: rateLimit.reasons,
        },
      });
      const { status, body: err } = tooManyRequests(
        "Too many password reset attempts. Please try again later.",
      );
      logApiResult(span, status, { code: err.code, message: err.message });
      return NextResponse.json(err, {
        status,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
      });
    }

    const user = await findUserByEmail(email);
    let resetUrl: string | null = null;
    if (user) {
      const issued = await issuePasswordResetToken({ userId: user.id });
      resetUrl = buildPasswordResetUrl(issued.rawToken, locale);
      await writeAuditLog({
        actorUserId: null,
        action: "auth.password_reset.requested",
        entityType: "user",
        entityId: user.id,
        payload: {
          email,
        },
      });
    } else {
      await writeAuditLog({
        actorUserId: null,
        action: "auth.password_reset.requested_unknown",
        entityType: "auth",
        entityId: email,
      });
    }

    logApiResult(span, 200, { code: "OK" });
    return NextResponse.json({
      ok: true,
      message: "If account exists, reset instructions have been sent.",
      ...(shouldExposeDevResetUrl() && resetUrl ? { resetUrl } : {}),
    });
  } catch (error) {
    const { status, body } = toApiError(error, {
      defaultCode: "AUTH_FORGOT_PASSWORD_ERROR",
      defaultMessage: "Failed to process forgot-password request.",
    });
    logApiResult(span, status, { code: body.code, message: body.message });
    return NextResponse.json(body, { status });
  }
}
