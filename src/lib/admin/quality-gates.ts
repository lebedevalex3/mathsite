import { loadTaskBank } from "@/lib/taskbank";
import type { Task } from "@/lib/tasks/schema";

export const SKILL_READY_MIN_TASKS = 6;
export const SKILL_READY_MIN_PER_BAND = 1;

export type SkillReadyCoverage = {
  readyTotal: number;
  readyByBand: {
    A: number;
    B: number;
    C: number;
  };
};

export function buildSkillReadyCoverage(tasks: Task[], skillId: string): SkillReadyCoverage {
  const readyByBand = { A: 0, B: 0, C: 0 };

  for (const task of tasks) {
    if (task.skill_id !== skillId) continue;
    const status = task.status ?? "ready";
    if (status !== "ready") continue;
    const band = task.difficulty_band;
    if (band === "A" || band === "B" || band === "C") {
      readyByBand[band] += 1;
    }
  }

  return {
    readyTotal: readyByBand.A + readyByBand.B + readyByBand.C,
    readyByBand,
  };
}

export function checkSkillReadyGateFromCoverage(coverage: SkillReadyCoverage): {
  ok: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  if (coverage.readyTotal < SKILL_READY_MIN_TASKS) {
    reasons.push(
      `need_at_least_${SKILL_READY_MIN_TASKS}_ready_tasks(found_${coverage.readyTotal})`,
    );
  }
  if (coverage.readyByBand.A < SKILL_READY_MIN_PER_BAND) {
    reasons.push(`need_more_ready_tasks_band_A(found_${coverage.readyByBand.A})`);
  }
  if (coverage.readyByBand.B < SKILL_READY_MIN_PER_BAND) {
    reasons.push(`need_more_ready_tasks_band_B(found_${coverage.readyByBand.B})`);
  }
  if (coverage.readyByBand.C < SKILL_READY_MIN_PER_BAND) {
    reasons.push(`need_more_ready_tasks_band_C(found_${coverage.readyByBand.C})`);
  }
  return {
    ok: reasons.length === 0,
    reasons,
  };
}

export async function checkSkillReadyGate(params: {
  topicId: string;
  skillId: string;
}) {
  const { banks } = await loadTaskBank();
  const topicTasks = banks
    .filter((bank) => bank.bank.topic_id === params.topicId)
    .flatMap((bank) => bank.bank.tasks);
  const coverage = buildSkillReadyCoverage(topicTasks, params.skillId);
  const result = checkSkillReadyGateFromCoverage(coverage);
  return {
    ...result,
    coverage,
  };
}
