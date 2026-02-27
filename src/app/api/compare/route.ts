import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/db/prisma";
import { logApiResult, startApiSpan } from "@/src/lib/observability/api";
import {
  aggregateCompare,
  DEFAULT_COMPARE_COHORT_MIN_ATTEMPTS,
  DEFAULT_COMPARE_WINDOW_DAYS,
} from "@/src/lib/progress/compare";
import { getOrCreateVisitorUser } from "@/src/lib/session/visitor";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const span = startApiSpan(request, "/api/compare");
  const { searchParams } = new URL(request.url);
  const topicId = searchParams.get("topicId")?.trim();

  if (!topicId) {
    logApiResult(span, 400, { code: "BAD_REQUEST", message: "Missing topicId" });
    return NextResponse.json({ ok: false, error: "Missing topicId" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const { userId } = await getOrCreateVisitorUser(cookieStore);

  const attempts = await prisma.attempt.findMany({
    where: { topicId },
    select: {
      userId: true,
      topicId: true,
      isCorrect: true,
      createdAt: true,
    },
  });

  const compare = aggregateCompare({
    topicId,
    currentUserId: userId,
    attempts,
    cohortMinAttempts: DEFAULT_COMPARE_COHORT_MIN_ATTEMPTS,
    windowDays: DEFAULT_COMPARE_WINDOW_DAYS,
  });

  logApiResult(span, 200, {
    code: "OK",
    meta: { topicId, percentile: compare.percentile },
  });
  return NextResponse.json({
    ok: true,
    topicId,
    currentUser: compare.currentUser,
    platform: compare.platform,
    percentile: compare.percentile,
  });
}
