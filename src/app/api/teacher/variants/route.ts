import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { badRequest, notFound, toApiError } from "@/src/lib/api/errors";
import { requireTeacherFromCookies } from "@/src/lib/variants/auth";
import { generateAndSaveVariant } from "@/src/lib/variants/generator";
import { deleteAllVariantsForOwner, listVariantsForOwner } from "@/src/lib/variants/repository";
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
    const { status, body } = toApiError(error, { defaultMessage: "Failed to load variants." });
    return NextResponse.json(body, { status });
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    const { status, body } = badRequest("Invalid JSON");
    return NextResponse.json(body, { status });
  }

  const payload = body as { templateId?: unknown; topicId?: unknown };
  if (typeof payload.templateId !== "string" || typeof payload.topicId !== "string") {
    const { status, body } = badRequest("templateId and topicId are required");
    return NextResponse.json(body, { status });
  }

  try {
    const cookieStore = await cookies();
    const user = await requireTeacherFromCookies(cookieStore);
    const template = await getVariantTemplateById(payload.topicId, payload.templateId);
    if (!template) {
      const { status, body } = notFound("Template not found");
      return NextResponse.json(body, { status });
    }

    const result = await generateAndSaveVariant({
      ownerUserId: user.id,
      topicId: payload.topicId,
      template,
    });

    return NextResponse.json({ ok: true, variantId: result.variantId, seed: result.seed });
  } catch (error) {
    const { status, body } = toApiError(error, { defaultMessage: "Failed to generate variant." });
    return NextResponse.json(body, { status });
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const user = await requireTeacherFromCookies(cookieStore);
    const result = await deleteAllVariantsForOwner(user.id);

    return NextResponse.json({ ok: true, deletedCount: result.count });
  } catch (error) {
    const { status, body } = toApiError(error, { defaultMessage: "Failed to clear variants." });
    return NextResponse.json(body, { status });
  }
}
