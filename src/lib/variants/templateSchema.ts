import { z } from "zod";

import type { VariantTemplate } from "./types";

const sectionSchema = z
  .object({
    label: z.string().trim().min(1),
    skillIds: z.array(z.string().trim().min(1)).min(1),
    count: z.number().int().positive(),
    difficulty: z
      .tuple([z.number().int().min(1).max(5), z.number().int().min(1).max(5)])
      .refine(([min, max]) => min <= max, {
        message: "difficulty[0] must be <= difficulty[1]",
      }),
  })
  .strict();

export const TemplateSchema = z
  .object({
    id: z.string().trim().min(1),
    title: z.string().trim().min(1),
    topicId: z.string().trim().min(1),
    sections: z.array(sectionSchema).min(1),
    header: z
      .object({
        gradeLabel: z.string().trim().min(1),
        topicLabel: z.string().trim().min(1),
      })
      .strict(),
  })
  .strict();

export type TemplateSchemaType = z.infer<typeof TemplateSchema>;

export class InvalidTemplateError extends Error {
  code = "INVALID_TEMPLATE" as const;
  status = 422 as const;
  details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.name = "InvalidTemplateError";
    this.details = details;
  }
}

export function validateTemplate(raw: unknown, filePath?: string): VariantTemplate {
  const result = TemplateSchema.safeParse(raw);
  if (!result.success) {
    throw new InvalidTemplateError(
      filePath ? `Invalid template: ${filePath}` : "Invalid template.",
      result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    );
  }

  return result.data as VariantTemplate;
}

