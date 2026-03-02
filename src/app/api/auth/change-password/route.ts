import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { badRequest, toApiError, unauthorized } from "@/src/lib/api/errors";
import {
  getAuthenticatedUserFromCookie,
  hashPassword,
  updateUserPassword,
  verifyPassword,
} from "@/src/lib/auth/provider";
import { prisma } from "@/src/lib/db/prisma";
import { writeAuditLog } from "@/src/lib/audit/log";

export const runtime = "nodejs";

type Payload = {
  currentPassword?: unknown;
  newPassword?: unknown;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Payload;
    const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

    if (!currentPassword || !newPassword) {
      const { status, body } = badRequest("currentPassword and newPassword are required");
      return NextResponse.json(body, { status });
    }

    const cookieStore = await cookies();
    const authUser = await getAuthenticatedUserFromCookie(cookieStore);
    if (!authUser) {
      const { status, body } = unauthorized("Sign-in required to change password.");
      return NextResponse.json(body, { status });
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { id: true, passwordHash: true, role: true },
    });

    if (!user || !user.passwordHash) {
      const { status, body } = unauthorized("Password credentials are not configured.");
      return NextResponse.json(body, { status });
    }

    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) {
      const { status, body } = unauthorized("Current password is invalid.");
      return NextResponse.json(body, { status });
    }

    const nextPasswordHash = await hashPassword(newPassword);
    const updated = await updateUserPassword({
      userId: user.id,
      passwordHash: nextPasswordHash,
      mustChangePassword: false,
    });

    await writeAuditLog({
      actorUserId: user.id,
      action: "auth.password.change",
      entityType: "user",
      entityId: user.id,
      payload: {
        role: user.role,
      },
    });

    return NextResponse.json({
      ok: true,
      user: {
        id: updated.id,
        role: updated.role,
        email: updated.email,
        username: updated.username,
        mustChangePassword: updated.mustChangePassword ?? false,
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
      defaultCode: code ?? "AUTH_PASSWORD_CHANGE_ERROR",
      defaultMessage: message ?? "Failed to change password.",
    });
    return NextResponse.json(body, { status });
  }
}
