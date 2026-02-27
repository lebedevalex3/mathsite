import type { VariantPrintFitMetrics, WorkPrintFit } from "@/src/lib/variants/print-fit";
import { normalizePrintProfile, type NormalizedPrintProfile } from "@/src/lib/variants/print-profile";
import type { WorkType } from "@/src/lib/variants/print-recommendation";
import { getVariantDetailForOwner, getWorkDetailForOwner } from "@/src/lib/variants/repository";
import { toPrintableTasks, type PrintableTask } from "@/src/lib/variants/printable-task";
import type { VariantDetail } from "@/src/lib/variants/types";

type WorkDetailForPrintable = NonNullable<Awaited<ReturnType<typeof getWorkDetailForOwner>>>;

export type PrintableWorkVariant = {
  variantId: string;
  variantNo: number;
  title: string;
  createdAt: Date;
  tasksCount: number;
  tasks: PrintableTask[];
  fit?: VariantPrintFitMetrics;
};

export type PrintableWorkDocument = {
  workId: string;
  locale: "ru" | "en" | "de";
  topicId: string;
  title: string;
  workType: WorkType;
  profile: NormalizedPrintProfile;
  fit?: WorkPrintFit;
  createdAt: Date;
  variants: PrintableWorkVariant[];
};

export function parseStoredWorkPrintFit(value: unknown): WorkPrintFit | undefined {
  if (!value || typeof value !== "object") return undefined;
  const fit = (value as { fit?: unknown }).fit;
  if (!fit || typeof fit !== "object") return undefined;
  const obj = fit as Partial<WorkPrintFit>;
  if (
    (obj.recommendedLayout !== "single" && obj.recommendedLayout !== "two") ||
    typeof obj.allowTwoUp !== "boolean" ||
    !Array.isArray(obj.reasons) ||
    !obj.metrics ||
    typeof obj.metrics !== "object"
  ) {
    return undefined;
  }
  return {
    recommendedLayout: obj.recommendedLayout,
    allowTwoUp: obj.allowTwoUp,
    reasons: obj.reasons.filter((r): r is string => typeof r === "string"),
    metrics: obj.metrics as WorkPrintFit["metrics"],
  };
}

function normalizeWorkType(value: string): WorkType {
  return value === "lesson" || value === "quiz" || value === "homework" || value === "test"
    ? value
    : "lesson";
}

export function buildPrintableWorkDocument(params: {
  locale: "ru" | "en" | "de";
  work: Pick<
    WorkDetailForPrintable,
    "id" | "topicId" | "title" | "workType" | "printProfileJson" | "createdAt" | "variants"
  >;
  variantDetailsById: Map<string, VariantDetail>;
  variantFitsById?: Map<string, VariantPrintFitMetrics>;
}): PrintableWorkDocument {
  const { locale, work, variantDetailsById, variantFitsById } = params;
  const profile = normalizePrintProfile(work.printProfileJson);
  const fit = parseStoredWorkPrintFit(work.printProfileJson);

  const variants: PrintableWorkVariant[] = work.variants.map((item) => {
    const detail = variantDetailsById.get(item.id);
    if (!detail) {
      throw new Error(`Variant detail missing for work variant ${item.id}`);
    }
    return {
      variantId: item.id,
      variantNo: item.orderIndex + 1,
      title: item.title,
      createdAt: item.createdAt,
      tasksCount: item.tasksCount,
      tasks: toPrintableTasks(
        detail.tasks.map((task) => ({
          taskId: task.taskId,
          orderIndex: task.orderIndex,
          task: {
            statement_md: task.task.statement_md,
            skill_id: task.task.skill_id,
            answer: task.task.answer,
            answer_md: (task.task as { answer_md?: string }).answer_md,
          },
        })),
      ),
      fit: variantFitsById?.get(item.id),
    };
  });

  return {
    workId: work.id,
    locale,
    topicId: work.topicId,
    title: work.title,
    workType: normalizeWorkType(work.workType),
    profile,
    fit,
    createdAt: work.createdAt,
    variants,
  };
}

export async function loadPrintableWorkDocumentForOwner(params: {
  workId: string;
  ownerUserId: string;
  locale: "ru" | "en" | "de";
}): Promise<PrintableWorkDocument | null> {
  const work = await getWorkDetailForOwner(params.workId, params.ownerUserId);
  if (!work) return null;

  const details = await Promise.all(
    work.variants.map(async (variant) => {
      const detail = await getVariantDetailForOwner(variant.id, params.ownerUserId);
      if (!detail) {
        throw new Error(`Variant ${variant.id} not found for owner ${params.ownerUserId}`);
      }
      return detail;
    }),
  );

  return buildPrintableWorkDocument({
    locale: params.locale,
    work,
    variantDetailsById: new Map(details.map((detail) => [detail.id, detail])),
  });
}
