import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/db/prisma";
import { aggregateSkillProgress } from "@/src/lib/progress/aggregate";
import { getOrCreateVisitorUser } from "@/src/lib/session/visitor";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const topicId = searchParams.get("topicId")?.trim();

  if (!topicId) {
    return NextResponse.json(
      { ok: false, error: "Missing topicId" },
      { status: 400 },
    );
  }

  const cookieStore = await cookies();
  const { userId } = await getOrCreateVisitorUser(cookieStore);

  const attempts = await prisma.attempt.findMany({
    where: { userId, topicId },
    select: { skillId: true, isCorrect: true },
  });

  const progress = aggregateSkillProgress(attempts);

  return NextResponse.json({ ok: true, topicId, progress });
}
