import type { SkillProgressMap } from "@/src/lib/progress/types";

export type MotivationScope = "home" | "topic";

export type MotivationBadgeKind =
  | "attempts"
  | "accuracy"
  | "mastery"
  | "streak"
  | "done";

export type MotivationSummary = {
  totalAttempts: number;
  totalCorrect: number;
  masteredSkills: number;
  accuracy: number;
};

export type MotivationModel = {
  level: number;
  xp: number;
  rankPercentile: number | null;
  rankPosition: number | null;
  rankCohortSize: number;
  summary: MotivationSummary;
  badge: {
    kind: MotivationBadgeKind;
    progress: number;
  };
};

function clamp01(value: number) {
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

function summarize(progressMap: SkillProgressMap): MotivationSummary {
  const entries = Object.values(progressMap);
  const totalAttempts = entries.reduce((sum, entry) => sum + entry.total, 0);
  const totalCorrect = entries.reduce((sum, entry) => sum + entry.correct, 0);
  const masteredSkills = entries.filter((entry) => entry.status === "mastered").length;
  const accuracy = totalAttempts > 0 ? totalCorrect / totalAttempts : 0;

  return {
    totalAttempts,
    totalCorrect,
    masteredSkills,
    accuracy,
  };
}

function resolveBadge(scope: MotivationScope, summary: MotivationSummary) {
  const attemptsTarget = scope === "home" ? 30 : 20;
  const masteryTarget = 3;
  const streakTarget = 30;

  if (summary.totalAttempts < attemptsTarget) {
    return {
      kind: "attempts" as const,
      progress: clamp01(summary.totalAttempts / attemptsTarget),
    };
  }

  if (summary.accuracy < 0.8) {
    return {
      kind: "accuracy" as const,
      progress: clamp01(summary.accuracy / 0.8),
    };
  }

  if (summary.masteredSkills < masteryTarget) {
    return {
      kind: "mastery" as const,
      progress: clamp01(summary.masteredSkills / masteryTarget),
    };
  }

  if (scope === "topic" && summary.totalAttempts < streakTarget) {
    return {
      kind: "streak" as const,
      progress: clamp01(summary.totalAttempts / streakTarget),
    };
  }

  return {
    kind: "done" as const,
    progress: 1,
  };
}

export function buildMotivationModel(params: {
  progressMap: SkillProgressMap;
  rankPercentile: number | null;
  rankPosition: number | null;
  rankCohortSize: number;
  scope: MotivationScope;
}): MotivationModel {
  const summary = summarize(params.progressMap);
  const levelDivisor = params.scope === "home" ? 20 : 15;
  const level = Math.max(1, Math.floor(summary.totalAttempts / levelDivisor) + 1);

  const xp =
    summary.totalCorrect * (params.scope === "home" ? 5 : 4) +
    summary.masteredSkills * (params.scope === "home" ? 50 : 40);

  return {
    level,
    xp,
    rankPercentile: params.rankPercentile,
    rankPosition: params.rankPosition,
    rankCohortSize: params.rankCohortSize,
    summary,
    badge: resolveBadge(params.scope, summary),
  };
}
