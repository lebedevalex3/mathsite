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

type PlannerSlot = {
  slotIndex: number;
  sectionIndex: number;
  sectionLabel: string;
  skillIds: string[];
  difficulty: [number, number];
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

function matchesSlot(task: Task, slot: Pick<PlannerSlot, "skillIds" | "difficulty">) {
  const [minDifficulty, maxDifficulty] = slot.difficulty;
  return (
    slot.skillIds.includes(task.skill_id) &&
    task.difficulty >= minDifficulty &&
    task.difficulty <= maxDifficulty
  );
}

function buildPlannerSlots(template: VariantTemplate): PlannerSlot[] {
  const slots: PlannerSlot[] = [];

  let slotIndex = 0;
  template.sections.forEach((section, sectionIndex) => {
    for (let i = 0; i < section.count; i += 1) {
      slots.push({
        slotIndex,
        sectionIndex,
        sectionLabel: section.label,
        skillIds: [...section.skillIds],
        difficulty: section.difficulty,
      });
      slotIndex += 1;
    }
  });

  return slots;
}

export function buildVariantPlan({
  tasks,
  template,
  seed,
}: BuildVariantPlanParams): VariantPlannedTask[] {
  const rng = createSeededRng(seed);
  const slots = buildPlannerSlots(template);

  // Fast fail for obviously impossible sections before entering backtracking.
  for (const section of template.sections) {
    const candidates = tasks.filter((task) =>
      matchesSlot(task, { skillIds: section.skillIds, difficulty: section.difficulty }),
    );

    if (candidates.length < section.count) {
      throw new InsufficientTasksError({
        sectionLabel: section.label,
        requiredCount: section.count,
        availableCount: candidates.length,
        skillIds: [...section.skillIds],
        difficulty: section.difficulty,
      });
    }
  }

  const assignedBySlot = new Array<Task | null>(slots.length).fill(null);
  const usedTaskIds = new Set<string>();
  let failureDetails: InsufficientTasksError["details"] | null = null;

  function candidatesForSlot(slot: PlannerSlot) {
    return tasks.filter((task) => !usedTaskIds.has(task.id) && matchesSlot(task, slot));
  }

  function setFailure(slot: PlannerSlot, availableCount: number) {
    const section = template.sections[slot.sectionIndex]!;
    failureDetails = {
      sectionLabel: section.label,
      requiredCount: section.count,
      availableCount,
      skillIds: [...section.skillIds],
      difficulty: section.difficulty,
    };
  }

  function solve(): boolean {
    let nextSlot: PlannerSlot | null = null;
    let nextCandidates: Task[] | null = null;

    for (const slot of slots) {
      if (assignedBySlot[slot.slotIndex]) continue;
      const candidates = candidatesForSlot(slot);

      if (candidates.length === 0) {
        setFailure(slot, 0);
        return false;
      }

      if (!nextCandidates || candidates.length < nextCandidates.length) {
        nextSlot = slot;
        nextCandidates = candidates;
      }
    }

    if (!nextSlot || !nextCandidates) {
      return true;
    }

    const orderedCandidates = sampleWithoutReplacement(
      nextCandidates,
      nextCandidates.length,
      rng.pickIndex,
    );

    for (const task of orderedCandidates) {
      assignedBySlot[nextSlot.slotIndex] = task;
      usedTaskIds.add(task.id);

      if (solve()) return true;

      usedTaskIds.delete(task.id);
      assignedBySlot[nextSlot.slotIndex] = null;
    }

    setFailure(nextSlot, nextCandidates.length);
    return false;
  }

  if (!solve()) {
    throw new InsufficientTasksError(
      failureDetails ?? {
        sectionLabel: template.sections[0]?.label ?? "unknown",
        requiredCount: template.sections[0]?.count ?? 1,
        availableCount: 0,
        skillIds: template.sections[0]?.skillIds ?? [],
        difficulty: template.sections[0]?.difficulty ?? [1, 5],
      },
    );
  }

  return slots.map((slot, orderIndex) => {
    const task = assignedBySlot[slot.slotIndex];
    if (!task) {
      throw new Error(`Planner internal error: unassigned slot ${slot.slotIndex}`);
    }
    return { task, sectionLabel: slot.sectionLabel, orderIndex };
  });
}
