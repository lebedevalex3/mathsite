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
  variantsCount?: unknown;
  plan?: unknown;
  mode?: unknown;
  seed?: unknown;
  workType?: unknown;
  printLayout?: unknown;
};

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

  try {
    const cookieStore = await cookies();
    const { userId } = await getOrCreateVisitorUser(cookieStore);
    await enforceDemoRateLimit(userId);

    const topic = await getTeacherToolsTopicSkills(body.topicId);
    if (!topic) {
      const { status, body: err } = badRequest("Unsupported topicId");
      return NextResponse.json(err, { status });
    }

    const { normalized, totalPerVariant } = validateDemoPlan(rawPlan, variantsCount);
    const skillsById = new Map(topic.skills.map((skill) => [skill.id, { title: skill.title }]));

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
      template,
      variantsCount,
      seed: typeof body.seed === "number" ? body.seed : undefined,
      shuffleOrder: typeof (body as { shuffleOrder?: unknown }).shuffleOrder === "boolean"
        ? (body as { shuffleOrder: boolean }).shuffleOrder
        : false,
      mode,
      workType,
      printLayout,
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
