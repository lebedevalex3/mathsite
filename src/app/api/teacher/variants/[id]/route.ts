import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { notFound, toApiError } from "@/src/lib/api/errors";
import { requireTeacherFromCookies } from "@/src/lib/variants/auth";
import { getVariantDetailForOwner } from "@/src/lib/variants/repository";

export const runtime = "nodejs";

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteProps) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const user = await requireTeacherFromCookies(cookieStore);
    const detail = await getVariantDetailForOwner(id, user.id);

    if (!detail) {
      const { status, body } = notFound("Variant not found");
      return NextResponse.json(body, { status });
    }

    const groups = new Map<
      string,
      Array<{
        taskId: string;
        orderIndex: number;
        statementMd: string;
        difficulty: number;
        answer: number;
      }>
    >();

    for (const item of detail.tasks) {
      const arr = groups.get(item.sectionLabel) ?? [];
      arr.push({
        taskId: item.taskId,
        orderIndex: item.orderIndex,
        statementMd: item.task.statement_md,
        difficulty: item.task.difficulty,
        answer: item.task.answer.value,
      });
      groups.set(item.sectionLabel, arr);
    }

    return NextResponse.json({
      ok: true,
      variant: {
        id: detail.id,
        title: detail.title,
        topicId: detail.topicId,
        templateId: detail.templateId,
        seed: detail.seed,
        createdAt: detail.createdAt.toISOString(),
        sections: [...groups.entries()].map(([label, tasks]) => ({ label, tasks })),
      },
    });
  } catch (error) {
    const { status, body } = toApiError(error, { defaultMessage: "Failed to load variant." });
    return NextResponse.json(body, { status });
  }
}
