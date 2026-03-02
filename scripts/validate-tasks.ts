import path from "node:path";
import { promises as fs } from "node:fs";

import { loadTaskBanks } from "../lib/tasks/load";
import { parseTaxonomyMarkdownDetails } from "../lib/tasks/taxonomy";
import { analyzeLatexTaskMarkdownCompatibility } from "../src/lib/latex/task-latex-compat";
import { resolveCoverageRule } from "./task-coverage.config";

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
    taxonomyFiles.map(async (filePath) => ({
      filePath,
      parsed: await parseTaxonomyMarkdownDetails(filePath),
    })),
  );

  const byTopicId = new Map<string, { filePath: string; allowedSkillIds: Set<string>; skillIds: string[] }>();
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
      skillIds: item.parsed.skills.map((entry) => entry.skillId),
    });
  }

  return { files: taxonomyFiles, byTopicId };
}

type CoverageCell = {
  difficulty: number;
  count: number;
  minRequired: number;
  ok: boolean;
};

type CoverageSkill = {
  skillId: string;
  ruleSource: "skill" | "topic" | "default";
  requiredDifficulties: number[];
  minTasksPerCell: number;
  total: number;
  cells: CoverageCell[];
};

type CoverageTopic = {
  topicId: string;
  taxonomyFilePath: string;
  totalTasks: number;
  skills: CoverageSkill[];
};

type CoverageDeficit = {
  topicId: string;
  skillId: string;
  difficulty: number;
  actual: number;
  required: number;
};

type CoverageReport = {
  generatedAt: string;
  topics: CoverageTopic[];
  deficits: CoverageDeficit[];
  summary: {
    topics: number;
    skills: number;
    cells: number;
    deficits: number;
  };
};

