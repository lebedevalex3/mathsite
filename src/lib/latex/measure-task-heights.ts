import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { markdownTaskToLatex } from "@/src/lib/latex/task-markdown-to-latex";
import type { PrintableWorkDocument } from "@/src/lib/variants/printable-work";

const MEASURE_MARKER = "MSH";

function runCommand(
  command: string,
  args: string[],
  cwd: string,
): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", reject);
    child.on("close", (code) => resolve({ code, stdout, stderr }));
  });
}

function languageName(locale: PrintableWorkDocument["locale"]) {
  if (locale === "de") return "german";
  if (locale === "en") return "english";
  return "russian";
}

function taskMeasureKey(variantId: string, orderIndex: number) {
  return `${variantId}:${orderIndex}`;
}

function isDenseVariant(variant: PrintableWorkDocument["variants"][number]) {
  return variant.tasks.some((task) => task.print.complexity === "long") || variant.tasksCount >= 10;
}

function buildMeasureDocument(doc: PrintableWorkDocument) {
  const main = languageName(doc.locale);
  const body = doc.variants
    .flatMap((variant) => {
      const sizeCommand = isDenseVariant(variant) ? "\\small" : "\\normalsize";
      return variant.tasks.map((task) => {
        const key = taskMeasureKey(variant.variantId, task.orderIndex);
        const content = markdownTaskToLatex(task.statementMd);
        return `
\\setbox\\msbox=\\vbox{
  \\hsize=0.485\\textwidth
  ${sizeCommand}
  \\raggedright
  ${content}
}
\\typeout{${MEASURE_MARKER}|${key}|\\the\\dimexpr\\ht\\msbox+\\dp\\msbox\\relax}
`;
      });
    })
    .join("\n");

  return String.raw`\documentclass[10pt]{article}
\usepackage[a4paper,landscape,margin=10mm]{geometry}
\usepackage{fontspec}
\usepackage{polyglossia}
\setmainlanguage{${main}}
\setmainfont{DejaVu Serif}
\usepackage{amsmath,amssymb}
\pagestyle{empty}
\setlength{\parindent}{0pt}
\setlength{\parskip}{0pt}
\newbox\msbox
\begin{document}
${body}
\end{document}
`;
}

function parsePtValue(input: string): number | null {
  const match = input.trim().match(/^(-?\d+(?:\.\d+)?)pt$/);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

function parseMeasureOutput(stdout: string, stderr: string) {
  const out = new Map<string, number>();
  const lines = `${stdout}\n${stderr}`.split(/\r?\n/);
  for (const line of lines) {
    const markerIdx = line.indexOf(`${MEASURE_MARKER}|`);
    if (markerIdx < 0) continue;
    const payload = line.slice(markerIdx).trim();
    const parts = payload.split("|");
    if (parts.length < 3) continue;
    const key = parts[1];
    const value = parsePtValue(parts.slice(2).join("|"));
    if (!key || value === null) continue;
    out.set(key, value);
  }
  return out;
}

export async function measureWorkTaskHeightsPt(
  doc: PrintableWorkDocument,
): Promise<Map<string, number> | null> {
  if (process.env.LATEX_PDF_ENABLED !== "1") return null;

  const workDir = await mkdtemp(join(tmpdir(), "mathsite-latex-measure-"));
  const texFilename = "measure.tex";
  const texPath = join(workDir, texFilename);
  try {
    await writeFile(texPath, buildMeasureDocument(doc), "utf8");

    const xelatexBin = process.env.XELATEX_BIN || "xelatex";
    const result = await runCommand(
      xelatexBin,
      ["-interaction=nonstopmode", "-halt-on-error", texFilename],
      workDir,
    );

    // Even if xelatex exits non-zero, try to parse any emitted measurements.
    let parsed = parseMeasureOutput(result.stdout, result.stderr);
    if (parsed.size === 0) {
      try {
        const log = await readFile(join(workDir, "measure.log"), "utf8");
        parsed = parseMeasureOutput(log, "");
      } catch {
        // ignore missing log
      }
    }

    if (parsed.size === 0) {
      if (process.env.NODE_ENV !== "production") {
        console.warn({
          event: "latex_measure_failed",
          code: result.code,
          stderrTail: result.stderr.split(/\r?\n/).slice(-10),
        });
      }
      return null;
    }

    return parsed;
  } catch {
    return null;
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}

export function getTaskMeasureKey(variantId: string, orderIndex: number) {
  return taskMeasureKey(variantId, orderIndex);
}
