import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { badRequest, forbidden, notFound, toApiError, unauthorized } from "@/src/lib/api/errors";
import { writeAuditLog } from "@/src/lib/audit/log";
import { verifyCsrfRequestIfAuthenticated } from "@/src/lib/auth/csrf";
import { isAdminRole } from "@/src/lib/auth/access";
import { getAuthenticatedUserFromCookie } from "@/src/lib/auth/provider";
import { deleteTaskById, updateTaskById } from "@/src/lib/admin/task-bank-admin";
import type { TaskAnswer, TaskStatus } from "@/lib/tasks/schema";

export const runtime = "nodejs";

type RouteProps = {
  params: Promise<{ taskId: string }>;
};

type UpdatePayload = {
  statementMd?: string;
  answer?: TaskAnswer;
  difficulty?: number;
  difficultyBand?: "A" | "B" | "C";
  status?: TaskStatus;
};

function parseUpdatePayload(input: unknown): UpdatePayload | null {
  if (!input || typeof input !== "object") return null;
  const src = input as Record<string, unknown>;
  const statementMd = typeof src.statementMd === "string" ? src.statementMd.trim() : undefined;
  const answer = src.answer as TaskAnswer | undefined;
  const difficulty = typeof src.difficulty === "number" ? src.difficulty : undefined;
  const difficultyBand =
    src.difficultyBand === "A" || src.difficultyBand === "B" || src.difficultyBand === "C"
      ? src.difficultyBand
      : undefined;
  const status =
    src.status === "draft" || src.status === "review" || src.status === "ready"
      ? src.status
      : undefined;

  return {
    statementMd,
    answer,
    difficulty,
    difficultyBand,
    status,
  };
}

async function requireAdmin(request: Request) {
  const cookieStore = await cookies();
  const csrfError = verifyCsrfRequestIfAuthenticated(request, cookieStore);
  if (csrfError) return { error: csrfError, user: null };
  const user = await getAuthenticatedUserFromCookie(cookieStore);
  if (!user) {
    return {
      error: unauthorized("Sign-in required."),
      user: null,
    };
  }
  if (!isAdminRole(user.role)) {
    return {
      error: forbidden("Admin role required."),
      user: null,
    };
  }
  return { error: null, user };
}

export async function PATCH(request: Request, { params }: RouteProps) {
  try {
    const { taskId } = await params;
    const auth = await requireAdmin(request);
    if (auth.error) {
      const { status, body } = auth.error;
      return NextResponse.json(body, { status });
    }

    const payload = parseUpdatePayload(await request.json());
    if (!payload) {
      const { status, body } = badRequest("Invalid payload.");
      return NextResponse.json(body, { status });
    }

    const updated = await updateTaskById({
      taskId,
      ...payload,
    });
    if (!updated) {
      const { status, body } = notFound("Task not found.");
      return NextResponse.json(body, { status });
    }

    await writeAuditLog({
      actorUserId: auth.user.id,
      action: "admin.task.update",
      entityType: "task",
      entityId: updated.id,
      payload: {
        topicId: updated.topic_id,
        skillId: updated.skill_id,
      },
    });

    return NextResponse.json({
      ok: true,
      task: updated,
    });
  } catch (error) {
    const { status, body } = toApiError(error, {
      defaultCode: "ADMIN_TASK_UPDATE_ERROR",
      defaultMessage: "Failed to update task.",
    });
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(request: Request, { params }: RouteProps) {
  try {
    const { taskId } = await params;
    const auth = await requireAdmin(request);
    if (auth.error) {
      const { status, body } = auth.error;
      return NextResponse.json(body, { status });
    }

    const deleted = await deleteTaskById(taskId);
    if (!deleted) {
      const { status, body } = notFound("Task not found.");
      return NextResponse.json(body, { status });
    }

    await writeAuditLog({
      actorUserId: auth.user.id,
      action: "admin.task.delete",
      entityType: "task",
      entityId: taskId,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const { status, body } = toApiError(error, {
      defaultCode: "ADMIN_TASK_DELETE_ERROR",
      defaultMessage: "Failed to delete task.",
    });
    return NextResponse.json(body, { status });
  }
}
