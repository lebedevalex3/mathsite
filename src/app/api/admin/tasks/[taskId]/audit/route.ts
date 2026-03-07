import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { forbidden, toApiError, unauthorized } from "@/src/lib/api/errors";
import {
  collectTaskAuditPage,
  parseTaskAuditQuery,
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

    const { logs, nextCursor } = await collectTaskAuditPage({
      taskId,
      query,
      findMany: (args) => prisma.auditLog.findMany(args),
    });

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
