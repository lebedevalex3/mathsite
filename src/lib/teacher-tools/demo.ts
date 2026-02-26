import { getTasksForTopic } from "@/lib/tasks/query";
import { prisma } from "@/src/lib/db/prisma";
import {
  analyzeVariantPrintFit,
  analyzeWorkPrintFit,
  type VariantPrintFitMetrics,
} from "@/src/lib/variants/print-fit";
import { defaultOrientationForLayout } from "@/src/lib/variants/print-profile";
import type { PrintLayoutMode } from "@/src/lib/variants/print-layout";
import type { VariantTemplate } from "@/src/lib/variants/types";
import { buildVariantPlan } from "@/src/lib/variants/plan";
import type { WorkType } from "@/src/lib/variants/print-recommendation";

import type { DemoPlanItem } from "./types";

export const DEMO_MAX_VARIANTS = 6;
export const DEMO_MAX_TOTAL_TASKS = 60;
const DEMO_MAX_REQUESTS_PER_WINDOW = 8;
const DEMO_RATE_WINDOW_MS = 5 * 60 * 1000;

const requestBuckets = new Map<string, number[]>();

export class DemoRateLimitError extends Error {
  status = 429;
  code = "RATE_LIMITED";
  constructor() {
    super("Too many demo generation requests. Please try again later.");
  }
}

type BuildDemoTemplateParams = {
  topicId: string;
  plan: DemoPlanItem[];
  skillsById: Map<string, { title: string }>;
  mode?: string;
};

export function enforceDemoRateLimit(bucketKey: string) {
  const now = Date.now();
  const bucket = (requestBuckets.get(bucketKey) ?? []).filter((ts) => now - ts < DEMO_RATE_WINDOW_MS);
  if (bucket.length >= DEMO_MAX_REQUESTS_PER_WINDOW) {
    throw new DemoRateLimitError();
  }
  bucket.push(now);
  requestBuckets.set(bucketKey, bucket);
}

export function validateDemoPlan(plan: DemoPlanItem[], variantsCount: number) {
  if (!Number.isInteger(variantsCount) || variantsCount < 1 || variantsCount > DEMO_MAX_VARIANTS) {
    throw new Error(`variantsCount must be between 1 and ${DEMO_MAX_VARIANTS}`);
  }

  if (!Array.isArray(plan) || plan.length === 0) {
    throw new Error("plan is required");
  }

  const normalized = plan
    .filter((item) => Number.isFinite(item.count) && item.count > 0)
    .map((item) => ({ skillId: item.skillId, count: Math.trunc(item.count) }));

  if (normalized.length === 0) {
    throw new Error("Select at least one skill with count > 0");
  }

  const totalPerVariant = normalized.reduce((sum, item) => sum + item.count, 0);
  if (totalPerVariant < 1 || totalPerVariant > DEMO_MAX_TOTAL_TASKS) {
    throw new Error(`Total tasks per variant must be between 1 and ${DEMO_MAX_TOTAL_TASKS}`);
  }

  return { normalized, totalPerVariant };
}

export function buildDemoTemplate({
  topicId,
  plan,
  skillsById,
  mode,
}: BuildDemoTemplateParams): VariantTemplate {
  return {
    id: `demo.${topicId}.${mode ?? "custom"}`,
    title: mode ? `Конструктор вариантов • ${mode}` : "Конструктор вариантов",
    topicId,
    header: {
      gradeLabel: topicId.startsWith("g5.") ? "5 класс" : "Класс",
      topicLabel: topicId === "g5.proporcii" ? "Пропорции" : topicId,
    },
    sections: plan.map((item) => ({
      label: skillsById.get(item.skillId)?.title ?? item.skillId,
      skillIds: [item.skillId],
      count: item.count,
      difficulty: [1, 5] as [number, number],
    })),
  };
}

function makeSeed(index: number) {
  return `${Date.now()}-${index}-${crypto.randomUUID().slice(0, 8)}`;
}

