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
import { buildVariantPlan, InsufficientTasksError } from "@/src/lib/variants/plan";
import type { WorkType } from "@/src/lib/variants/print-recommendation";
import { createSeededRng } from "@/src/lib/variants/rng";

import type { DemoPlanItem } from "./types";

export const DEMO_MAX_VARIANTS = 6;
export const DEMO_MAX_TOTAL_TASKS = 60;
const DEMO_MAX_REQUESTS_PER_WINDOW = 8;
const DEMO_RATE_WINDOW_MS = 5 * 60 * 1000;

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

export function parseDemoDifficulty(value: unknown): 1 | 2 | 3 | undefined {
  if (typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 3) {
    return value as 1 | 2 | 3;
  }

  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
  const plain = Number(normalized);
  if (Number.isInteger(plain) && plain >= 1 && plain <= 3) {
    return plain as 1 | 2 | 3;
  }

  const levelMatch = normalized.match(/^l(?:evel)?\s*([123])$/);
  if (!levelMatch) return undefined;
  return Number(levelMatch[1]) as 1 | 2 | 3;
}

export type WorkTitleTemplate = {
  customTitle?: string | null;
  date?: string | null;
};

export async function enforceDemoRateLimit(ownerUserId: string) {
  const db = prisma as unknown as {
    work: {
      count(args: unknown): Promise<number>;
    };
  };

  const windowStart = new Date(Date.now() - DEMO_RATE_WINDOW_MS);
  const recentDemoWorks = await db.work.count({
    where: {
      ownerUserId,
      isDemo: true,
      createdAt: { gte: windowStart },
    },
  });

  if (recentDemoWorks >= DEMO_MAX_REQUESTS_PER_WINDOW) {
    throw new DemoRateLimitError();
  }
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
    .map((item) => {
      const parsedDifficulty = parseDemoDifficulty(item.difficulty);
      return {
        ...(typeof item.topicId === "string" && item.topicId.length > 0 ? { topicId: item.topicId } : {}),
        skillId: item.skillId,
        count: Math.trunc(item.count),
        ...(parsedDifficulty ? { difficulty: parsedDifficulty } : {}),
      };
    });

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
  const topicLabels: Record<string, string> = {
    "math.proportion": "Пропорции",
    "math.equations": "Уравнения",
    "math.negative_numbers": "Отрицательные числа",
  };
  const gradeLabels: Record<string, string> = {
    "math.proportion": "5 класс",
    "math.equations": "5 класс",
  };

  return {
    id: `demo.${topicId}.${mode ?? "custom"}`,
    title: mode ? `Конструктор вариантов • ${mode}` : "Конструктор вариантов",
    topicId,
    header: {
      gradeLabel: gradeLabels[topicId] ?? "Класс",
      topicLabel: topicLabels[topicId] ?? topicId,
    },
    sections: plan.map((item) => {
      const parsedDifficulty = parseDemoDifficulty(item.difficulty);
      return {
        label: skillsById.get(item.skillId)?.title ?? item.skillId,
        skillIds: [item.skillId],
        count: item.count,
        difficulty: parsedDifficulty
          ? ([parsedDifficulty, parsedDifficulty] as [number, number])
          : ([1, 5] as [number, number]),
      };
    }),
  };
}

function makeSeed(index: number) {
  return `${Date.now()}-${index}-${crypto.randomUUID().slice(0, 8)}`;
}

