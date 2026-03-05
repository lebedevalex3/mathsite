import type { Task } from "@/lib/tasks/schema";

export type TaskAuditSnapshot = {
  statement_md: string;
  answer: unknown;
  difficulty: number;
  difficulty_band?: "A" | "B" | "C";
  status?: "draft" | "review" | "ready";
};

export type TaskAuditField =
  | "statement_md"
  | "answer"
  | "difficulty"
  | "difficulty_band"
  | "status";

const AUDIT_FIELDS: TaskAuditField[] = [
  "statement_md",
  "answer",
  "difficulty",
  "difficulty_band",
  "status",
];

type ParsedTaskAuditPayload = {
  topicId: string | null;
  skillId: string | null;
  before: TaskAuditSnapshot | null;
  after: TaskAuditSnapshot | null;
  changedFields: TaskAuditField[];
};

function isTaskAuditSnapshot(value: unknown): value is TaskAuditSnapshot {
  if (!value || typeof value !== "object") return false;
  const source = value as Record<string, unknown>;
  const hasDifficulty = typeof source.difficulty === "number";
  const hasStatement = typeof source.statement_md === "string";
  const hasAnswer = "answer" in source;
  return hasDifficulty && hasStatement && hasAnswer;
}

function isTaskAuditField(value: string): value is TaskAuditField {
  return AUDIT_FIELDS.includes(value as TaskAuditField);
}

export function normalizeTaskAuditPayload(payload: unknown): ParsedTaskAuditPayload {
  if (!payload || typeof payload !== "object") {
    return {
      topicId: null,
      skillId: null,
      before: null,
      after: null,
      changedFields: [],
    };
  }

  const source = payload as Record<string, unknown>;
  const rawChangedFields = Array.isArray(source.changedFields) ? source.changedFields : [];

  return {
    topicId: typeof source.topicId === "string" ? source.topicId : null,
    skillId: typeof source.skillId === "string" ? source.skillId : null,
    before: isTaskAuditSnapshot(source.before) ? source.before : null,
    after: isTaskAuditSnapshot(source.after) ? source.after : null,
    changedFields: rawChangedFields
      .filter((item): item is string => typeof item === "string")
      .filter(isTaskAuditField),
  };
}

export function toTaskAuditSnapshot(task: Task): TaskAuditSnapshot {
  return {
    statement_md: task.statement_md,
    answer: task.answer,
    difficulty: task.difficulty,
    difficulty_band: task.difficulty_band,
    status: task.status ?? "ready",
  };
}

export function buildTaskUpdateAuditDiff(params: { before: Task; after: Task }) {
  const before = toTaskAuditSnapshot(params.before);
  const after = toTaskAuditSnapshot(params.after);

  const changedFields: TaskAuditField[] = [];
  if (before.statement_md !== after.statement_md) changedFields.push("statement_md");
  if (before.difficulty !== after.difficulty) changedFields.push("difficulty");
  if (before.difficulty_band !== after.difficulty_band) changedFields.push("difficulty_band");
  if (before.status !== after.status) changedFields.push("status");
  if (JSON.stringify(before.answer) !== JSON.stringify(after.answer)) changedFields.push("answer");

  return {
    before,
    after,
    changedFields,
  };
}
