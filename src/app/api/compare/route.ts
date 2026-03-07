import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { logApiResult, startApiSpan } from "@/src/lib/observability/api";
import {
  aggregateCompareFromUserSummaries,
  compareWindowCutoff,
  DEFAULT_COMPARE_COHORT_MIN_ATTEMPTS,
  DEFAULT_COMPARE_WINDOW_DAYS,
} from "@/src/lib/progress/compare";
import { fetchTopicUserTotals } from "@/src/lib/progress/query";
import { getExistingViewerUser } from "@/src/lib/session/visitor";

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
  const { userId } = await getExistingViewerUser(cookieStore);
  const cutoff = compareWindowCutoff(new Date(), DEFAULT_COMPARE_WINDOW_DAYS);

  const rows = await fetchTopicUserTotals({
    topicId,
    cutoff,
  });

  const compare = aggregateCompareFromUserSummaries({
    currentUserId: userId,
    rows,
    cohortMinAttempts: DEFAULT_COMPARE_COHORT_MIN_ATTEMPTS,
    windowDays: DEFAULT_COMPARE_WINDOW_DAYS,
  });

  logApiResult(span, 200, {
    code: "OK",
    meta: { topicId, percentile: compare.percentile, rankPosition: compare.rank.position },
  });
  return NextResponse.json({
    ok: true,
    topicId,
    currentUser: compare.currentUser,
    platform: compare.platform,
    rank: compare.rank,
    percentile: compare.percentile,
  });
}
