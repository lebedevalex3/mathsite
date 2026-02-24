import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { requireTeacherFromCookies } from "@/src/lib/variants/auth";
import { generateAndSaveVariant } from "@/src/lib/variants/generator";
import { listVariantsForOwner } from "@/src/lib/variants/repository";
import { getVariantTemplateById } from "@/src/lib/variants/templates";

export const runtime = "nodejs";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const user = await requireTeacherFromCookies(cookieStore);
    const variants = await listVariantsForOwner(user.id);

    return NextResponse.json({
      ok: true,
      variants: variants.map((item: (typeof variants)[number]) => ({
        id: item.id,
        topicId: item.topicId,
        templateId: item.templateId,
        title: item.title,
        seed: item.seed,
        createdAt: item.createdAt.toISOString(),
        tasksCount: item._count.tasks,
      })),
    });
  } catch (error) {
    const status =
      error instanceof Error && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to load variants" },
      { status },
    );
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const payload = body as { templateId?: unknown; topicId?: unknown };
  if (typeof payload.templateId !== "string" || typeof payload.topicId !== "string") {
    return NextResponse.json(
      { ok: false, error: "templateId and topicId are required" },
      { status: 400 },
    );
  }

  try {
    const cookieStore = await cookies();
    const user = await requireTeacherFromCookies(cookieStore);
    const template = await getVariantTemplateById(payload.topicId, payload.templateId);
    if (!template) {
      return NextResponse.json({ ok: false, error: "Template not found" }, { status: 404 });
    }

    const result = await generateAndSaveVariant({
      ownerUserId: user.id,
      topicId: payload.topicId,
      template,
    });

    return NextResponse.json({ ok: true, variantId: result.variantId, seed: result.seed });
  } catch (error) {
    const status =
      error instanceof Error && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to generate variant" },
      { status },
    );
  }
}
