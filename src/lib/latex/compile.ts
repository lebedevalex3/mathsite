import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";

export class LatexUnavailableError extends Error {
  status = 501;
  code = "LATEX_UNAVAILABLE";
  constructor(message = "LaTeX PDF backend is unavailable in this environment.") {
    super(message);
  }
}

export class LatexCompileError extends Error {
  status = 500;
  code = "LATEX_COMPILE_ERROR";
  details?: string[];
  constructor(message = "Failed to compile LaTeX document.", details?: string[]) {
    super(message);
    this.details = details;
  }
}

function isLatexEnabled() {
  return process.env.LATEX_PDF_ENABLED === "1";
}

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

function tailLines(input: string, count = 30) {
  return input
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .slice(-count);
}

async function compileWithLatexmk(texPath: string, cwd: string) {
  const bin = process.env.LATEXMK_BIN || "latexmk";
  return runCommand(
    bin,
    // Use latexmk's XeLaTeX PDF mode explicitly. `-pdf` can force pdflatex and
    // conflict with `fontspec`-based templates.
    ["-pdfxe", "-interaction=nonstopmode", "-halt-on-error", texPath],
    cwd,
  );
}

async function compileWithXelatex(texPath: string, cwd: string) {
  const bin = process.env.XELATEX_BIN || "xelatex";
  // Two passes are often enough for references/math layout. PoC keeps it simple.
  const first = await runCommand(bin, ["-interaction=nonstopmode", "-halt-on-error", texPath], cwd);
  if (first.code !== 0) return first;
  return runCommand(bin, ["-interaction=nonstopmode", "-halt-on-error", texPath], cwd);
}

export async function compileLatexToPdf(texSource: string): Promise<Uint8Array> {
  if (!isLatexEnabled()) {
    throw new LatexUnavailableError("LaTeX PDF backend is disabled. Set LATEX_PDF_ENABLED=1.");
  }

  const workDir = await mkdtemp(join(tmpdir(), "mathsite-latex-"));
  const texFilename = "document.tex";
  const texPath = join(workDir, texFilename);
  const pdfPath = join(workDir, "document.pdf");

  try {
    await writeFile(texPath, texSource, "utf8");

    let result;
    try {
      result = await compileWithLatexmk(texFilename, workDir);
    } catch {
      result = await compileWithXelatex(texFilename, workDir);
    }

    if (result.code !== 0) {
      let logTail: string[] = [];
      try {
        const latexLog = await readFile(join(workDir, "document.log"), "utf8");
        logTail = tailLines(latexLog, 40);
      } catch {
        // ignore missing log file
      }
      const streamTail = tailLines(`${result.stderr}\n${result.stdout}`, 25);
      const details = [...streamTail, ...(logTail.length ? ["--- document.log ---", ...logTail] : [])].slice(
        -60,
      );
      if (process.env.NODE_ENV !== "production" && details.length) {
        console.error({
          event: "latex_compile_error",
          details,
        });
      }
      const msg = process.env.NODE_ENV === "production"
        ? "Failed to compile LaTeX document."
        : `Failed to compile LaTeX document: ${(result.stderr || result.stdout).slice(0, 500)}`;
      throw new LatexCompileError(msg, process.env.NODE_ENV !== "production" ? details : undefined);
    }

    const pdf = await readFile(pdfPath);
    return new Uint8Array(pdf);
  } catch (error) {
    if (error instanceof LatexUnavailableError || error instanceof LatexCompileError) {
      throw error;
    }
    if (error instanceof Error && /ENOENT/.test(error.message)) {
      throw new LatexUnavailableError(
        "LaTeX toolchain not found. Install latexmk/xelatex and enable LATEX_PDF_ENABLED=1.",
      );
    }
    throw error;
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}
