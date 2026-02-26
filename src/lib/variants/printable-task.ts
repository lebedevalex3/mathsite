import type { VariantTaskWithContent } from "@/src/lib/variants/types";

export type PrintableTaskComplexity = "short" | "medium" | "long";
export type PrintableAnswerSpaceHint = "inline" | "short" | "medium";

export type PrintableTask = {
  taskId: string;
  skillId: string;
  orderIndex: number;
  statementMd: string;
  answerText?: string;
  print: {
    textChars: number;
    lineBreaks: number;
    hasKatex: boolean;
    hasDisplayMath: boolean;
    hasFractionLike: boolean;
    estimatedLines: number;
    complexity: PrintableTaskComplexity;
    answerSpaceHint: PrintableAnswerSpaceHint;
  };
};

type VariantTaskLike = Pick<VariantTaskWithContent, "taskId" | "orderIndex"> & {
  skillId?: string;
  task: {
    statement_md: string;
    skill_id?: string;
    answer?: { type?: string; value?: unknown };
    answer_md?: string;
  };
};

const KATEX_INLINE_RE = /\$[^$]+\$/;
const KATEX_DISPLAY_RE = /\$\$[\s\S]+?\$\$/;
const FRACTION_RE = /\\frac|\\dfrac|\\tfrac|\\sqrt|\\sum|\\int/;

function countLineBreaks(text: string) {
  return (text.match(/\n/g) ?? []).length;
}

function estimateLines(text: string, hasDisplayMath: boolean) {
  const chars = text.length;
  const lineBreaks = countLineBreaks(text);

  let lines = Math.ceil(chars / 55);
  lines += lineBreaks;

  if (/^\s*[-*]\s/m.test(text) || /^\s*\d+\.\s/m.test(text)) {
    lines += 1;
  }

  if (hasDisplayMath) {
    lines += 2;
  }

  return Math.max(1, lines);
}

function detectComplexity(params: {
  textChars: number;
  estimatedLines: number;
  hasDisplayMath: boolean;
}): PrintableTaskComplexity {
  const { textChars, estimatedLines, hasDisplayMath } = params;
  if (textChars >= 220 || estimatedLines >= 7) return "long";
  if (textChars >= 90 || estimatedLines >= 4 || hasDisplayMath) return "medium";
  return "short";
}

function detectAnswerSpaceHint(params: {
  complexity: PrintableTaskComplexity;
  hasKatex: boolean;
}): PrintableAnswerSpaceHint {
  const { complexity, hasKatex } = params;
  if (complexity === "short" && !hasKatex) return "inline";
  if (complexity === "long") return "medium";
  return "short";
}

function normalizeAnswerText(task: VariantTaskLike["task"]): string | undefined {
  if (typeof task.answer_md === "string" && task.answer_md.trim()) {
    return task.answer_md.trim();
  }

  if (task.answer?.type === "number" && typeof task.answer.value === "number") {
    return String(task.answer.value);
  }

  return undefined;
}

export function toPrintableTask(item: VariantTaskLike): PrintableTask {
  const statementMd = typeof item.task.statement_md === "string" ? item.task.statement_md : "";
  const textChars = statementMd.length;
  const lineBreaks = countLineBreaks(statementMd);
  const hasDisplayMath = KATEX_DISPLAY_RE.test(statementMd);
  const hasInlineMath = KATEX_INLINE_RE.test(statementMd);
  const hasFractionLike = FRACTION_RE.test(statementMd);
  const hasKatex = hasDisplayMath || hasInlineMath || hasFractionLike;
  const estimatedLines = estimateLines(statementMd, hasDisplayMath);
  const complexity = detectComplexity({ textChars, estimatedLines, hasDisplayMath });
  const answerSpaceHint = detectAnswerSpaceHint({ complexity, hasKatex });

  return {
    taskId: item.taskId,
    skillId: item.skillId ?? item.task.skill_id ?? "",
    orderIndex: item.orderIndex,
    statementMd,
    answerText: normalizeAnswerText(item.task),
    print: {
      textChars,
      lineBreaks,
      hasKatex,
      hasDisplayMath,
      hasFractionLike,
      estimatedLines,
      complexity,
      answerSpaceHint,
    },
  };
}

export function toPrintableTasks(items: VariantTaskLike[]): PrintableTask[] {
  return items
    .slice()
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((item) => toPrintableTask(item));
}

