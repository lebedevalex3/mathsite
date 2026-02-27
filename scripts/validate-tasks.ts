import path from "node:path";
import { promises as fs } from "node:fs";

import { loadTaskBanks } from "../lib/tasks/load";
import { parseTaxonomyMarkdown } from "../lib/tasks/taxonomy";
import { analyzeLatexTaskMarkdownCompatibility } from "../src/lib/latex/task-latex-compat";

function rel(filePath: string) {
  return path.relative(process.cwd(), filePath) || filePath;
}

async function loadTaxonomies() {
  const docsDir = path.join(process.cwd(), "docs");
  const entries = await fs.readdir(docsDir, { withFileTypes: true });
  const taxonomyFiles = entries
    .filter((entry) => entry.isFile() && /^TAXONOMY.*\.md$/i.test(entry.name))
    .map((entry) => path.join(docsDir, entry.name))
    .sort();

  const items = await Promise.all(
    taxonomyFiles.map(async (filePath) => ({ filePath, parsed: await parseTaxonomyMarkdown(filePath) })),
  );

  const byTopicId = new Map<string, { filePath: string; allowedSkillIds: Set<string> }>();
  for (const item of items) {
    if (byTopicId.has(item.parsed.topicId)) {
      const previous = byTopicId.get(item.parsed.topicId)!;
      throw new Error(
        `Duplicate taxonomy topic_id "${item.parsed.topicId}" in ${rel(item.filePath)} and ${rel(previous.filePath)}`,
      );
    }
    byTopicId.set(item.parsed.topicId, {
      filePath: item.filePath,
      allowedSkillIds: item.parsed.allowedSkillIds,
    });
  }

  return { files: taxonomyFiles, byTopicId };
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const latexWarn = args.has("--latex-warn");

  const rootDir = path.join(process.cwd(), "data", "tasks");
  const taxonomies = await loadTaxonomies();
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

    const taxonomy = taxonomies.byTopicId.get(task.topic_id);
    if (!taxonomy) {
      validationErrors.push(
        `${rel(filePath)} | ${task.id} | no taxonomy found for topic_id "${task.topic_id}"`,
      );
      continue;
    }

    if (!taxonomy.allowedSkillIds.has(task.skill_id)) {
      validationErrors.push(
        `${rel(filePath)} | ${task.id} | skill_id not in ${rel(taxonomy.filePath)}: "${task.skill_id}"`,
      );
    }
  }

  for (const { filePath, bank } of banks) {
    const taxonomy = taxonomies.byTopicId.get(bank.topic_id);
    if (!taxonomy) {
      validationErrors.push(
        `${rel(filePath)} | bank.topic_id "${bank.topic_id}" has no matching taxonomy file`,
      );
    }

    for (const task of bank.tasks) {
      if (task.topic_id !== bank.topic_id) {
        validationErrors.push(
          `${rel(filePath)} | ${task.id} | task.topic_id "${task.topic_id}" must match bank.topic_id "${bank.topic_id}"`,
        );
      }
    }
  }

  const totalErrors = [
    ...errors.map((e) => `${rel(e.filePath)}: ${e.message}`),
    ...validationErrors,
  ];
  const uniqueSkills = new Set(allTasks.map(({ task }) => task.skill_id));

  console.log("Task bank validation summary");
  console.log(`- Taxonomy files: ${taxonomies.files.length}`);
  console.log(`- Taxonomy topics: ${taxonomies.byTopicId.size}`);
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
