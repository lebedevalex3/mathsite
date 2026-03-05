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

type TaskActionFilter = "all" | "create" | "update" | "delete";
type TaskChangedFieldFilter =
  | "all"
  | "statement_md"
  | "answer"
  | "difficulty"
  | "difficulty_band"
  | "status";

function parseLimit(raw: string | null) {
  const value = Number(raw ?? 20);
  if (!Number.isFinite(value)) return 20;
  return Math.min(100, Math.max(1, Math.trunc(value)));
}

function parseActionFilter(raw: string | null): TaskActionFilter {
  if (raw === "create" || raw === "update" || raw === "delete") return raw;
  return "all";
}

function parseChangedFieldFilter(raw: string | null): TaskChangedFieldFilter {
  if (
    raw === "statement_md" ||
    raw === "answer" ||
    raw === "difficulty" ||
    raw === "difficulty_band" ||
    raw === "status"
  ) {
    return raw;
  }
  return "all";
}

function parseDateStart(raw: string | null): Date | null {
  if (!raw) return null;
  const text = raw.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const value = new Date(`${text}T00:00:00.000Z`);
  return Number.isNaN(value.getTime()) ? null : value;
}

function parseDateEnd(raw: string | null): Date | null {
  if (!raw) return null;
  const text = raw.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const value = new Date(`${text}T23:59:59.999Z`);
  return Number.isNaN(value.getTime()) ? null : value;
}

function parseBooleanFlag(raw: string | null) {
  return raw === "1" || raw === "true";
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
    const actionFilter = parseActionFilter(searchParams.get("action"));
    const changedFieldFilter = parseChangedFieldFilter(searchParams.get("changedField"));
    const actorQuery = (searchParams.get("actor") ?? "").trim().toLowerCase();
    const fromDate = parseDateStart(searchParams.get("from"));
    const toDate = parseDateEnd(searchParams.get("to"));
    const statusOnly = parseBooleanFlag(searchParams.get("statusOnly"));
    const readyOnly = parseBooleanFlag(searchParams.get("readyOnly"));

    const rows = await prisma.auditLog.findMany({
      where: {
        entityType: "task",
        entityId: taskId,
        action: {
          startsWith: actionFilter === "all" ? "admin.task." : `admin.task.${actionFilter}`,
        },
      },
      orderBy: { createdAt: "desc" },
      take: Math.max(limit * 5, 120),
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

    const logs = rows
      .map((item) => {
        const payload = normalizeTaskAuditPayload(item.payloadJson);
        const actor = item.actorUser
          ? {
              id: item.actorUser.id,
              role: item.actorUser.role,
              email: item.actorUser.email,
              username: item.actorUser.username,
            }
          : null;
        return {
          id: item.id,
          action: item.action,
          createdAt: item.createdAt.toISOString(),
          actor,
          topicId: payload.topicId,
          skillId: payload.skillId,
          changedFields: payload.changedFields,
          before: payload.before,
          after: payload.after,
        };
      })
      .filter((item) => {
        if (!actorQuery) return true;
        const actorText = [item.actor?.id ?? "", item.actor?.username ?? "", item.actor?.email ?? ""]
          .join(" ")
          .toLowerCase();
        return actorText.includes(actorQuery);
      })
      .filter((item) => {
        if (!fromDate && !toDate) return true;
        const createdAt = new Date(item.createdAt);
        if (fromDate && createdAt < fromDate) return false;
        if (toDate && createdAt > toDate) return false;
        return true;
      })
      .filter((item) => {
        if (!statusOnly) return true;
        return item.changedFields.includes("status");
      })
      .filter((item) => {
        if (changedFieldFilter === "all") return true;
        return item.changedFields.includes(changedFieldFilter);
      })
      .filter((item) => {
        if (!readyOnly) return true;
        return item.after?.status === "ready";
      })
      .slice(0, limit);

    return NextResponse.json({
      ok: true,
      taskId,
      logs,
    });
  } catch (error) {
    const { status, body } = toApiError(error, {
      defaultCode: "ADMIN_TASK_AUDIT_LIST_ERROR",
      defaultMessage: "Failed to load task history.",
    });
    return NextResponse.json(body, { status });
  }
}
