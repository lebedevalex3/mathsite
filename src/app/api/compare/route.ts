import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/db/prisma";
import { getOrCreateVisitorUser } from "@/src/lib/session/visitor";

export const runtime = "nodejs";

const COHORT_MIN_ATTEMPTS = 10;
const WINDOW_DAYS = 30;

type UserTotals = {
  total: number;
  correct: number;
  accuracy: number;
};

function median(values: number[]): number | null {
  if (values.length === 0) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 1) {
    return sorted[middle] ?? null;
  }

  const left = sorted[middle - 1];
  const right = sorted[middle];
  if (left === undefined || right === undefined) return null;

  return (left + right) / 2;
}

function toUserTotals(total: number, correct: number): UserTotals {
  return {
    total,
    correct,
    accuracy: total > 0 ? correct / total : 0,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const topicId = searchParams.get("topicId")?.trim();

  if (!topicId) {
    return NextResponse.json({ ok: false, error: "Missing topicId" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const { userId } = await getOrCreateVisitorUser(cookieStore);

  const [currentTotal, currentCorrect] = await Promise.all([
    prisma.attempt.count({
      where: { userId, topicId },
    }),
    prisma.attempt.count({
      where: { userId, topicId, isCorrect: true },
    }),
  ]);

  const currentUser = toUserTotals(currentTotal, currentCorrect);

  const cutoff = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const [totalsByUser, correctByUser] = await Promise.all([
    prisma.attempt.groupBy({
      by: ["userId"],
      where: {
        topicId,
        createdAt: { gte: cutoff },
      },
      _count: {
        _all: true,
      },
    }),
    prisma.attempt.groupBy({
      by: ["userId"],
      where: {
        topicId,
        isCorrect: true,
        createdAt: { gte: cutoff },
      },
      _count: {
        _all: true,
      },
    }),
  ]);

  const correctMap = new Map<string, number>();
  for (const row of correctByUser) {
    correctMap.set(row.userId, row._count._all);
  }

  const cohortUsers = totalsByUser
    .map((row) => {
      const total = row._count._all;
      const correct = correctMap.get(row.userId) ?? 0;
      return {
        userId: row.userId,
        ...toUserTotals(total, correct),
      };
    })
    .filter((row) => row.total >= COHORT_MIN_ATTEMPTS);

  const usersCount = cohortUsers.length;
  const avgAccuracy =
    usersCount > 0
      ? cohortUsers.reduce((sum, row) => sum + row.accuracy, 0) / usersCount
      : null;
  const medianTotal = median(cohortUsers.map((row) => row.total));

  const percentile =
    usersCount > 0
      ? (cohortUsers.filter((row) => row.accuracy < currentUser.accuracy).length / usersCount) *
        100
      : null;

  return NextResponse.json({
    ok: true,
    topicId,
    currentUser,
    platform: {
      avgAccuracy,
      medianTotal,
      usersCount,
      cohortMinAttempts: COHORT_MIN_ATTEMPTS,
      windowDays: WINDOW_DAYS,
    },
    percentile,
  });
}
