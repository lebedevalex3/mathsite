import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { forbidden, toApiError, unauthorized } from "@/src/lib/api/errors";
import { isAdminRole } from "@/src/lib/auth/access";
import { getAuthenticatedUserFromCookie } from "@/src/lib/auth/provider";
import { normalizeTaskAuditPayload } from "@/src/lib/admin/task-audit";
import { prisma } from "@/src/lib/db/prisma";

export const runtime = "nodejs";

type RouteProps = {
  params: Promise<{ taskId: string }>;
};

function parseLimit(raw: string | null) {
  const value = Number(raw ?? 20);
  if (!Number.isFinite(value)) return 20;
  return Math.min(100, Math.max(1, Math.trunc(value)));
}

export async function GET(request: Request, { params }: RouteProps) {
  try {
    const { taskId } = await params;
    const cookieStore = await cookies();
    const user = await getAuthenticatedUserFromCookie(cookieStore);
    if (!user) {
      const { status, body } = unauthorized("Sign-in required.");
      return NextResponse.json(body, { status });
    }
    if (!isAdminRole(user.role)) {
      const { status, body } = forbidden("Admin role required.");
      return NextResponse.json(body, { status });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseLimit(searchParams.get("limit"));

    const rows = await prisma.auditLog.findMany({
      where: {
        entityType: "task",
        entityId: taskId,
        action: {
          startsWith: "admin.task.",
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        action: true,
        payloadJson: true,
        createdAt: true,
        actorUser: {
          select: {
            id: true,
            role: true,
            email: true,
            username: true,
          },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      taskId,
      logs: rows.map((item) => {
        const payload = normalizeTaskAuditPayload(item.payloadJson);
        return {
          id: item.id,
          action: item.action,
          createdAt: item.createdAt.toISOString(),
          actor: item.actorUser
            ? {
                id: item.actorUser.id,
                role: item.actorUser.role,
                email: item.actorUser.email,
                username: item.actorUser.username,
              }
            : null,
          topicId: payload.topicId,
          skillId: payload.skillId,
          changedFields: payload.changedFields,
          before: payload.before,
          after: payload.after,
        };
      }),
    });
  } catch (error) {
    const { status, body } = toApiError(error, {
      defaultCode: "ADMIN_TASK_AUDIT_LIST_ERROR",
      defaultMessage: "Failed to load task history.",
    });
    return NextResponse.json(body, { status });
  }
}