export function buildWorkDisplayTitle(params: {
  locale?: "ru" | "en" | "de";
  workType: WorkType;
  titleTemplate?: WorkTitleTemplate;
}) {
  const locale = params.locale ?? "ru";
  const labels: Record<"ru" | "en" | "de", Record<WorkType, string>> = {
    ru: {
      lesson: "Работа на уроке",
      quiz: "Самостоятельная",
      homework: "Домашняя работа",
      test: "Контрольная",
    },
    en: {
      lesson: "Lesson work",
      quiz: "Quiz",
      homework: "Homework",
      test: "Test",
    },
    de: {
      lesson: "Unterricht",
      quiz: "Kurztest",
      homework: "Hausaufgabe",
      test: "Klassenarbeit",
    },
  };
  const dateLocales: Record<"ru" | "en" | "de", string> = {
    ru: "ru-RU",
    en: "en-US",
    de: "de-DE",
  };
  const baseTitle = labels[locale][params.workType] ?? labels[locale].quiz;
  const customTitle = params.titleTemplate?.customTitle?.trim();
  const date = params.titleTemplate?.date?.trim();
  const normalizedDate =
    date && /^\d{4}-\d{2}-\d{2}$/.test(date)
      ? new Intl.DateTimeFormat(dateLocales[locale], {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }).format(new Date(`${date}T00:00:00`))
      : null;

  const parts = [baseTitle];
  if (customTitle) parts.push(customTitle);
  if (normalizedDate) parts.push(normalizedDate);
  return parts.join(" · ");
}

export function shuffleItemsWithSeed<T>(items: T[], seed: string): T[] {
  const rng = createSeededRng(seed);
  const shuffled = [...items];

  // Fisher-Yates shuffle with seeded RNG for reproducibility.
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = rng.pickIndex(i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }

  return shuffled;
}

type CreatedDemoVariantSummary = {
  id: string;
  title: string;
  createdAt: Date;
  tasksCount: number;
  fit: VariantPrintFitMetrics;
};

type DemoVariantDraft = {
  seed: string;
  ordered: Array<{
    task: { id: string; statement_md: string };
    sectionLabel: string;
    orderIndex: number;
  }>;
  title: string;
  fit: VariantPrintFitMetrics;
};

export function buildDemoVariantDrafts(params: {
  tasks: Awaited<ReturnType<typeof getTasksForTopic>>["tasks"];
  template: VariantTemplate;
  variantsCount: number;
  seed?: number;
  shuffleOrder?: boolean;
  topicId: string;
}) {
  const { tasks, template, variantsCount } = params;

  for (const section of template.sections) {
    const [minDifficulty, maxDifficulty] = section.difficulty;
    const availableCount = tasks.filter(
      (task) =>
        section.skillIds.includes(task.skill_id) &&
        task.difficulty >= minDifficulty &&
        task.difficulty <= maxDifficulty,
    ).length;
    if (availableCount < section.count) {
      throw new InsufficientTasksError({
        sectionLabel: section.label,
        requiredCount: section.count,
        availableCount,
        skillIds: [...section.skillIds],
        difficulty: section.difficulty,
      });
    }
  }

  const drafts: DemoVariantDraft[] = [];
  for (let i = 0; i < variantsCount; i += 1) {
    const seed = params.seed != null ? `${params.seed}-${i}` : makeSeed(i);
    let selected;
    try {
      selected = buildVariantPlan({ tasks, template, seed });
    } catch (error) {
      if (error instanceof InsufficientTasksError) {
        const wrapped = new Error(error.message) as Error & {
          code: "INSUFFICIENT_TASKS";
          details: Record<string, unknown>;
        };
        wrapped.code = "INSUFFICIENT_TASKS";
        wrapped.details = {
          ...error.details,
          variantIndex: i + 1,
          variantsCount,
          remainingUniqueTasks: tasks.length,
        };
        throw wrapped;
      }
      throw error;
    }
    const ordered = params.shuffleOrder
      ? shuffleItemsWithSeed(selected, `${seed}:shuffle`)
          .map((item) => ({ ...item }))
          .map((item, orderIndex) => ({ ...item, orderIndex }))
      : selected;
    const timestamp = new Intl.DateTimeFormat("ru-RU", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date());

    drafts.push({
      seed,
      ordered: ordered.map((item) => ({
        task: { id: item.task.id, statement_md: item.task.statement_md },
        sectionLabel: item.sectionLabel,
        orderIndex: item.orderIndex,
      })),
      title: `${template.title} • ${timestamp} • ${i + 1}`,
      fit: analyzeVariantPrintFit(ordered.map((item) => ({ statement_md: item.task.statement_md }))),
    });
  }

  return drafts;
}

