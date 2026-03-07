import { promises as fs } from "node:fs";
import path from "node:path";

import { clearTaskBankCache, loadTaskBank } from "@/lib/taskbank";
import { listTeacherToolsTopics } from "@/src/lib/teacher-tools/catalog";
import {
  taskBankSchema,
  taskSchema,
  type Task,
  type TaskAnswer,
  type TaskBank,
  type TaskStatus,
} from "@/lib/tasks/schema";
import { assertValidTaskBankState } from "@/src/lib/admin/task-bank-validation";

export type TaskBankLocation = {
  filePath: string;
  bank: TaskBank;
};

export type TaskQueryFilters = {
  skillId?: string;
  q?: string;
  status?: TaskStatus;
};

export class InvalidSkillIdError extends Error {
  code = "INVALID_SKILL_ID" as const;
  details: {
    topicId: string;
    skillId: string;
  };

  constructor(params: { topicId: string; skillId: string }) {
    super(`Skill ${params.skillId} is not registered for topic ${params.topicId}`);
    this.details = params;
  }
}

const writeQueue = new Map<string, Promise<void>>();

function normalizeQuery(raw: string | undefined) {
  return (raw ?? "").trim().toLowerCase();
}

export function isRegisteredSkillForTopic(topicId: string, skillId: string) {
  const topic = listTeacherToolsTopics().find((item) => item.topicId === topicId);
  if (!topic) return false;
  return topic.skills.some((skill) => skill.id === skillId);
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
  const tempFilePath = path.join(
    path.dirname(filePath),
    `.${path.basename(filePath)}.${process.pid}.${Date.now()}.tmp`,
  );
  await fs.writeFile(tempFilePath, `${JSON.stringify(bank, null, 2)}\n`, "utf8");
  await fs.rename(tempFilePath, filePath);
  clearTaskBankCache();
}

async function withTaskBankFileLock<T>(filePath: string, fn: () => Promise<T>): Promise<T> {
  const previous = writeQueue.get(filePath) ?? Promise.resolve();

  let release!: () => void;
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });
  writeQueue.set(filePath, previous.then(() => current));

  await previous;
  try {
    return await fn();
  } finally {
    release();
    if (writeQueue.get(filePath) === current) {
      writeQueue.delete(filePath);
    }
  }
}

async function mutateTaskBank(params: {
  locate: (banks: Awaited<ReturnType<typeof loadTaskBank>>["banks"]) => {
    filePath: string;
    nextBank: TaskBank;
    result: Task | boolean;
  } | null;
}) {
  const initial = await loadTaskBank();
  const located = params.locate(initial.banks);
  if (!located) return null;

  return withTaskBankFileLock(located.filePath, async () => {
    const latest = await loadTaskBank();
    const freshLocated = params.locate(latest.banks);
    if (!freshLocated) return null;

    const nextBanks = latest.banks.map((bank) =>
      bank.filePath === freshLocated.filePath
        ? { ...bank, bank: freshLocated.nextBank }
        : bank,
    );

    await assertValidTaskBankState({
      banks: nextBanks,
      loadErrors: latest.errors,
    });

    await writeTaskBank(freshLocated.filePath, freshLocated.nextBank);
    return freshLocated.result;
  });
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
  if (!isRegisteredSkillForTopic(params.topicId, params.skillId)) {
    throw new InvalidSkillIdError({
      topicId: params.topicId,
      skillId: params.skillId,
    });
  }

  const created = await mutateTaskBank({
    locate(banks) {
      const location = banks.find((item) => item.bank.topic_id === params.topicId);
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

      return {
        filePath: location.filePath,
        nextBank,
        result: parsed.data,
      };
    },
  });

  if (!created || typeof created === "boolean") {
    throw new Error(`Task bank not found for topic ${params.topicId}`);
  }
  return created;
}

export async function updateTaskById(params: {
  taskId: string;
  statementMd?: string;
  answer?: TaskAnswer;
  difficulty?: number;
  difficultyBand?: "A" | "B" | "C";
  status?: TaskStatus;
}): Promise<Task | null> {
  const updated = await mutateTaskBank({
    locate(banks) {
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

        return {
          filePath: item.filePath,
          nextBank,
          result: parsed.data,
        };
      }

      return null;
    },
  });

  if (!updated || typeof updated === "boolean") return null;
  return updated;
}

export async function readTaskById(taskId: string): Promise<Task | null> {
  const { banks } = await loadTaskBank();
  for (const item of banks) {
    const hit = item.bank.tasks.find((task) => task.id === taskId);
    if (hit) return hit;
  }
  return null;
}

export async function deleteTaskById(taskId: string): Promise<boolean> {
  const deleted = await mutateTaskBank({
    locate(banks) {
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

        return {
          filePath: item.filePath,
          nextBank,
          result: true,
        };
      }

      return null;
    },
  });

  return deleted === true;
}
