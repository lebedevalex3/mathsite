import { promises as fs } from "node:fs";

import { clearTaskBankCache, loadTaskBank } from "@/lib/taskbank";
import {
  taskBankSchema,
  taskSchema,
  type Task,
  type TaskAnswer,
  type TaskBank,
  type TaskStatus,
} from "@/lib/tasks/schema";

export type TaskBankLocation = {
  filePath: string;
  bank: TaskBank;
};

export type TaskQueryFilters = {
  skillId?: string;
  q?: string;
  status?: TaskStatus;
};

function normalizeQuery(raw: string | undefined) {
  return (raw ?? "").trim().toLowerCase();
}

export function buildNextTaskId(skillId: string, existingTaskIds: string[]) {
  const prefix = `${skillId}.`;
  const max = existingTaskIds
    .filter((id) => id.startsWith(prefix))
    .map((id) => Number(id.slice(prefix.length)))
    .filter((value) => Number.isInteger(value) && value >= 0)
    .reduce((acc, value) => Math.max(acc, value), 0);

  return `${prefix}${String(max + 1).padStart(6, "0")}`;
}

export function filterTasksForAdmin(tasks: Task[], filters: TaskQueryFilters) {
  const q = normalizeQuery(filters.q);

  return tasks
    .filter((task) => {
      if (!filters.skillId) return true;
      return task.skill_id === filters.skillId;
    })
    .filter((task) => {
      if (!filters.status) return true;
      return (task.status ?? "ready") === filters.status;
    })
    .filter((task) => {
      if (!q) return true;
      return [task.id, task.skill_id, task.statement_md].join(" ").toLowerCase().includes(q);
    });
}

export async function readTaskBankByTopic(topicId: string): Promise<TaskBankLocation | null> {
  const { banks } = await loadTaskBank();
  const hit = banks.find((item) => item.bank.topic_id === topicId);
  if (!hit) return null;
  return {
    filePath: hit.filePath,
    bank: hit.bank,
  };
}

async function writeTaskBank(filePath: string, bank: TaskBank) {
  await fs.writeFile(filePath, `${JSON.stringify(bank, null, 2)}\n`, "utf8");
  clearTaskBankCache();
}

export async function createTaskInTopic(params: {
  topicId: string;
  skillId: string;
  statementMd: string;
  answer: TaskAnswer;
  difficulty?: number;
  difficultyBand?: "A" | "B" | "C";
  status?: TaskStatus;
}): Promise<Task> {
  const location = await readTaskBankByTopic(params.topicId);
  if (!location) {
    throw new Error(`Task bank not found for topic ${params.topicId}`);
  }

  const nextId = buildNextTaskId(
    params.skillId,
    location.bank.tasks.map((item) => item.id),
  );

  const parsed = taskSchema.safeParse({
    id: nextId,
    topic_id: params.topicId,
    skill_id: params.skillId,
    difficulty: params.difficulty,
    difficulty_band: params.difficultyBand,
    status: params.status ?? "draft",
    statement_md: params.statementMd,
    answer: params.answer,
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((issue) => issue.message).join("; "));
  }

  const nextBank = taskBankSchema.parse({
    ...location.bank,
    tasks: [...location.bank.tasks, parsed.data],
  });
  await writeTaskBank(location.filePath, nextBank);
  return parsed.data;
}

export async function updateTaskById(params: {
  taskId: string;
  statementMd?: string;
  answer?: TaskAnswer;
  difficulty?: number;
  difficultyBand?: "A" | "B" | "C";
  status?: TaskStatus;
}): Promise<Task | null> {
  const { banks } = await loadTaskBank();
  for (const item of banks) {
    const index = item.bank.tasks.findIndex((task) => task.id === params.taskId);
    if (index < 0) continue;

    const existing = item.bank.tasks[index];
    const parsed = taskSchema.safeParse({
      id: existing.id,
      topic_id: existing.topic_id,
      skill_id: existing.skill_id,
      statement_md: params.statementMd ?? existing.statement_md,
      answer: params.answer ?? existing.answer,
      difficulty: params.difficulty ?? existing.difficulty,
      difficulty_band: params.difficultyBand ?? existing.difficulty_band,
      status: params.status ?? existing.status,
    });
    if (!parsed.success) {
      throw new Error(parsed.error.issues.map((issue) => issue.message).join("; "));
    }

    const nextTasks = [...item.bank.tasks];
    nextTasks[index] = parsed.data;
    const nextBank = taskBankSchema.parse({
      ...item.bank,
      tasks: nextTasks,
    });
    await writeTaskBank(item.filePath, nextBank);
    return parsed.data;
  }

  return null;
}

export async function deleteTaskById(taskId: string): Promise<boolean> {
  const { banks } = await loadTaskBank();
  for (const item of banks) {
    const nextTasks = item.bank.tasks.filter((task) => task.id !== taskId);
    if (nextTasks.length === item.bank.tasks.length) continue;
    if (nextTasks.length === 0) {
      throw new Error("Cannot delete the last task in a topic bank.");
    }

    const nextBank = taskBankSchema.parse({
      ...item.bank,
      tasks: nextTasks,
    });
    await writeTaskBank(item.filePath, nextBank);
    return true;
  }
  return false;
}
