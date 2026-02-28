export const DEFAULT_COMPARE_COHORT_MIN_ATTEMPTS = 10;
export const DEFAULT_COMPARE_WINDOW_DAYS = 30;

export type CompareUserTotals = {
  total: number;
  correct: number;
  accuracy: number;
};

export type CompareAttemptRow = {
  userId: string;
  topicId: string;
  isCorrect: boolean;
  createdAt: Date;
};

export type AggregateCompareInput = {
  topicId: string;
  currentUserId: string;
  attempts: CompareAttemptRow[];
  now?: Date;
  cohortMinAttempts?: number;
  windowDays?: number;
};

export type AggregateCompareResult = {
  currentUser: CompareUserTotals;
  platform: {
    avgAccuracy: number | null;
    medianTotal: number | null;
    usersCount: number;
    cohortMinAttempts: number;
    windowDays: number;
  };
  rank: {
    position: number | null;
    cohortSize: number;
  };
  percentile: number | null;
};

export function compareWindowCutoff(now: Date, windowDays: number) {
  return new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);
}

export function toUserTotals(total: number, correct: number): CompareUserTotals {
  return {
    total,
    correct,
    accuracy: total > 0 ? correct / total : 0,
  };
}

export function median(values: number[]): number | null {
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

export function aggregateCompare({
  topicId,
  currentUserId,
  attempts,
  now = new Date(),
  cohortMinAttempts = DEFAULT_COMPARE_COHORT_MIN_ATTEMPTS,
  windowDays = DEFAULT_COMPARE_WINDOW_DAYS,
}: AggregateCompareInput): AggregateCompareResult {
  const topicAttempts = attempts.filter((row) => row.topicId === topicId);
  const cutoff = compareWindowCutoff(now, windowDays);
  const windowAttempts = topicAttempts.filter((row) => row.createdAt >= cutoff);
  const currentUserAttempts = windowAttempts.filter((row) => row.userId === currentUserId);
  const currentUser = toUserTotals(
    currentUserAttempts.length,
    currentUserAttempts.filter((row) => row.isCorrect).length,
  );

  const totalsByUser = new Map<string, { total: number; correct: number }>();
  for (const row of windowAttempts) {
    const current = totalsByUser.get(row.userId) ?? { total: 0, correct: 0 };
    current.total += 1;
    if (row.isCorrect) current.correct += 1;
    totalsByUser.set(row.userId, current);
  }

  const cohortUsers = [...totalsByUser.entries()]
    .map(([userId, counts]) => ({
      userId,
      ...toUserTotals(counts.total, counts.correct),
    }))
    .filter((row) => row.total >= cohortMinAttempts);

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

  const rankedCohort = [...cohortUsers].sort((left, right) => {
    if (left.accuracy !== right.accuracy) return right.accuracy - left.accuracy;
    if (left.total !== right.total) return right.total - left.total;
    return left.userId.localeCompare(right.userId);
  });
  const rankIndex = rankedCohort.findIndex((row) => row.userId === currentUserId);
  const rankPosition = rankIndex >= 0 ? rankIndex + 1 : null;

  return {
    currentUser,
    platform: {
      avgAccuracy,
      medianTotal,
      usersCount,
      cohortMinAttempts,
      windowDays,
    },
    rank: {
      position: rankPosition,
      cohortSize: usersCount,
    },
    percentile,
  };
}
