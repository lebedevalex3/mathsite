import { z } from "zod";

export const TOPIC_ID = "g5.proporcii" as const;

const topicIdSchema = z.literal(TOPIC_ID);
const skillIdSchema = z
  .string()
  .regex(/^g5\.proporcii\.[a-z][a-z0-9_]*$/, "Invalid skill_id format");
const taskIdSchema = z
  .string()
  .regex(
    /^g5\.proporcii\.[a-z][a-z0-9_]*\.\d{6}$/,
    "Invalid task_id format (expected g5.proporcii.<skill>.000001)",
  );

export const numberAnswerSchema = z.object({
  type: z.literal("number"),
  value: z.number().finite(),
});

export const taskSchema = z
  .object({
    id: taskIdSchema,
    topic_id: topicIdSchema,
    skill_id: skillIdSchema,
    difficulty: z.number().int().min(1).max(5),
    statement_md: z.string().trim().min(1),
    answer: numberAnswerSchema,
  })
  .superRefine((task, ctx) => {
    if (!task.skill_id.startsWith(`${task.topic_id}.`)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["skill_id"],
        message: "skill_id must belong to task.topic_id",
      });
    }

    if (!task.id.startsWith(`${task.skill_id}.`)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["id"],
        message: "task.id prefix must match task.skill_id",
      });
    }
  });

export const taskBankSchema = z.object({
  schema_version: z.literal(1),
  topic_id: topicIdSchema,
  title: z.string().trim().min(1),
  tasks: z.array(taskSchema).min(1),
});

export type NumberAnswer = z.infer<typeof numberAnswerSchema>;
export type Task = z.infer<typeof taskSchema>;
export type TaskBank = z.infer<typeof taskBankSchema>;
