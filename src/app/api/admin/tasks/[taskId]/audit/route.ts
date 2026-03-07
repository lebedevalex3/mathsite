import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { forbidden, toApiError, unauthorized } from "@/src/lib/api/errors";
import {
  buildTaskAuditWhere,
  mapTaskAuditRow,
  matchesTaskAuditDerivedFilters,
  parseTaskAuditQuery,
  type TaskAuditListItem,
} from "@/src/lib/admin/task-audit-feed";
import { isAdminRole } from "@/src/lib/auth/access";
import { getAuthenticatedUserFromCookie } from "@/src/lib/auth/provider";
import { prisma } from "@/src/lib/db/prisma";

export const runtime = "nodejs";

type RouteProps = {
  params: Promise<{ taskId: string }>;
};

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
    const query = parseTaskAuditQuery(searchParams);

    const logs: TaskAuditListItem[] = [];
    let cursor: string | null = query.cursor;
    let exhausted = false;
    const batchSize = Math.min(200, Math.max(query.limit * 3, 60));

    while (logs.length < query.limit && !exhausted) {
      const rows = await prisma.auditLog.findMany({
        where: buildTaskAuditWhere({ taskId, query }),
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: batchSize,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
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

      if (rows.length === 0) {
        exhausted = true;
        break;
      }

      for (const row of rows) {
        cursor = row.id;
        const mapped = mapTaskAuditRow(row);
        if (!matchesTaskAuditDerivedFilters(mapped, query)) continue;
        logs.push(mapped);
        if (logs.length >= query.limit) break;
      }

      if (rows.length < batchSize) {
        exhausted = true;
      }
    }

    const nextCursor = logs.length >= query.limit && !exhausted ? cursor : null;

    return NextResponse.json({
      ok: true,
      taskId,
      logs,
      pageInfo: {
        limit: query.limit,
        nextCursor,
      },
    });
  } catch (error) {
    const { status, body } = toApiError(error, {
      defaultCode: "ADMIN_TASK_AUDIT_LIST_ERROR",
      defaultMessage: "Failed to load task history.",
    });
    return NextResponse.json(body, { status });
  }
}
