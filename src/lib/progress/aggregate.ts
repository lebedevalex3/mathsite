import type { SkillProgressEntry, SkillProgressMap } from "@/src/lib/progress/types";

type AttemptRow = {
  skillId: string;
  isCorrect: boolean;
};

function toEntry(total: number, correct: number): SkillProgressEntry {
  const accuracy = total > 0 ? correct / total : 0;

  let status: SkillProgressEntry["status"] = "not_started";
  if (total > 0) {
    status = total >= 10 && accuracy >= 0.8 ? "mastered" : "in_progress";
  }

  return { total, correct, accuracy, status };
}

export function aggregateSkillProgress(rows: AttemptRow[]): SkillProgressMap {
  const counters = new Map<string, { total: number; correct: number }>();

  for (const row of rows) {
    const current = counters.get(row.skillId) ?? { total: 0, correct: 0 };
    current.total += 1;
    if (row.isCorrect) current.correct += 1;
    counters.set(row.skillId, current);
  }

  const result: SkillProgressMap = {};
  for (const [skillId, counts] of counters) {
    result[skillId] = toEntry(counts.total, counts.correct);
  }

  return result;
}
