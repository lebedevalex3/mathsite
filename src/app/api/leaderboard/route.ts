import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { logApiResult, startApiSpan } from "@/src/lib/observability/api";
import { aggregateLeaderboardFromUserSummaries } from "@/src/lib/progress/leaderboard";
import { compareWindowCutoff, DEFAULT_COMPARE_WINDOW_DAYS } from "@/src/lib/progress/compare";
import { fetchTopicUserTotals } from "@/src/lib/progress/query";
import { getExistingViewerUser } from "@/src/lib/session/visitor";

export const runtime = "nodejs";

function parseLimit(value: string | null) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed)) return 5;
  return Math.max(1, Math.min(parsed, 20));
}

export async function GET(request: Request) {
  const span = startApiSpan(request, "/api/leaderboard");
  const { searchParams } = new URL(request.url);
  const topicId = searchParams.get("topicId")?.trim();
  const limit = parseLimit(searchParams.get("limit"));

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

  const leaderboard = aggregateLeaderboardFromUserSummaries({
    currentUserId: userId,
    rows,
    limit,
  });

  logApiResult(span, 200, {
    code: "OK",
    meta: {
      topicId,
      limit,
      cohortSize: leaderboard.cohortSize,
      currentUserPosition: leaderboard.currentUserPosition,
    },
  });

  return NextResponse.json({
    ok: true,
    topicId,
    leaderboard,
  });
}
