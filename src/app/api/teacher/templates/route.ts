import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { badRequest, toApiError } from "@/src/lib/api/errors";
import { requireTeacherFromCookies } from "@/src/lib/variants/auth";
import { listVariantTemplates } from "@/src/lib/variants/templates";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const topicId = searchParams.get("topicId")?.trim();
  if (!topicId) {
    const { status, body } = badRequest("Missing topicId");
    return NextResponse.json(body, { status });
  }

  try {
    const cookieStore = await cookies();
    await requireTeacherFromCookies(cookieStore);
    const templates = await listVariantTemplates(topicId);

    return NextResponse.json({
      ok: true,
      topicId,
      templates: templates.map((template) => ({
        id: template.id,
        title: template.title,
        header: template.header,
        sections: template.sections.map((section) => ({
          label: section.label,
          count: section.count,
          difficulty: section.difficulty,
          skillsCount: section.skillIds.length,
        })),
      })),
    });
  } catch (error) {
    const { status, body } = toApiError(error, { defaultMessage: "Failed to load templates." });
    return NextResponse.json(body, { status });
  }
}
