import {
  DEFAULT_COMPARE_COHORT_MIN_ATTEMPTS,
  DEFAULT_COMPARE_WINDOW_DAYS,
  type CompareAttemptRow,
} from "@/src/lib/progress/compare";

export type LeaderboardEntry = {
  position: number;
  handle: string;
  accuracy: number;
  attempts: number;
  isCurrentUser: boolean;
};

export type AggregateLeaderboardInput = {
  topicId: string;
  currentUserId: string;
  attempts: CompareAttemptRow[];
  limit?: number;
  now?: Date;
  cohortMinAttempts?: number;
  windowDays?: number;
};

export type AggregateLeaderboardResult = {
  entries: LeaderboardEntry[];
  cohortSize: number;
  currentUserPosition: number | null;
  cohortMinAttempts: number;
  windowDays: number;
};

function hashHandle(userId: string) {
  let hash = 2166136261;
  for (let index = 0; index < userId.length; index += 1) {
    hash ^= userId.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0).toString(36).toUpperCase().slice(0, 6).padEnd(6, "X");
}

export function toPublicHandle(userId: string) {
  return `U-${hashHandle(userId)}`;
}

export function aggregateLeaderboard({
  topicId,
  currentUserId,
  attempts,
  limit = 5,
  now = new Date(),
  cohortMinAttempts = DEFAULT_COMPARE_COHORT_MIN_ATTEMPTS,
  windowDays = DEFAULT_COMPARE_WINDOW_DAYS,
}: AggregateLeaderboardInput): AggregateLeaderboardResult {
  const cappedLimit = Math.max(1, Math.min(limit, 20));
  const cutoff = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);

  const topicWindowAttempts = attempts.filter(
    (row) => row.topicId === topicId && row.createdAt >= cutoff,
  );

  const totalsByUser = new Map<string, { total: number; correct: number }>();
  for (const attempt of topicWindowAttempts) {
    const totals = totalsByUser.get(attempt.userId) ?? { total: 0, correct: 0 };
    totals.total += 1;
    if (attempt.isCorrect) totals.correct += 1;
    totalsByUser.set(attempt.userId, totals);
  }

  const rankedUsers = [...totalsByUser.entries()]
    .map(([userId, totals]) => ({
      userId,
      attempts: totals.total,
      accuracy: totals.total > 0 ? totals.correct / totals.total : 0,
    }))
    .filter((entry) => entry.attempts >= cohortMinAttempts)
    .sort((left, right) => {
      if (left.accuracy !== right.accuracy) return right.accuracy - left.accuracy;
      if (left.attempts !== right.attempts) return right.attempts - left.attempts;
      return left.userId.localeCompare(right.userId);
    });

  const currentUserPositionIndex = rankedUsers.findIndex((entry) => entry.userId === currentUserId);

  return {
    entries: rankedUsers.slice(0, cappedLimit).map((entry, index) => ({
      position: index + 1,
      handle: toPublicHandle(entry.userId),
      accuracy: entry.accuracy,
      attempts: entry.attempts,
      isCurrentUser: entry.userId === currentUserId,
    })),
    cohortSize: rankedUsers.length,
    currentUserPosition: currentUserPositionIndex >= 0 ? currentUserPositionIndex + 1 : null,
    cohortMinAttempts,
    windowDays,
  };
}