export async function generateDemoWorkWithVariants(params: {
  ownerUserId: string;
  topicId: string;
  topicIds?: string[];
  locale?: "ru" | "en" | "de";
  template: VariantTemplate;
  variantsCount: number;
  seed?: number;
  shuffleOrder?: boolean;
  mode?: string;
  workType: WorkType;
  printLayout: PrintLayoutMode;
  titleTemplate?: WorkTitleTemplate;
}): Promise<{ work: { id: string }; variants: CreatedDemoVariantSummary[] }> {
  const { ownerUserId, topicId, template, variantsCount, workType, printLayout } = params;
  const sourceTopicIds = Array.from(new Set([topicId, ...(params.topicIds ?? [])]));
  const tasks: Awaited<ReturnType<typeof getTasksForTopic>>["tasks"] = [];
  for (const currentTopicId of sourceTopicIds) {
    const result = await getTasksForTopic(currentTopicId);
    if (result.errors.length > 0) {
      throw new Error(`Task bank errors: ${result.errors[0]}`);
    }
    tasks.push(...result.tasks);
  }

  const drafts = buildDemoVariantDrafts({
    tasks,
    template,
    variantsCount,
    seed: params.seed,
    shuffleOrder: params.shuffleOrder,
    topicId,
  });

  const variantFits = drafts.map((draft) => draft.fit);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const title = buildWorkDisplayTitle({
    locale: params.locale,
    workType,
    titleTemplate: params.titleTemplate,
  });
  const fit = analyzeWorkPrintFit({
    workType,
    variants: variantFits,
  });

  const db = prisma as unknown as {
    $transaction: <T>(fn: (tx: unknown) => Promise<T>) => Promise<T>;
  };

  return db.$transaction(async (tx) => {
    const trx = tx as {
      variant: { create(args: unknown): Promise<{ id: string; createdAt: Date; title: string }> };
      variantTask: { createMany(args: unknown): Promise<unknown> };
      work: { create(args: unknown): Promise<{ id: string }> };
      workVariant: { createMany(args: unknown): Promise<unknown> };
    };

    const createdVariants: CreatedDemoVariantSummary[] = [];

    for (const draft of drafts) {
      const createdVariant = await trx.variant.create({
        data: {
          ownerUserId,
          topicId,
          templateId: template.id,
          title: draft.title,
          seed: draft.seed,
        },
      });

      await trx.variantTask.createMany({
        data: draft.ordered.map((item) => ({
          variantId: createdVariant.id,
          taskId: item.task.id,
          sectionLabel: item.sectionLabel,
          orderIndex: item.orderIndex,
        })),
      });

      createdVariants.push({
        id: createdVariant.id,
        title: createdVariant.title,
        createdAt: createdVariant.createdAt,
        tasksCount: draft.ordered.length,
        fit: draft.fit,
      });
    }

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
          generation: {
            variantsCount,
            shuffleOrder: params.shuffleOrder === true,
            topicIds: sourceTopicIds,
            titleTemplate: params.titleTemplate ?? null,
            plan: template.sections.flatMap((section) =>
              section.skillIds.map((skillId) => {
                const parsedDifficulty =
                  section.difficulty[0] === section.difficulty[1]
                    ? parseDemoDifficulty(section.difficulty[0])
                    : undefined;
                return {
                  skillId,
                  count: section.count,
                  ...(parsedDifficulty ? { difficulty: parsedDifficulty } : {}),
                };
              }),
            ),
          },
          fit,
        },
        isDemo: true,
        expiresAt,
      },
    });

    await trx.workVariant.createMany({
      data: createdVariants.map((variant, orderIndex) => ({
        workId: createdWork.id,
        variantId: variant.id,
        orderIndex,
      })),
    });

    return {
      work: createdWork,
      variants: createdVariants,
    };
  });
}
