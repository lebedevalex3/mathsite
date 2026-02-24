import { cookies } from "next/headers";
import { NextResponse } from "next/server";

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
      return NextResponse.json({ ok: false, error: "Variant not found" }, { status: 404 });
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
    const status =
      error instanceof Error && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to load variant" },
      { status },
    );
  }
}
