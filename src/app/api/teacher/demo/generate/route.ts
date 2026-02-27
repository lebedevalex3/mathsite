import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { badRequest, toApiError } from "@/src/lib/api/errors";
import { getOrCreateVisitorUser } from "@/src/lib/session/visitor";
import { getTeacherToolsTopicSkills } from "@/src/lib/teacher-tools/catalog";
import {
  buildDemoTemplate,
  DemoRateLimitError,
  enforceDemoRateLimit,
  generateDemoWorkWithVariants,
  validateDemoPlan,
} from "@/src/lib/teacher-tools/demo";
import type { DemoPlanItem } from "@/src/lib/teacher-tools/types";
import { parsePrintLayout } from "@/src/lib/variants/print-layout";
import type { WorkType } from "@/src/lib/variants/print-recommendation";

export const runtime = "nodejs";

type GeneratePayload = {
  topicId?: unknown;
  topics?: unknown;
  variantsCount?: unknown;
  plan?: unknown;
  mode?: unknown;
  seed?: unknown;
  workType?: unknown;
  printLayout?: unknown;
  titleTemplate?: unknown;
};

function parseTitleTemplate(value: unknown) {
  if (!value || typeof value !== "object") return undefined;
  const data = value as { customTitle?: unknown; date?: unknown };
  const customTitle =
    typeof data.customTitle === "string" ? data.customTitle.trim().slice(0, 80) : "";
  const date = typeof data.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(data.date) ? data.date : "";
  return {
    customTitle: customTitle.length > 0 ? customTitle : null,
    date: date.length > 0 ? date : null,
  };
}

export async function POST(request: Request) {
  let body: GeneratePayload;
  try {
    body = (await request.json()) as GeneratePayload;
  } catch {
    const { status, body } = badRequest("Invalid JSON");
    return NextResponse.json(body, { status });
  }

  if (typeof body.topicId !== "string") {
    const { status, body: err } = badRequest("topicId is required");
    return NextResponse.json(err, { status });
  }
  const topicIds = Array.from(
    new Set(
      [
        body.topicId,
        ...(Array.isArray(body.topics) ? body.topics.filter((item): item is string => typeof item === "string") : []),
      ].filter((item): item is string => typeof item === "string" && item.length > 0),
    ),
  );

  const variantsCount = typeof body.variantsCount === "number" ? body.variantsCount : 1;
  const rawPlan = Array.isArray(body.plan) ? (body.plan as DemoPlanItem[]) : [];
  const mode = typeof body.mode === "string" ? body.mode : undefined;
  const workType: WorkType =
    body.workType === "lesson" ||
    body.workType === "quiz" ||
    body.workType === "homework" ||
    body.workType === "test"
      ? body.workType
      : "quiz";
  const printLayout = parsePrintLayout(
    typeof body.printLayout === "string" ? body.printLayout : undefined,
  );
  const titleTemplate = parseTitleTemplate(body.titleTemplate);

  try {
    const cookieStore = await cookies();
    const { userId } = await getOrCreateVisitorUser(cookieStore);
    await enforceDemoRateLimit(userId);

    const topics = await Promise.all(topicIds.map((topicId) => getTeacherToolsTopicSkills(topicId)));
    if (topics.some((topic) => !topic)) {
      const { status, body: err } = badRequest("Unsupported topicId");
      return NextResponse.json(err, { status });
    }
    const resolvedTopics = topics.filter((topic): topic is NonNullable<typeof topic> => Boolean(topic));

    const { normalized, totalPerVariant } = validateDemoPlan(rawPlan, variantsCount);
    const skillsById = new Map(
      resolvedTopics.flatMap((topic) => topic.skills.map((skill) => [skill.id, { title: skill.title }] as const)),
    );

    for (const item of normalized) {
      if (!skillsById.has(item.skillId)) {
        const { status, body: err } = badRequest(`Unknown skillId: ${item.skillId}`);
        return NextResponse.json(err, { status });
      }
    }

    const template = buildDemoTemplate({
      topicId: body.topicId,
      plan: normalized,
      skillsById,
      mode,
    });

    const result = await generateDemoWorkWithVariants({
      ownerUserId: userId,
      topicId: body.topicId,
      topicIds,
      template,
      variantsCount,
      seed: typeof body.seed === "number" ? body.seed : undefined,
      shuffleOrder: typeof (body as { shuffleOrder?: unknown }).shuffleOrder === "boolean"
        ? (body as { shuffleOrder: boolean }).shuffleOrder
        : false,
      mode,
      workType,
      printLayout,
      titleTemplate,
    });

    return NextResponse.json({
      ok: true,
      workId: result.work.id,
      variants: result.variants.map((item) => ({
        id: item.id,
        title: item.title,
        createdAt: item.createdAt.toISOString(),
        tasksCount: item.tasksCount,
      })),
      summary: {
        variantsCount,
        totalTasksPerVariant: totalPerVariant,
      },
    });
  } catch (error) {
    if (error instanceof DemoRateLimitError) {
      return NextResponse.json(
        { ok: false, code: error.code, message: error.message },
        { status: error.status },
      );
    }
    if (error instanceof Error && /variantsCount|plan is required|Select at least one skill|Total tasks per variant/.test(error.message)) {
      const { status, body } = badRequest(error.message);
      return NextResponse.json(body, { status });
    }
    const { status, body } = toApiError(error, {
      defaultMessage: "Failed to generate demo variants.",
    });
    return NextResponse.json(body, { status });
  }
}
