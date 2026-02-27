import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getTasksForTopic } from "@/lib/tasks/query";
import { prisma } from "@/src/lib/db/prisma";
import { badRequest, notFound, toApiError } from "@/src/lib/api/errors";
import { getOrCreateVisitorUser } from "@/src/lib/session/visitor";
import { getTeacherToolsTopicSkills } from "@/src/lib/teacher-tools/catalog";
import {
  buildDemoTemplate,
  generateDemoWorkWithVariants,
  type WorkTitleTemplate,
  validateDemoPlan,
} from "@/src/lib/teacher-tools/demo";
import { normalizePrintProfile } from "@/src/lib/variants/print-profile";

export const runtime = "nodejs";

type RouteProps = { params: Promise<{ id: string }> };

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function inferTopicIdFromTaskId(taskId: string): string | null {
  const parts = taskId.split(".");
  if (parts.length < 3) return null;
  return `${parts[0]}.${parts[1]}`;
}

function parseWorkType(value: unknown): "lesson" | "quiz" | "homework" | "test" {
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
    const cookieStore = await cookies();
    const { userId } = await getOrCreateVisitorUser(cookieStore);
    const body = (await request.json().catch(() => ({}))) as {
      locale?: unknown;
      variantsCount?: unknown;
      shuffleOrder?: unknown;
    };
    const locale =
      body.locale === "ru" || body.locale === "en" || body.locale === "de"
        ? body.locale
        : "ru";

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
                  tasks: Array<{ taskId: string; orderIndex: number }>;
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
                  select: { taskId: true, orderIndex: true },
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
      const { status, body } = badRequest("Work has no tasks to rebuild.");
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

    const variantsCount = clamp(
      Math.trunc(
        typeof body.variantsCount === "number"
          ? body.variantsCount
          : typeof generation.variantsCount === "number"
            ? generation.variantsCount
            : 2,
      ),
      1,
      6,
    );
    const shuffleOrder =
      typeof body.shuffleOrder === "boolean"
        ? body.shuffleOrder
        : typeof generation.shuffleOrder === "boolean"
          ? generation.shuffleOrder
          : false;
    const titleTemplate = parseTitleTemplate(generation.titleTemplate);

    const taskIds = firstVariantTasks.map((task) => task.taskId);
    const topicIdFromTasks = Array.from(
      new Set(taskIds.map(inferTopicIdFromTaskId).filter((value): value is string => Boolean(value))),
    );
    const storedTopicIds = Array.isArray(generation.topicIds)
      ? generation.topicIds.filter((item): item is string => typeof item === "string" && item.length > 0)
      : [];
    const topicIds = Array.from(
      new Set(storedTopicIds.length > 0 ? storedTopicIds : [work.topicId, ...topicIdFromTasks]),
    );

    const allTasks = [];
    for (const topicId of topicIds) {
      const result = await getTasksForTopic(topicId);
      if (result.errors.length > 0) {
        throw new Error(`Task bank errors: ${result.errors[0]}`);
      }
      allTasks.push(...result.tasks);
    }
    const taskById = new Map(allTasks.map((task) => [task.id, task]));

    const countsBySkillId = new Map<string, number>();
    for (const taskId of taskIds) {
      const task = taskById.get(taskId);
      if (!task) continue;
      const skillId = task.skill_id;
      countsBySkillId.set(skillId, (countsBySkillId.get(skillId) ?? 0) + 1);
    }
    const plan = Array.from(countsBySkillId.entries()).map(([skillId, count]) => ({ skillId, count }));
    const { normalized } = validateDemoPlan(plan, variantsCount);

    const topicConfigs = await Promise.all(topicIds.map((topicId) => getTeacherToolsTopicSkills(topicId)));
    const skillsById = new Map(
      topicConfigs
        .filter((topic): topic is NonNullable<typeof topic> => Boolean(topic))
        .flatMap((topic) => topic.skills.map((skill) => [skill.id, { title: skill.title }] as const)),
    );

    const template = buildDemoTemplate({
      topicId: topicIds[0] ?? work.topicId,
      plan: normalized,
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
      variantsCount,
      shuffleOrder,
    });
  } catch (error) {
    const { status, body } = toApiError(error, {
      defaultCode: "WORK_REBUILD_ERROR",
      defaultMessage: "Failed to rebuild work variants.",
    });
    return NextResponse.json(body, { status });
  }
}