export async function generateAndSaveDemoVariants(params: {
  ownerUserId: string;
  topicId: string;
  template: VariantTemplate;
  variantsCount: number;
  seed?: number;
  shuffleOrder?: boolean;
}) {
  const { ownerUserId, topicId, template, variantsCount } = params;
  const { tasks, errors } = await getTasksForTopic(topicId);
  if (errors.length > 0) {
    throw new Error(`Task bank errors: ${errors[0]}`);
  }

  const db = prisma as unknown as {
    $transaction: <T>(fn: (tx: unknown) => Promise<T>) => Promise<T>;
  };

  const created: Array<{
    id: string;
    title: string;
    createdAt: Date;
    tasksCount: number;
    fit: VariantPrintFitMetrics;
  }> = [];
  for (let i = 0; i < variantsCount; i += 1) {
    const seed = params.seed != null ? `${params.seed}-${i}` : makeSeed(i);
    const selected = buildVariantPlan({ tasks, template, seed });
    const ordered = params.shuffleOrder
      ? selected
          .map((item) => ({ ...item }))
          .sort(() => Math.random() - 0.5)
          .map((item, orderIndex) => ({ ...item, orderIndex }))
      : selected;
    const timestamp = new Intl.DateTimeFormat("ru-RU", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date());

    const variant = await db.$transaction(async (tx) => {
      const trx = tx as {
        variant: { create(args: unknown): Promise<{ id: string; createdAt: Date; title: string }> };
        variantTask: { createMany(args: unknown): Promise<unknown> };
      };
      const createdVariant = await trx.variant.create({
        data: {
          ownerUserId,
          topicId,
          templateId: template.id,
          title: `${template.title} • ${timestamp} • ${i + 1}`,
          seed,
        },
      });
      await trx.variantTask.createMany({
        data: ordered.map((item) => ({
          variantId: createdVariant.id,
          taskId: item.task.id,
          sectionLabel: item.sectionLabel,
          orderIndex: item.orderIndex,
        })),
      });
      return createdVariant;
    });

    created.push({
      id: variant.id,
      title: variant.title,
      createdAt: variant.createdAt,
      tasksCount: ordered.length,
      fit: analyzeVariantPrintFit(ordered.map((item) => ({ statement_md: item.task.statement_md }))),
    });
  }

  return created;
}

export async function createDemoWork(params: {
  ownerUserId: string;
  topicId: string;
  mode?: string;
  variantIds: string[];
  workType: WorkType;
  printLayout: PrintLayoutMode;
  variantFits: VariantPrintFitMetrics[];
}) {
  const { ownerUserId, topicId, mode, variantIds, workType, printLayout, variantFits } = params;
  if (variantIds.length === 0) {
    throw new Error("variantIds is required");
  }

  const db = prisma as unknown as {
    $transaction: <T>(fn: (tx: unknown) => Promise<T>) => Promise<T>;
  };

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const title = mode ? `Работа • ${mode}` : "Работа";
  const fit = analyzeWorkPrintFit({
    workType,
    variants: variantFits,
  });

  const work = await db.$transaction(async (tx) => {
    const trx = tx as {
      work: {
        create(args: unknown): Promise<{ id: string }>;
      };
      workVariant: {
        createMany(args: unknown): Promise<unknown>;
      };
    };

    const createdWork = await trx.work.create({
      data: {
        ownerUserId,
        topicId,
        title,
        workType,
        printProfileJson: {
          version: 1,
          layout: printLayout,
          orientation: defaultOrientationForLayout(printLayout),
          workType,
          fit,
        },
        isDemo: true,
        expiresAt,
      },
    });

    await trx.workVariant.createMany({
      data: variantIds.map((variantId, orderIndex) => ({
        workId: createdWork.id,
        variantId,
        orderIndex,
      })),
    });

    return createdWork;
  });

  return work;
}
