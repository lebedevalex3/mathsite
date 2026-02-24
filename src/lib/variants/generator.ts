import type { Task } from "@/lib/tasks/schema";
import { getTasksForTopic } from "@/lib/tasks/query";
import { prisma } from "@/src/lib/db/prisma";

import { createSeededRng } from "./rng";
import type { VariantTemplate } from "./types";

type GenerateVariantParams = {
  ownerUserId: string;
  topicId: string;
  template: VariantTemplate;
  seed?: string;
};

function makeSeed() {
  return `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
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

function byTaskId(tasks: Task[]) {
  return new Map(tasks.map((task) => [task.id, task]));
}

export async function generateAndSaveVariant({
  ownerUserId,
  topicId,
  template,
  seed = makeSeed(),
}: GenerateVariantParams) {
  const { tasks, errors } = await getTasksForTopic(topicId);
  if (errors.length > 0) {
    throw new Error(`Task bank errors: ${errors[0]}`);
  }

  const rng = createSeededRng(seed);
  const usedTaskIds = new Set<string>();
  const selected: Array<{ task: Task; sectionLabel: string; orderIndex: number }> = [];
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
      throw new Error(
        `Недостаточно задач для секции "${section.label}": нужно ${section.count}, доступно ${candidates.length}`,
      );
    }

    const picked = sampleWithoutReplacement(candidates, section.count, rng.pickIndex);
    for (const task of picked) {
      usedTaskIds.add(task.id);
      selected.push({ task, sectionLabel: section.label, orderIndex });
      orderIndex += 1;
    }
  }

  const timestamp = new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date());

  const db = prisma as unknown as {
    $transaction: <T>(fn: (tx: unknown) => Promise<T>) => Promise<T>;
  };

  const variant = await db.$transaction(async (tx) => {
    const trx = tx as {
      variant: { create(args: unknown): Promise<{ id: string }> };
      variantTask: { createMany(args: unknown): Promise<unknown> };
    };

    const created = await trx.variant.create({
      data: {
        ownerUserId,
        topicId,
        templateId: template.id,
        title: `${template.title} • ${timestamp}`,
        seed,
      },
    });

    await trx.variantTask.createMany({
      data: selected.map((item) => ({
        variantId: created.id,
        taskId: item.task.id,
        sectionLabel: item.sectionLabel,
        orderIndex: item.orderIndex,
      })),
    });

    return created;
  });

  return { variantId: variant.id, seed };
}

export async function loadVariantContentByTaskIds(topicId: string, taskIds: string[]) {
  const { tasks, errors } = await getTasksForTopic(topicId);
  if (errors.length > 0) {
    throw new Error(`Task bank errors: ${errors[0]}`);
  }
  const taskMap = byTaskId(tasks);
  return taskIds.map((taskId) => {
    const task = taskMap.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found in topic ${topicId}`);
    }
    return task;
  });
}
