import type { Task } from "@/lib/tasks/schema";

import { createSeededRng } from "./rng";
import type { VariantTemplate } from "./types";

export type VariantPlannedTask = {
  task: Task;
  sectionLabel: string;
  orderIndex: number;
};

export type BuildVariantPlanParams = {
  tasks: Task[];
  template: VariantTemplate;
  seed: string;
};

export class InsufficientTasksError extends Error {
  code = "INSUFFICIENT_TASKS" as const;
  details: {
    sectionLabel: string;
    requiredCount: number;
    availableCount: number;
    skillIds: string[];
    difficulty: [number, number];
  };

  constructor(details: InsufficientTasksError["details"]) {
    super(
      `Недостаточно задач для секции "${details.sectionLabel}": нужно ${details.requiredCount}, доступно ${details.availableCount}`,
    );
    this.name = "InsufficientTasksError";
    this.details = details;
  }
}

function sampleWithoutReplacement<T>(
  items: T[],
  count: number,
  pickIndex: (length: number) => number,
): T[] {
  const pool = [...items];
  const result: T[] = [];
  for (let i = 0; i < count; i += 1) {
    const index = pickIndex(pool.length);
    const [picked] = pool.splice(index, 1);
    if (!picked) throw new Error("Failed to pick item from non-empty pool");
    result.push(picked);
  }
  return result;
}

export function buildVariantPlan({
  tasks,
  template,
  seed,
}: BuildVariantPlanParams): VariantPlannedTask[] {
  const rng = createSeededRng(seed);
  const usedTaskIds = new Set<string>();
  const selected: VariantPlannedTask[] = [];
  let orderIndex = 0;

  for (const section of template.sections) {
    const [minDifficulty, maxDifficulty] = section.difficulty;
    const candidates = tasks.filter((task) => {
      return (
        !usedTaskIds.has(task.id) &&
        section.skillIds.includes(task.skill_id) &&
        task.difficulty >= minDifficulty &&
        task.difficulty <= maxDifficulty
      );
    });

    if (candidates.length < section.count) {
      throw new InsufficientTasksError({
        sectionLabel: section.label,
        requiredCount: section.count,
        availableCount: candidates.length,
        skillIds: [...section.skillIds],
        difficulty: section.difficulty,
      });
    }

    const picked = sampleWithoutReplacement(candidates, section.count, rng.pickIndex);
    for (const task of picked) {
      usedTaskIds.add(task.id);
      selected.push({ task, sectionLabel: section.label, orderIndex });
      orderIndex += 1;
    }
  }

  return selected;
}
