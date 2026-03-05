import type { Task } from "@/lib/tasks/schema";

type TaskSnapshot = {
  statement_md: string;
  answer: unknown;
  difficulty: number;
  difficulty_band?: "A" | "B" | "C";
  status?: "draft" | "review" | "ready";
};

export function toTaskAuditSnapshot(task: Task): TaskSnapshot {
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

  const changedFields: string[] = [];
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