function buildCoverageReport(params: {
  allTasks: { filePath: string; task: { topic_id: string; skill_id: string; difficulty: number } }[];
  taxonomiesByTopicId: Map<string, { filePath: string; skillIds: string[] }>;
}): CoverageReport {
  const countsByTopicSkillDifficulty = new Map<string, number>();
  const totalByTopic = new Map<string, number>();

  for (const { task } of params.allTasks) {
    const key = `${task.topic_id}|${task.skill_id}|${task.difficulty}`;
    countsByTopicSkillDifficulty.set(key, (countsByTopicSkillDifficulty.get(key) ?? 0) + 1);
    totalByTopic.set(task.topic_id, (totalByTopic.get(task.topic_id) ?? 0) + 1);
  }

  const deficits: CoverageDeficit[] = [];
  const topics: CoverageTopic[] = [];
  let skillCount = 0;
  let cellCount = 0;

  const sortedTaxonomies = [...params.taxonomiesByTopicId.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  for (const [topicId, taxonomy] of sortedTaxonomies) {
    const skills: CoverageSkill[] = [];

    for (const skillId of taxonomy.skillIds) {
      const rule = resolveCoverageRule(topicId, skillId);
      const cells: CoverageCell[] = [];
      let total = 0;

      for (const difficulty of rule.requiredDifficulties) {
        const key = `${topicId}|${skillId}|${difficulty}`;
        const count = countsByTopicSkillDifficulty.get(key) ?? 0;
        const ok = count >= rule.minTasksPerCell;
        if (!ok) {
          deficits.push({
            topicId,
            skillId,
            difficulty,
            actual: count,
            required: rule.minTasksPerCell,
          });
        }
        cells.push({
          difficulty,
          count,
          minRequired: rule.minTasksPerCell,
          ok,
        });
        total += count;
      }

      skills.push({
        skillId,
        ruleSource: rule.source,
        requiredDifficulties: rule.requiredDifficulties,
        minTasksPerCell: rule.minTasksPerCell,
        total,
        cells,
      });
      skillCount += 1;
      cellCount += cells.length;
    }

    topics.push({
      topicId,
      taxonomyFilePath: rel(taxonomy.filePath),
      totalTasks: totalByTopic.get(topicId) ?? 0,
      skills,
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    topics,
    deficits,
    summary: {
      topics: topics.length,
      skills: skillCount,
      cells: cellCount,
      deficits: deficits.length,
    },
  };
}

async function writeCoverageReports(report: CoverageReport) {
  const reportsDir = path.join(process.cwd(), "reports");
  const jsonPath = path.join(reportsDir, "task-coverage-matrix.json");
  const mdPath = path.join(reportsDir, "task-coverage-matrix.md");
  await fs.mkdir(reportsDir, { recursive: true });
  await fs.writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  const lines: string[] = [];
  lines.push("# Task Coverage Matrix");
  lines.push("");
  lines.push(`Generated at: ${report.generatedAt}`);
  lines.push("");
  lines.push(
    `Summary: topics=${report.summary.topics}, skills=${report.summary.skills}, cells=${report.summary.cells}, deficits=${report.summary.deficits}`,
  );
  lines.push("");

  for (const topic of report.topics) {
    lines.push(`## ${topic.topicId}`);
    lines.push("");
    lines.push(`- Taxonomy: \`${topic.taxonomyFilePath}\``);
    lines.push("- Coverage rule priority: `skill_id -> topic_id -> default`");
    lines.push(`- Total tasks in topic: \`${topic.totalTasks}\``);
    lines.push("");

    const topicDifficulties = [...new Set(topic.skills.flatMap((skill) => skill.requiredDifficulties))].sort(
      (a, b) => a - b,
    );
    const headers = [
      "skill_id",
      "rule_source",
      "required_difficulties",
      "min_per_cell",
      ...topicDifficulties.map((value) => `d${value}`),
      "total",
    ];
    lines.push(`| ${headers.join(" | ")} |`);
    lines.push(`| ${headers.map(() => "---").join(" | ")} |`);

    for (const skill of topic.skills) {
      const cellByDifficulty = new Map(skill.cells.map((cell) => [cell.difficulty, cell]));
      const difficultyCells = topicDifficulties.map((difficulty) => {
        const cell = cellByDifficulty.get(difficulty);
        if (!cell) return "—";
        return cell.ok ? `${cell.count}` : `${cell.count} ⚠`;
      });
      lines.push(
        `| ${skill.skillId} | ${skill.ruleSource} | ${skill.requiredDifficulties.join(",")} | ${skill.minTasksPerCell} | ${difficultyCells.join(" | ")} | ${skill.total} |`,
      );
    }
    lines.push("");
  }

  lines.push("## Deficits");
  lines.push("");
  if (report.deficits.length === 0) {
    lines.push("No deficits.");
  } else {
    for (const deficit of report.deficits) {
      lines.push(
        `- ${deficit.topicId} | ${deficit.skillId} | difficulty=${deficit.difficulty} | actual=${deficit.actual} | required=${deficit.required}`,
      );
    }
  }
  lines.push("");

  await fs.writeFile(mdPath, `${lines.join("\n")}`, "utf8");
  return {
    jsonPath: rel(jsonPath),
    mdPath: rel(mdPath),
  };
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

  const coverageReport = buildCoverageReport({
    allTasks,
    taxonomiesByTopicId: new Map(
      [...taxonomies.byTopicId.entries()].map(([topicId, item]) => [
        topicId,
        { filePath: item.filePath, skillIds: item.skillIds },
      ]),
    ),
  });
  for (const deficit of coverageReport.deficits) {
    validationErrors.push(
      `coverage deficit | topic=${deficit.topicId} | skill=${deficit.skillId} | difficulty=${deficit.difficulty} | actual=${deficit.actual} | required>=${deficit.required}`,
    );
  }
  const coveragePaths = await writeCoverageReports(coverageReport);

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
  console.log(`- Coverage cells checked: ${coverageReport.summary.cells}`);
  console.log(`- Coverage deficits: ${coverageReport.summary.deficits}`);
  console.log(`- Coverage report (json): ${coveragePaths.jsonPath}`);
  console.log(`- Coverage report (md): ${coveragePaths.mdPath}`);

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
