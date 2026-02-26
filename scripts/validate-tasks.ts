import path from "node:path";

import { loadTaskBanks } from "../lib/tasks/load";
import { parseTaxonomyMarkdown } from "../lib/tasks/taxonomy";
import { analyzeLatexTaskMarkdownCompatibility } from "../src/lib/latex/task-latex-compat";

function rel(filePath: string) {
  return path.relative(process.cwd(), filePath) || filePath;
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const latexWarn = args.has("--latex-warn");

  const rootDir = path.join(process.cwd(), "data", "tasks");
  const taxonomyPath = path.join(process.cwd(), "docs", "TAXONOMY.md");
  const taxonomy = await parseTaxonomyMarkdown(taxonomyPath);
  const { files, banks, errors } = await loadTaskBanks(rootDir);

  const allTasks = banks.flatMap(({ filePath, bank }) =>
    bank.tasks.map((task) => ({ filePath, task })),
  );

  const validationErrors: string[] = [];
  const latexWarnings: string[] = [];
  const seenTaskIds = new Map<string, string>();

  for (const { filePath, task } of allTasks) {
    const previous = seenTaskIds.get(task.id);
    if (previous) {
      validationErrors.push(
        `Duplicate task.id "${task.id}" in ${rel(filePath)} (already used in ${rel(previous)})`,
      );
    } else {
      seenTaskIds.set(task.id, filePath);
    }

    if (!Number.isInteger(task.difficulty) || task.difficulty < 1 || task.difficulty > 5) {
      validationErrors.push(
        `Invalid difficulty for ${task.id} in ${rel(filePath)}: ${task.difficulty}`,
      );
    }

    if (task.statement_md.trim().length === 0) {
      validationErrors.push(`Empty statement_md for ${task.id} in ${rel(filePath)}`);
    }

    if (latexWarn) {
      const report = analyzeLatexTaskMarkdownCompatibility(task.statement_md);
      if (!report.compatible) {
        const codes = report.issues.map((issue) => issue.code).join(", ");
        latexWarnings.push(
          `${rel(filePath)} | ${task.id} | latex-compat warnings: ${codes}`,
        );
      }
    }

    if (task.topic_id !== taxonomy.topicId) {
      validationErrors.push(
        `${rel(filePath)} | ${task.id} | topic_id mismatch: "${task.topic_id}" (expected "${taxonomy.topicId}")`,
      );
    }

    if (!taxonomy.allowedSkillIds.has(task.skill_id)) {
      validationErrors.push(
        `${rel(filePath)} | ${task.id} | skill_id not in docs/TAXONOMY.md: "${task.skill_id}"`,
      );
    }
  }

  const totalErrors = [
    ...errors.map((e) => `${rel(e.filePath)}: ${e.message}`),
    ...validationErrors,
  ];
  const uniqueSkills = new Set(allTasks.map(({ task }) => task.skill_id));

  console.log("Task bank validation summary");
  console.log(`- Taxonomy topic_id: ${taxonomy.topicId}`);
  console.log(`- Taxonomy allowed skill_id count: ${taxonomy.allowedSkillIds.size}`);
  console.log(`- JSON files found: ${files.length}`);
  console.log(`- Valid files: ${banks.length}`);
  console.log(`- Tasks checked: ${allTasks.length}`);
  console.log(`- Unique skills: ${uniqueSkills.size}`);
  if (latexWarn) {
    console.log(`- LaTeX compatibility warnings: ${latexWarnings.length}`);
  }

  if (totalErrors.length > 0) {
    console.error(`- Errors: ${totalErrors.length}`);
    for (const message of totalErrors) {
      console.error(`  * ${message}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log("- Errors: 0");
  if (latexWarn && latexWarnings.length > 0) {
    console.warn("LaTeX compatibility warnings (warn-only)");
    for (const message of latexWarnings) {
      console.warn(`  - ${message}`);
    }
  }
  console.log("OK");
}

main().catch((error) => {
  console.error("Task bank validation failed with unexpected error.");
  console.error(error);
  process.exitCode = 1;
});
