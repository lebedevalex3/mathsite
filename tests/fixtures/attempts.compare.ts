import type { CompareAttemptRow } from "@/src/lib/progress/compare";

function daysAgo(now: Date, days: number) {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

function pushAttempts(
  rows: CompareAttemptRow[],
  params: {
    userId: string;
    topicId: string;
    total: number;
    correct: number;
    createdAt: Date;
  },
) {
  const { userId, topicId, total, correct, createdAt } = params;
  for (let i = 0; i < total; i += 1) {
    rows.push({
      userId,
      topicId,
      isCorrect: i < correct,
      createdAt,
    });
  }
}

export function compareAttemptsFixture(now: Date): CompareAttemptRow[] {
  const rows: CompareAttemptRow[] = [];
  const topicId = "math.proportion";

  // Current user (12 attempts, 9 correct => 75%)
  pushAttempts(rows, {
    userId: "user-a",
    topicId,
    total: 12,
    correct: 9,
    createdAt: daysAgo(now, 5),
  });

  // Cohort users in 30-day window (all >=10)
  pushAttempts(rows, { userId: "user-b", topicId, total: 10, correct: 5, createdAt: daysAgo(now, 2) }); // 50%
  pushAttempts(rows, { userId: "user-c", topicId, total: 14, correct: 8, createdAt: daysAgo(now, 3) }); // 57.14%
  pushAttempts(rows, { userId: "user-d", topicId, total: 16, correct: 11, createdAt: daysAgo(now, 7) }); // 68.75%
  pushAttempts(rows, { userId: "user-e", topicId, total: 12, correct: 9, createdAt: daysAgo(now, 1) }); // 75%
  pushAttempts(rows, { userId: "user-f", topicId, total: 20, correct: 18, createdAt: daysAgo(now, 10) }); // 90%

  // Below threshold in window (should be excluded from cohort)
  pushAttempts(rows, { userId: "user-g", topicId, total: 5, correct: 5, createdAt: daysAgo(now, 4) });

  // Older than 30 days (should be excluded from cohort window)
  pushAttempts(rows, { userId: "user-h", topicId, total: 30, correct: 30, createdAt: daysAgo(now, 40) });

  // Different topic (should be ignored)
  pushAttempts(rows, {
    userId: "user-z",
    topicId: "math.other",
    total: 20,
    correct: 10,
    createdAt: daysAgo(now, 2),
  });

  return rows;
}

export function compareAttemptsCurrentUserBelowThresholdFixture(now: Date): CompareAttemptRow[] {
  const rows: CompareAttemptRow[] = [];
  const topicId = "math.proportion";

  // Current user < 10 attempts
  pushAttempts(rows, {
    userId: "user-a",
    topicId,
    total: 6,
    correct: 3,
    createdAt: daysAgo(now, 2),
  });

  // Valid cohort still exists
  pushAttempts(rows, { userId: "user-b", topicId, total: 10, correct: 8, createdAt: daysAgo(now, 1) });
  pushAttempts(rows, { userId: "user-c", topicId, total: 12, correct: 6, createdAt: daysAgo(now, 1) });

  return rows;
}
