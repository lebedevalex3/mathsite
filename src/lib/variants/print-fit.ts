import type { PrintLayoutMode } from "@/src/lib/variants/print-layout";
import type { WorkType } from "@/src/lib/variants/print-recommendation";
import { toPrintableTasks } from "@/src/lib/variants/printable-task";

export const PRINT_FIT_THRESHOLDS = {
  maxTaskCharsForTwoUp: 220,
  totalTextCharsForTwoUp: 1400,
  tasksCountForTwoUp: 18,
  katexHeavyTasksCount: 14,
  katexHeavyTextChars: 1000,
} as const;

export type VariantPrintFitMetrics = {
  tasksCount: number;
  totalTextChars: number;
  maxTaskChars: number;
  hasLongWordProblem: boolean;
  hasKatex: boolean;
};

export type WorkPrintFit = {
  recommendedLayout: PrintLayoutMode;
  allowTwoUp: boolean;
  reasons: string[];
  metrics: {
    variantsCount: number;
    maxTasksCount: number;
    maxTaskChars: number;
    maxTotalTextChars: number;
    anyKatex: boolean;
    anyLongWordProblem: boolean;
  };
};

export function analyzeVariantPrintFit(tasks: Array<{ statement_md: string }>): VariantPrintFitMetrics {
  const printable = toPrintableTasks(
    tasks.map((task, index) => ({
      taskId: `tmp.${index}`,
      orderIndex: index,
      task: {
        statement_md: typeof task.statement_md === "string" ? task.statement_md : "",
      },
    })),
  );
  const totalTextChars = printable.reduce((sum, item) => sum + item.print.textChars, 0);
  const maxTaskChars = printable.reduce((max, item) => Math.max(max, item.print.textChars), 0);
  const hasKatex = printable.some((item) => item.print.hasKatex);
  const hasLongWordProblem =
    printable.some((item) => item.print.complexity === "long") ||
    maxTaskChars >= PRINT_FIT_THRESHOLDS.maxTaskCharsForTwoUp;

  return {
    tasksCount: printable.length,
    totalTextChars,
    maxTaskChars,
    hasLongWordProblem,
    hasKatex,
  };
}

export function analyzeWorkPrintFit(params: {
  workType: WorkType;
  variants: VariantPrintFitMetrics[];
}): WorkPrintFit {
  const { workType, variants } = params;
  const safeVariants = variants.filter((v) => v.tasksCount > 0);

  if (safeVariants.length === 0) {
    return {
      recommendedLayout: "single",
      allowTwoUp: true,
      reasons: ["Нет задач для оценки оформления."],
      metrics: {
        variantsCount: 0,
        maxTasksCount: 0,
        maxTaskChars: 0,
        maxTotalTextChars: 0,
        anyKatex: false,
        anyLongWordProblem: false,
      },
    };
  }

  const maxTasksCount = Math.max(...safeVariants.map((v) => v.tasksCount));
  const maxTaskChars = Math.max(...safeVariants.map((v) => v.maxTaskChars));
  const maxTotalTextChars = Math.max(...safeVariants.map((v) => v.totalTextChars));
  const anyKatex = safeVariants.some((v) => v.hasKatex);
  const anyLongWordProblem = safeVariants.some((v) => v.hasLongWordProblem);

  const reasons: string[] = [];

  let allowTwoUp = true;
  if (maxTaskChars >= PRINT_FIT_THRESHOLDS.maxTaskCharsForTwoUp) {
    allowTwoUp = false;
    reasons.push("Есть длинные текстовые задачи");
  }
  if (maxTotalTextChars >= PRINT_FIT_THRESHOLDS.totalTextCharsForTwoUp) {
    allowTwoUp = false;
    reasons.push("Слишком большой объём текста для 2 варианта на страницу");
  }
  if (maxTasksCount >= PRINT_FIT_THRESHOLDS.tasksCountForTwoUp) {
    allowTwoUp = false;
    reasons.push("Слишком много задач в варианте для 2 варианта на страницу");
  }
  if (
    anyKatex &&
    (maxTasksCount >= PRINT_FIT_THRESHOLDS.katexHeavyTasksCount ||
      maxTotalTextChars >= PRINT_FIT_THRESHOLDS.katexHeavyTextChars)
  ) {
    reasons.push("Есть формулы; для читаемости лучше 1 вариант на страницу");
  }

  let recommendedLayout: PrintLayoutMode = allowTwoUp ? "two" : "single";

  if (workType === "test") {
    recommendedLayout = "single";
    if (!reasons.includes("Контрольная работа: обычно печатают 1 вариант на страницу")) {
      reasons.push("Контрольная работа: обычно печатают 1 вариант на страницу");
    }
  }
  if (workType === "homework") {
    recommendedLayout = "single";
    if (!reasons.includes("Домашняя работа: обычно удобнее 1 вариант на страницу")) {
      reasons.push("Домашняя работа: обычно удобнее 1 вариант на страницу");
    }
  }
  if (allowTwoUp && reasons.length === 0) {
    reasons.push("Варианты короткие и подходят для 2 варианта на страницу");
  }

  return {
    recommendedLayout,
    allowTwoUp,
    reasons,
    metrics: {
      variantsCount: safeVariants.length,
      maxTasksCount,
      maxTaskChars,
      maxTotalTextChars,
      anyKatex,
      anyLongWordProblem,
    },
  };
}
