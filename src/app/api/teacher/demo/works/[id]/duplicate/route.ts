import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getTasksForTopic } from "@/lib/tasks/query";
import { isTeacherRole } from "@/src/lib/auth/access";
import { prisma } from "@/src/lib/db/prisma";
import { badRequest, forbidden, notFound, toApiError, unauthorized } from "@/src/lib/api/errors";
import { getAuthenticatedUserFromCookie } from "@/src/lib/auth/provider";
import { getTeacherToolsTopicSkills } from "@/src/lib/teacher-tools/catalog";
import {
  buildDemoTemplate,
  generateDemoWorkWithVariants,
  parseDemoDifficulty,
  type WorkTitleTemplate,
} from "@/src/lib/teacher-tools/demo";
import { normalizePrintProfile } from "@/src/lib/variants/print-profile";
import type { WorkType } from "@/src/lib/variants/print-recommendation";

export const runtime = "nodejs";

type RouteProps = { params: Promise<{ id: string }> };

function inferTopicIdFromTaskId(taskId: string): string | null {
  const parts = taskId.split(".");
  if (parts.length < 3) return null;
  return `${parts[0]}.${parts[1]}`;
}

function parseWorkType(value: unknown): WorkType {
  return value === "lesson" || value === "quiz" || value === "homework" || value === "test"
    ? value
    : "quiz";
}

function parseTitleTemplate(value: unknown): WorkTitleTemplate | undefined {
  if (!value || typeof value !== "object") return undefined;
  const data = value as { customTitle?: unknown; date?: unknown };
  const customTitle =
    typeof data.customTitle === "string" && data.customTitle.trim().length > 0
      ? data.customTitle.trim().slice(0, 80)
      : null;
  const date =
    typeof data.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(data.date) ? data.date : null;
  return { customTitle, date };
}

