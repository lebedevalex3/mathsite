import { NextResponse } from "next/server";

import { badRequest, notFound, toApiError } from "@/src/lib/api/errors";
import { getTeacherToolsTopicSkills } from "@/src/lib/teacher-tools/catalog";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const topicId = new URL(request.url).searchParams.get("topicId");
  if (!topicId) {
    const { status, body } = badRequest("topicId is required");
    return NextResponse.json(body, { status });
  }

  try {
    const topic = await getTeacherToolsTopicSkills(topicId);
    if (!topic) {
      const { status, body } = notFound("Topic not found");
      return NextResponse.json(body, { status });
    }
    return NextResponse.json({ ok: true, topic });
  } catch (error) {
    const { status, body } = toApiError(error, { defaultMessage: "Failed to load topic skills." });
    return NextResponse.json(body, { status });
  }
}
