import type { SkillProgressEntry, SkillProgressMap } from "@/src/lib/progress/types";

type AttemptRow = {
  skillId: string;
  isCorrect: boolean;
};

const DEFAULT_MASTERY_MIN_ATTEMPTS = 10;
const MASTERY_MIN_ACCURACY = 0.8;

type AggregateSkillProgressOptions = {
  masteryMinAttemptsBySkill?: Record<string, number>;
};

function resolveMasteryMinAttempts(
  skillId: string,
  options: AggregateSkillProgressOptions | undefined,
) {
  const raw = options?.masteryMinAttemptsBySkill?.[skillId];
  if (Number.isFinite(raw) && raw != null && raw > 0) {
    return Math.trunc(raw);
  }
  return DEFAULT_MASTERY_MIN_ATTEMPTS;
}

function toEntry(
  skillId: string,
  total: number,
  correct: number,
  options: AggregateSkillProgressOptions | undefined,
): SkillProgressEntry {
  const accuracy = total > 0 ? correct / total : 0;
  const masteryMinAttempts = resolveMasteryMinAttempts(skillId, options);

  let status: SkillProgressEntry["status"] = "not_started";
  if (total > 0) {
    status =
      total >= masteryMinAttempts && accuracy >= MASTERY_MIN_ACCURACY
        ? "mastered"
        : "in_progress";
  }

  return { total, correct, accuracy, status };
}

export function aggregateSkillProgress(
  rows: AttemptRow[],
  options?: AggregateSkillProgressOptions,
): SkillProgressMap {
  const counters = new Map<string, { total: number; correct: number }>();

  for (const row of rows) {
    const current = counters.get(row.skillId) ?? { total: 0, correct: 0 };
    current.total += 1;
    if (row.isCorrect) current.correct += 1;
    counters.set(row.skillId, current);
  }

  const result: SkillProgressMap = {};
  for (const [skillId, counts] of counters) {
    result[skillId] = toEntry(skillId, counts.total, counts.correct, options);
  }

  return result;
}