export async function POST(request: Request, { params }: RouteProps) {
  try {
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as { locale?: unknown };
    const locale =
      body.locale === "ru" || body.locale === "en" || body.locale === "de"
        ? body.locale
        : "ru";
    const cookieStore = await cookies();
    const user = await getAuthenticatedUserFromCookie(cookieStore);
    if (!user) {
      const { status, body } = unauthorized("Sign-in required to duplicate work.");
      return NextResponse.json(body, { status });
    }
    if (!isTeacherRole(user.role)) {
      const { status, body } = forbidden("Teacher role required to duplicate work.");
      return NextResponse.json(body, { status });
    }
    const userId = user.id;

    const db = prisma as unknown as {
      work: {
        findFirst(args: unknown): Promise<
          | {
              id: string;
              topicId: string;
              workType: string;
              printProfileJson: unknown;
              variants: Array<{
                variant: {
                  tasks: Array<{ taskId: string }>;
                };
              }>;
            }
          | null
        >;
      };
    };

    const work = await db.work.findFirst({
      where: { id, ownerUserId: userId },
      select: {
        id: true,
        topicId: true,
        workType: true,
        printProfileJson: true,
        variants: {
          orderBy: { orderIndex: "asc" },
          take: 1,
          select: {
            variant: {
              select: {
                tasks: {
                  orderBy: { orderIndex: "asc" },
                  select: { taskId: true },
                },
              },
            },
          },
        },
      },
    });

    if (!work) {
      const { status, body } = notFound("Work not found");
      return NextResponse.json(body, { status });
    }

    const firstVariantTasks = work.variants[0]?.variant.tasks ?? [];
    if (firstVariantTasks.length === 0) {
      const { status, body } = badRequest("Work has no tasks to duplicate.");
      return NextResponse.json(body, { status });
    }

    const profile = normalizePrintProfile(work.printProfileJson);
    const rawProfile =
      work.printProfileJson && typeof work.printProfileJson === "object"
        ? (work.printProfileJson as Record<string, unknown>)
        : {};
    const generation =
      rawProfile.generation && typeof rawProfile.generation === "object"
        ? (rawProfile.generation as Record<string, unknown>)
        : {};

    const storedPlan = Array.isArray(generation.plan)
      ? generation.plan
          .map((item) => (item && typeof item === "object" ? (item as Record<string, unknown>) : null))
          .filter((item): item is Record<string, unknown> => Boolean(item))
          .map((item) => {
            const parsedDifficulty = parseDemoDifficulty(item.difficulty);
            return {
              skillId: typeof item.skillId === "string" ? item.skillId : "",
              count: typeof item.count === "number" ? Math.max(0, Math.trunc(item.count)) : 0,
              ...(parsedDifficulty ? { difficulty: parsedDifficulty } : {}),
            };
          })
          .filter((item) => item.skillId.length > 0 && item.count > 0)
      : [];

    const taskIds = firstVariantTasks.map((task) => task.taskId);
    const topicIdsFromTasks = Array.from(
      new Set(taskIds.map(inferTopicIdFromTaskId).filter((value): value is string => Boolean(value))),
    );
    const storedTopicIds = Array.isArray(generation.topicIds)
      ? generation.topicIds.filter((item): item is string => typeof item === "string" && item.length > 0)
      : [];
    const topicIds = Array.from(
      new Set(storedTopicIds.length > 0 ? storedTopicIds : [work.topicId, ...topicIdsFromTasks]),
    );
    const variantsCount =
      typeof generation.variantsCount === "number"
        ? Math.max(1, Math.min(6, Math.trunc(generation.variantsCount)))
        : 1;
    const shuffleOrder = generation.shuffleOrder === true;
    const titleTemplate = parseTitleTemplate(generation.titleTemplate);

    const plan =
      storedPlan.length > 0
        ? storedPlan
      : (() => {
            const counters = new Map<string, { skillId: string; count: number; difficulty?: 1 | 2 | 3 }>();
            const allTasksById = new Map<string, Awaited<ReturnType<typeof getTasksForTopic>>["tasks"][number]>();
            return {
              async load() {
                for (const topicId of topicIds) {
                  const result = await getTasksForTopic(topicId);
                  if (result.errors.length > 0) {
                    throw new Error(`Task bank errors: ${result.errors[0]}`);
                  }
                  for (const task of result.tasks) allTasksById.set(task.id, task);
                }
                for (const taskId of taskIds) {
                  const task = allTasksById.get(taskId);
                  if (!task) continue;
                  const difficulty =
                    Number.isInteger(task.difficulty) && task.difficulty >= 1 && task.difficulty <= 3
                      ? (task.difficulty as 1 | 2 | 3)
                      : undefined;
                  const key = `${task.skill_id}@@${difficulty ?? "any"}`;
                  const existing = counters.get(key);
                  if (existing) {
                    existing.count += 1;
                  } else {
                    counters.set(key, {
                      skillId: task.skill_id,
                      count: 1,
                      ...(difficulty ? { difficulty } : {}),
                    });
                  }
                }
                return Array.from(counters.values());
              },
            };
          })();

    const resolvedPlan = Array.isArray(plan) ? plan : await plan.load();
    if (resolvedPlan.length === 0) {
      const { status, body } = badRequest("Work has no valid generation plan.");
      return NextResponse.json(body, { status });
    }

    const topics = await Promise.all(topicIds.map((topicId) => getTeacherToolsTopicSkills(topicId)));
    const skillsById = new Map(
      topics
        .filter((topic): topic is NonNullable<typeof topic> => Boolean(topic))
        .flatMap((topic) => topic.skills.map((skill) => [skill.id, { title: skill.title }] as const)),
    );

    const template = buildDemoTemplate({
      topicId: topicIds[0] ?? work.topicId,
      plan: resolvedPlan,
      skillsById,
      mode: "custom",
    });

    const result = await generateDemoWorkWithVariants({
      ownerUserId: userId,
      topicId: topicIds[0] ?? work.topicId,
      topicIds,
      locale,
      template,
      variantsCount,
      shuffleOrder,
      mode: "custom",
      workType: parseWorkType(work.workType),
      printLayout: profile.layout,
      titleTemplate,
    });

    return NextResponse.json({
      ok: true,
      workId: result.work.id,
    });
  } catch (error) {
    const { status, body } = toApiError(error, {
      defaultCode: "WORK_DUPLICATE_ERROR",
      defaultMessage: "Failed to duplicate work.",
    });
    return NextResponse.json(body, { status });
  }
}
