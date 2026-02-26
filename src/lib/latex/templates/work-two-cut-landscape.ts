import { markdownTaskToLatex } from "@/src/lib/latex/task-markdown-to-latex";
import { getTaskMeasureKey } from "@/src/lib/latex/measure-task-heights";
import type { PrintableTask } from "@/src/lib/variants/printable-task";
import type { PrintableWorkDocument, PrintableWorkVariant } from "@/src/lib/variants/printable-work";

type Labels = {
  main: string;
  dateLabel: string;
  studentLabel: string;
  classLabel: string;
  variantLabel: string;
  continuedLabel: string;
};

type VariantFrame = {
  variant: PrintableWorkVariant;
  frameNo: number;
  tasks: PrintableTask[];
  startTaskNo: number;
};

const FRAME_LINE_CAPACITY = 14; // conservative default for duplex cut-safe layout
const FIRST_FRAME_OVERHEAD = 5;
const CONT_FRAME_OVERHEAD = 4;
const TASK_ITEM_OVERHEAD = 1;
const FRAME_PT_CAPACITY = 520;
const FIRST_FRAME_OVERHEAD_PT = 42;
const CONT_FRAME_OVERHEAD_PT = 34;
const TASK_ITEM_OVERHEAD_PT = 10;

function isTwoCutDebugEnabled() {
  return process.env.NODE_ENV !== "production" && process.env.LATEX_TWO_CUT_DEBUG === "1";
}

function languageConfig(locale: PrintableWorkDocument["locale"]): Labels {
  if (locale === "de") {
    return {
      main: "german",
      dateLabel: "Datum",
      studentLabel: "Schüler",
      classLabel: "Klasse",
      variantLabel: "Variante",
      continuedLabel: "Fortsetzung",
    };
  }
  if (locale === "en") {
    return {
      main: "english",
      dateLabel: "Date",
      studentLabel: "Student",
      classLabel: "Class",
      variantLabel: "Variant",
      continuedLabel: "continued",
    };
  }
  return {
    main: "russian",
    dateLabel: "Дата",
    studentLabel: "Ученик",
    classLabel: "Класс",
    variantLabel: "Вариант",
    continuedLabel: "продолжение",
  };
}

function chunkPairs<T>(items: T[]): [T | null, T | null][] {
  const out: [T | null, T | null][] = [];
  for (let i = 0; i < items.length; i += 2) {
    out.push([items[i] ?? null, items[i + 1] ?? null]);
  }
  return out;
}

function taskCost(
  variant: PrintableWorkVariant,
  task: PrintableTask,
  measuredHeightsPt?: Map<string, number>,
) {
  if (measuredHeightsPt) {
    const measured = measuredHeightsPt.get(getTaskMeasureKey(variant.variantId, task.orderIndex));
    if (typeof measured === "number" && measured > 0) {
      return { unit: "pt" as const, value: measured + TASK_ITEM_OVERHEAD_PT };
    }
  }
  return { unit: "lines" as const, value: task.print.estimatedLines + TASK_ITEM_OVERHEAD };
}

function paginateVariantFrames(
  variant: PrintableWorkVariant,
  measuredHeightsPt?: Map<string, number>,
): VariantFrame[] {
  const frames: VariantFrame[] = [];
  let currentTasks: PrintableTask[] = [];
  let currentStartTaskNo = 1;
  let used = 0;
  let frameNo = 1;
  let unit: "pt" | "lines" | null = null;

  function pushFrame() {
    if (currentTasks.length === 0) return;
    frames.push({
      variant,
      frameNo,
      tasks: currentTasks,
      startTaskNo: currentStartTaskNo,
    });
    frameNo += 1;
    currentStartTaskNo += currentTasks.length;
    currentTasks = [];
    used = 0;
  }

  for (const task of variant.tasks) {
    const cost = taskCost(variant, task, measuredHeightsPt);
    unit ??= cost.unit;
    if (unit !== cost.unit) unit = "lines";
    const overhead = unit === "pt"
      ? (frameNo === 1 ? FIRST_FRAME_OVERHEAD_PT : CONT_FRAME_OVERHEAD_PT)
      : (frameNo === 1 ? FIRST_FRAME_OVERHEAD : CONT_FRAME_OVERHEAD);
    const capacity = unit === "pt" ? FRAME_PT_CAPACITY - overhead : FRAME_LINE_CAPACITY - overhead;

    if (currentTasks.length > 0 && used + cost.value > capacity) {
      pushFrame();
    }

    // If one task is taller than a half-frame budget, still allow it as a standalone frame.
    // We prefer a sparse/overflow-prone sheet over blocking the teacher with a hard error.
    if (currentTasks.length === 0 && cost.value > capacity) {
      currentTasks.push(task);
      used += cost.value;
      pushFrame();
      continue;
    }

    currentTasks.push(task);
    used += cost.value;
  }

  pushFrame();
  return frames;
}

