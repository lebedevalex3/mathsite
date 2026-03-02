import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { badRequest, toApiError, unauthorized } from "@/src/lib/api/errors";
import { verifyCsrfRequest } from "@/src/lib/auth/csrf";
import { destroyAllAuthSessions, hashPassword, updateUserPassword } from "@/src/lib/auth/provider";
import { consumePasswordResetToken } from "@/src/lib/auth/password-reset";
import { validateResetPasswordInput } from "@/src/lib/auth/validation";
import { writeAuditLog } from "@/src/lib/audit/log";
import { logApiResult, startApiSpan } from "@/src/lib/observability/api";

export const runtime = "nodejs";

type Payload = {
  token?: unknown;
  newPassword?: unknown;
};

export async function POST(request: Request) {
  const span = startApiSpan(request, "/api/auth/reset-password");
  try {
    const cookieStore = await cookies();
    const csrfError = verifyCsrfRequest(request, cookieStore);
    if (csrfError) {
      const { status, body } = csrfError;
      logApiResult(span, status, { code: body.code, message: body.message });
      return NextResponse.json(body, { status });
    }

    const body = (await request.json().catch(() => ({}))) as Payload;
    const input = validateResetPasswordInput(body);
    if (!input.ok) {
      const { status, body: err } = badRequest(input.error.message, input.error.code);
      logApiResult(span, status, { code: err.code, message: err.message });
      return NextResponse.json(err, { status });
    }

    const consumed = await consumePasswordResetToken(input.value.token);
    if (!consumed) {
      await writeAuditLog({
        actorUserId: null,
        action: "auth.password_reset.failure",
        entityType: "auth",
        entityId: "invalid_token",
      });
      const { status, body: err } = unauthorized("Reset token is invalid or expired.", "INVALID_RESET_TOKEN");
      logApiResult(span, status, { code: err.code, message: err.message });
      return NextResponse.json(err, { status });
    }

    const passwordHash = await hashPassword(input.value.newPassword);
    const updated = await updateUserPassword({
      userId: consumed.userId,
      passwordHash,
      mustChangePassword: false,
    });
    await destroyAllAuthSessions({
      userId: consumed.userId,
      cookieStore,
    });
    await writeAuditLog({
      actorUserId: consumed.userId,
      action: "auth.password_reset.success",
      entityType: "user",
      entityId: consumed.userId,
      payload: {
        role: updated.role,
      },
    });

    logApiResult(span, 200, { code: "OK" });
    return NextResponse.json({
      ok: true,
      user: {
        id: updated.id,
        role: updated.role,
        email: updated.email,
        username: updated.username,
      },
    });
  } catch (error) {
    const code =
      error instanceof Error && error.message === "PASSWORD_POLICY_VIOLATION"
        ? "PASSWORD_POLICY_VIOLATION"
        : undefined;
    const message =
      code === "PASSWORD_POLICY_VIOLATION"
        ? "Password must be 8-128 characters."
        : undefined;
    const { status, body } = toApiError(error, {
      defaultCode: code ?? "AUTH_RESET_PASSWORD_ERROR",
      defaultMessage: message ?? "Failed to reset password.",
    });
    logApiResult(span, status, { code: body.code, message: body.message });
    return NextResponse.json(body, { status });
  }
}
