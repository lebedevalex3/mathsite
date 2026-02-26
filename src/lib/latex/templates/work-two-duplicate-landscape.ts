import { markdownTaskToLatex } from "@/src/lib/latex/task-markdown-to-latex";
import { getTaskMeasureKey } from "@/src/lib/latex/measure-task-heights";
import type { PrintableTask } from "@/src/lib/variants/printable-task";
import type { PrintableWorkDocument, PrintableWorkVariant } from "@/src/lib/variants/printable-work";

type VariantFrame = {
  variant: PrintableWorkVariant;
  frameNo: number;
  tasks: PrintableTask[];
  startTaskNo: number;
};

// More permissive than two_cut: this mode prioritizes compact paper usage.
const FRAME_LINE_CAPACITY = 30;
const FIRST_FRAME_OVERHEAD = 4;
const CONT_FRAME_OVERHEAD = 3;
const TASK_ITEM_OVERHEAD = 1;
const FRAME_PT_CAPACITY = 540;
const FIRST_FRAME_OVERHEAD_PT = 38;
const CONT_FRAME_OVERHEAD_PT = 30;
const TASK_ITEM_OVERHEAD_PT = 8;
const CONTINUED_LABEL_BY_MAIN: Record<string, string> = {
  russian: "продолжение",
  german: "Fortsetzung",
  english: "continued",
};

function languageConfig(locale: PrintableWorkDocument["locale"]) {
  if (locale === "de") {
    return { main: "german", dateLabel: "Datum", studentLabel: "Schüler", classLabel: "Klasse", variantLabel: "Variante" };
  }
  if (locale === "en") {
    return { main: "english", dateLabel: "Date", studentLabel: "Student", classLabel: "Class", variantLabel: "Variant" };
  }
  return { main: "russian", dateLabel: "Дата", studentLabel: "Ученик", classLabel: "Класс", variantLabel: "Вариант" };
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
    frames.push({ variant, frameNo, tasks: currentTasks, startTaskNo: currentStartTaskNo });
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

    currentTasks.push(task);
    used += cost.value;
  }

  pushFrame();
  return frames;
}

function renderVariantFrame(frame: VariantFrame, labels: ReturnType<typeof languageConfig>) {
  const denseVariant = frame.tasks.some((task) => task.print.complexity === "long") || frame.variant.tasksCount >= 10;
  const sizeCommand = denseVariant ? "\\small" : "\\normalsize";
  const enumOptions = denseVariant
    ? "[leftmargin=*, itemsep=1mm, topsep=0.8mm]"
    : "[leftmargin=*, itemsep=1.8mm, topsep=1mm]";
  const enumStart = frame.startTaskNo - 1;
  const isContinued = frame.frameNo > 1;
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
${sizeCommand}
\\raggedright
{\\large\\bfseries ${labels.variantLabel} №${frame.variant.variantNo}${isContinued ? `\\ (\\textit{${CONTINUED_LABEL_BY_MAIN[labels.main] ?? "continued"}})` : ""}}\\\\[1.2mm]
${labels.studentLabel}: \\hrulefill \\hspace{2mm} ${labels.classLabel}: \\hrulefill \\hspace{2mm} ${labels.dateLabel}: \\hrulefill

\\vspace{1.6mm}
\\begin{enumerate}${enumOptions}
\\setcounter{enumi}{${enumStart}}
${tasks}
\\end{enumerate}
\\endgroup
`;
}

function renderSheet(
  frame: VariantFrame,
  labels: ReturnType<typeof languageConfig>,
  isLast: boolean,
) {
  const content = renderVariantFrame(frame, labels);
  return `
\\noindent
\\begin{minipage}[t]{0.485\\textwidth}
\\vspace{0pt}
${content}
\\end{minipage}
\\hfill
\\begin{minipage}[t]{0.485\\textwidth}
\\vspace{0pt}
${content}
\\end{minipage}
${isLast ? "" : "\\newpage"}
`;
}

export function renderWorkTwoDuplicateLandscapeLatex(doc: PrintableWorkDocument): string {
  const labels = languageConfig(doc.locale);
  const frames = doc.variants.flatMap((variant) => paginateVariantFrames(variant));
  const sheets = frames
    .map((frame, index, arr) => renderSheet(frame, labels, index === arr.length - 1))
    .join("\n");

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
${sheets}
\end{document}
`;
}

export function renderWorkTwoDuplicateLandscapeLatexWithMeasurements(
  doc: PrintableWorkDocument,
  measuredHeightsPt?: Map<string, number>,
): string {
  const labels = languageConfig(doc.locale);
  const frames = doc.variants.flatMap((variant) => paginateVariantFrames(variant, measuredHeightsPt));
  const sheets = frames
    .map((frame, index, arr) => renderSheet(frame, labels, index === arr.length - 1))
    .join("\n");

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
${sheets}
\end{document}
`;
}
