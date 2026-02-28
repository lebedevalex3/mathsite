import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/db/prisma";
import { buildMotivationModel, type MotivationScope } from "@/src/lib/motivation/model";
import { logApiResult, startApiSpan } from "@/src/lib/observability/api";
import { aggregateSkillProgress } from "@/src/lib/progress/aggregate";
import {
  aggregateCompare,
  DEFAULT_COMPARE_COHORT_MIN_ATTEMPTS,
  DEFAULT_COMPARE_WINDOW_DAYS,
} from "@/src/lib/progress/compare";
import { getOrCreateVisitorUser } from "@/src/lib/session/visitor";

export const runtime = "nodejs";

function parseScope(value: string | null): MotivationScope {
  if (value === "topic") return "topic";
  return "home";
}

export async function GET(request: Request) {
  const span = startApiSpan(request, "/api/motivation");
  const { searchParams } = new URL(request.url);
  const topicId = searchParams.get("topicId")?.trim();
  const scope = parseScope(searchParams.get("scope"));

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
      skillId: true,
      isCorrect: true,
      createdAt: true,
    },
  });

  const userProgress = aggregateSkillProgress(
    attempts
      .filter((attempt) => attempt.userId === userId)
      .map((attempt) => ({
        skillId: attempt.skillId,
        isCorrect: attempt.isCorrect,
      })),
  );

  const compare = aggregateCompare({
    topicId,
    currentUserId: userId,
    attempts: attempts.map((attempt) => ({
      userId: attempt.userId,
      topicId: attempt.topicId,
      isCorrect: attempt.isCorrect,
      createdAt: attempt.createdAt,
    })),
    cohortMinAttempts: DEFAULT_COMPARE_COHORT_MIN_ATTEMPTS,
    windowDays: DEFAULT_COMPARE_WINDOW_DAYS,
  });

  const motivation = buildMotivationModel({
    progressMap: userProgress,
    rankPercentile: compare.percentile,
    rankPosition: compare.rank.position,
    rankCohortSize: compare.rank.cohortSize,
    scope,
  });

  logApiResult(span, 200, {
    code: "OK",
    meta: {
      topicId,
      scope,
      level: motivation.level,
      badge: motivation.badge.kind,
    },
  });

  return NextResponse.json({
    ok: true,
    topicId,
    scope,
    motivation,
  });
}
