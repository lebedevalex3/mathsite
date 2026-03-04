import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { toApiError } from "@/src/lib/api/errors";
import { verifyCsrfRequestIfAuthenticated } from "@/src/lib/auth/csrf";
import { getCurrentUserWithRole } from "@/src/lib/variants/auth";
import { prisma } from "@/src/lib/db/prisma";
import { writeAuditLog } from "@/src/lib/audit/log";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (process.env.ALLOW_DEV_BECOME_ADMIN !== "1") {
    return NextResponse.json(
      { ok: false, code: "DISABLED", message: "Endpoint disabled in production." },
      { status: 404 },
    );
  }

  try {
    const cookieStore = await cookies();
    const csrfError = verifyCsrfRequestIfAuthenticated(request, cookieStore);
    if (csrfError) {
      const { status, body } = csrfError;
      return NextResponse.json(body, { status });
    }
    const user = await getCurrentUserWithRole(cookieStore);

    if (user.role === "admin") {
      return NextResponse.json({
        ok: true,
        user: {
          id: user.id,
          role: user.role,
          email: user.email,
          username: user.username,
        },
      });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { role: "admin" },
      select: { id: true, role: true, email: true, username: true },
    });

    await writeAuditLog({
      actorUserId: user.id,
      action: "user.role.promote_admin",
      entityType: "user",
      entityId: updated.id,
      payload: { fromRole: user.role, toRole: updated.role, source: "dev_endpoint" },
    });

    return NextResponse.json({ ok: true, user: updated });
  } catch (error) {
    const { status, body } = toApiError(error, {
      defaultMessage: "Failed to update admin role.",
    });
    return NextResponse.json(body, { status });
  }
}
