import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { badRequest, forbidden, toApiError, unauthorized } from "@/src/lib/api/errors";
import { writeAuditLog } from "@/src/lib/audit/log";
import { verifyCsrfRequestIfAuthenticated } from "@/src/lib/auth/csrf";
import { isAdminRole } from "@/src/lib/auth/access";
import { getAuthenticatedUserFromCookie } from "@/src/lib/auth/provider";
import {
  createTaskInTopic,
  filterTasksForAdmin,
  readTaskBankByTopic,
} from "@/src/lib/admin/task-bank-admin";
import type { TaskAnswer } from "@/lib/tasks/schema";

export const runtime = "nodejs";

type CreatePayload = {
  topicId: string;
  skillId: string;
  statementMd: string;
  answer: TaskAnswer;
  difficulty?: number;
  difficultyBand?: "A" | "B" | "C";
};

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parseCreatePayload(input: unknown): CreatePayload | null {
  if (!input || typeof input !== "object") return null;
  const src = input as Record<string, unknown>;
  const topicId = normalizeText(src.topicId);
  const skillId = normalizeText(src.skillId);
  const statementMd = normalizeText(src.statementMd);
  const answer = src.answer as TaskAnswer;
  const difficulty = typeof src.difficulty === "number" ? src.difficulty : undefined;
  const difficultyBand =
    src.difficultyBand === "A" || src.difficultyBand === "B" || src.difficultyBand === "C"
      ? src.difficultyBand
      : undefined;

  if (!topicId || !skillId || !statementMd || !answer) return null;
  return { topicId, skillId, statementMd, answer, difficulty, difficultyBand };
}

export async function GET(request: Request) {
  try {
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
    const topicId = normalizeText(searchParams.get("topicId"));
    const skillId = normalizeText(searchParams.get("skillId"));
    const q = searchParams.get("q") ?? "";
    if (!topicId) {
      const { status, body } = badRequest("topicId is required.");
      return NextResponse.json(body, { status });
    }

    const location = await readTaskBankByTopic(topicId);
    if (!location) {
      return NextResponse.json({ ok: true, tasks: [] });
    }

    const tasks = filterTasksForAdmin(location.bank.tasks, {
      skillId: skillId || undefined,
      q,
    });

    return NextResponse.json({
      ok: true,
      topicId,
      skillId: skillId || null,
      tasks,
      summary: {
        total: tasks.length,
        withoutDifficultyBand: tasks.filter((task) => !task.difficulty_band).length,
      },
    });
  } catch (error) {
    const { status, body } = toApiError(error, {
      defaultCode: "ADMIN_TASKS_LIST_ERROR",
      defaultMessage: "Failed to load tasks.",
    });
    return NextResponse.json(body, { status });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const csrfError = verifyCsrfRequestIfAuthenticated(request, cookieStore);
    if (csrfError) {
      const { status, body } = csrfError;
      return NextResponse.json(body, { status });
    }

    const user = await getAuthenticatedUserFromCookie(cookieStore);
    if (!user) {
      const { status, body } = unauthorized("Sign-in required.");
      return NextResponse.json(body, { status });
    }
    if (!isAdminRole(user.role)) {
      const { status, body } = forbidden("Admin role required.");
      return NextResponse.json(body, { status });
    }

    const payload = parseCreatePayload(await request.json());
    if (!payload) {
      const { status, body } = badRequest("Invalid payload.");
      return NextResponse.json(body, { status });
    }

    const created = await createTaskInTopic(payload);
    await writeAuditLog({
      actorUserId: user.id,
      action: "admin.task.create",
      entityType: "task",
      entityId: created.id,
      payload: {
        topicId: created.topic_id,
        skillId: created.skill_id,
      },
    });

    return NextResponse.json({
      ok: true,
      task: created,
    });
  } catch (error) {
    const { status, body } = toApiError(error, {
      defaultCode: "ADMIN_TASK_CREATE_ERROR",
      defaultMessage: "Failed to create task.",
    });
    return NextResponse.json(body, { status });
  }
}
