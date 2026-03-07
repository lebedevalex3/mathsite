import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/db/prisma";
import { buildMotivationModel, type MotivationScope } from "@/src/lib/motivation/model";
import { logApiResult, startApiSpan } from "@/src/lib/observability/api";
import { aggregateSkillProgress } from "@/src/lib/progress/aggregate";
import { getMasteryMinAttemptsBySkill } from "@/src/lib/progress/mastery-thresholds";
import {
  aggregateCompareFromUserSummaries,
  compareWindowCutoff,
  DEFAULT_COMPARE_COHORT_MIN_ATTEMPTS,
  DEFAULT_COMPARE_WINDOW_DAYS,
} from "@/src/lib/progress/compare";
import { fetchTopicUserTotals } from "@/src/lib/progress/query";
import { getExistingViewerUser } from "@/src/lib/session/visitor";

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
  const { userId } = await getExistingViewerUser(cookieStore);
  const cutoff = compareWindowCutoff(new Date(), DEFAULT_COMPARE_WINDOW_DAYS);
  const [userAttempts, compareRows] = await Promise.all([
    userId
      ? prisma.attempt.findMany({
          where: { topicId, userId },
          select: {
            skillId: true,
            isCorrect: true,
          },
        })
      : Promise.resolve([]),
    fetchTopicUserTotals({ topicId, cutoff }),
  ]);

  const userProgress = aggregateSkillProgress(userAttempts, {
    masteryMinAttemptsBySkill: getMasteryMinAttemptsBySkill(topicId),
  });

  const compare = aggregateCompareFromUserSummaries({
    currentUserId: userId,
    rows: compareRows,
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