function renderFrameBlock(frame: VariantFrame, labels: Labels) {
  const isContinued = frame.frameNo > 1;
  const enumStart = frame.startTaskNo - 1;
  const tasks = frame.tasks
    .map(
      (task) => `
\\item
${markdownTaskToLatex(task.statementMd)}
`,
    )
    .join("\n");

  return `
\\begingroup
\\small
\\raggedright
{\\large\\bfseries ${labels.variantLabel} №${frame.variant.variantNo}${isContinued ? `\\ (\\textit{${labels.continuedLabel}})` : ""}}\\\\[1.0mm]
${labels.studentLabel}: \\hrulefill \\hspace{2mm} ${labels.classLabel}: \\hrulefill \\hspace{2mm} ${labels.dateLabel}: \\hrulefill

\\vspace{1.2mm}
\\begin{enumerate}[leftmargin=*, itemsep=0.8mm, topsep=0.6mm]
\\setcounter{enumi}{${enumStart}}
${tasks}
\\end{enumerate}
\\endgroup
`;
}

function renderBlankFrame() {
  return "";
}

function renderSheetSide(params: {
  left: VariantFrame | null;
  right: VariantFrame | null;
  labels: Labels;
  isLast: boolean;
  sheetNo: number;
  isBackSide: boolean;
}) {
  const { left, right, labels, isLast, sheetNo, isBackSide } = params;
  const debugBanner = isTwoCutDebugEnabled()
    ? `\\noindent{\\tiny\\textit{two\\_cut: sheet ${sheetNo} ${isBackSide ? "back" : "front"} (${isBackSide ? "swap" : "normal"})}}\\\\[0.8mm]`
    : "";
  return `
\\noindent
${debugBanner}
\\begin{minipage}[t]{0.485\\textwidth}
\\vspace{0pt}
${left ? renderFrameBlock(left, labels) : renderBlankFrame()}
\\end{minipage}
\\hfill
\\begin{minipage}[t]{0.485\\textwidth}
\\vspace{0pt}
${right ? renderFrameBlock(right, labels) : renderBlankFrame()}
\\end{minipage}
${isLast ? "" : "\\newpage"}
`;
}

function renderPairCutSafe(
  pair: [PrintableWorkVariant | null, PrintableWorkVariant | null],
  labels: Labels,
  measuredHeightsPt?: Map<string, number>,
) {
  const [leftVariant, rightVariant] = pair;
  const leftFrames = leftVariant ? paginateVariantFrames(leftVariant, measuredHeightsPt) : [];
  const rightFrames = rightVariant ? paginateVariantFrames(rightVariant, measuredHeightsPt) : [];
  const totalFrames = Math.max(leftFrames.length, rightFrames.length);

  if (totalFrames === 0) return "";

  const pages: string[] = [];
  for (let i = 0; i < totalFrames; i += 1) {
    const leftFrame = leftFrames[i] ?? null;
    const rightFrame = rightFrames[i] ?? null;
    const isBackSide = i % 2 === 1;
    const sheetNo = Math.floor(i / 2) + 1;
    const left = isBackSide ? rightFrame : leftFrame;
    const right = isBackSide ? leftFrame : rightFrame;
    pages.push(
      renderSheetSide({
        left,
        right,
        labels,
        isLast: false,
        sheetNo,
        isBackSide,
      }),
    );
  }

  // Remove trailing \newpage from the final side of this pair.
  const last = pages.length - 1;
  pages[last] = pages[last].replace(/\\newpage\s*$/, "");
  return pages.join("\n");
}

export function renderWorkTwoCutLandscapeLatex(
  doc: PrintableWorkDocument,
  measuredHeightsPt?: Map<string, number>,
): string {
  const labels = languageConfig(doc.locale);
  const pairSheets = chunkPairs(doc.variants)
    .map((pair) => renderPairCutSafe(pair, labels, measuredHeightsPt))
    .filter(Boolean)
    .join("\n\\newpage\n");

  return String.raw`\documentclass[10pt]{article}
\usepackage[a4paper,landscape,margin=10mm]{geometry}
\usepackage{fontspec}
\usepackage{polyglossia}
\setmainlanguage{${labels.main}}
\setmainfont{DejaVu Serif}
\usepackage{amsmath,amssymb}
\usepackage{enumitem}
\setlist[enumerate]{leftmargin=*}
\setlist[itemize]{leftmargin=*, itemsep=1mm}
\pagestyle{empty}
\setlength{\parindent}{0pt}
\setlength{\parskip}{0pt}
\setlength{\emergencystretch}{2em}
\raggedbottom
\sloppy
\begin{document}
${pairSheets}
\end{document}
`;
}
