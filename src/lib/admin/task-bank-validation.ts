import path from "node:path";
import { promises as fs } from "node:fs";

import type { LoadedTaskBank, TaskLoadError } from "@/lib/tasks/load";
import type { DifficultyBand } from "@/lib/tasks/difficulty-band";
import type { Task } from "@/lib/tasks/schema";
import { parseTaxonomyMarkdownDetails } from "@/lib/tasks/taxonomy";
import { listTeacherToolsTopics } from "@/src/lib/teacher-tools/catalog";
import { MODERN_TOPICS, validateTopicSkillEdges } from "@/src/lib/teacher-tools/skill-edges";
import { analyzeLatexTaskMarkdownCompatibility } from "@/src/lib/latex/task-latex-compat";
import { resolveCoverageRule } from "@/scripts/task-coverage.config";

type TaxonomyInfo = Awaited<ReturnType<typeof parseTaxonomyMarkdownDetails>> & {
  filePath: string;
};

export class TaskBankValidationError extends Error {
  code = "TASK_BANK_VALIDATION_FAILED" as const;

  constructor(
    public readonly details: {
      errors: string[];
      warnings: string[];
    },
  ) {
    super(details.errors[0] ?? "Task bank validation failed.");
  }
}

export type TaskBankValidationResult = {
  errors: string[];
  warnings: string[];
};

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

  return new Map<string, TaxonomyInfo>(
    items.map((item) => [item.parsed.topicId, { ...item.parsed, filePath: item.filePath }] as const),
  );
}

function buildCoverageDeficits(params: {
  allTasks: Array<{ filePath: string; task: Task }>;
  taxonomiesByTopicId: Map<string, TaxonomyInfo>;
}) {
  const countsByTopicSkillBand = new Map<string, number>();

  for (const { task } of params.allTasks) {
    const band = task.difficulty_band as DifficultyBand;
    const key = `${task.topic_id}|${task.skill_id}|${band}`;
    countsByTopicSkillBand.set(key, (countsByTopicSkillBand.get(key) ?? 0) + 1);
  }

  const deficits: string[] = [];
  for (const [topicId, taxonomy] of params.taxonomiesByTopicId.entries()) {
    for (const skillId of taxonomy.skills.map((entry) => entry.skillId)) {
      const rule = resolveCoverageRule(topicId, skillId);
      for (const band of rule.requiredBands) {
        const key = `${topicId}|${skillId}|${band}`;
        const count = countsByTopicSkillBand.get(key) ?? 0;
        if (count < rule.minTasksPerCell) {
          deficits.push(
            `coverage deficit | topic=${topicId} | skill=${skillId} | band=${band} | actual=${count} | required>=${rule.minTasksPerCell}`,
          );
        }
      }
    }
  }

  return deficits;
}

export async function validateTaskBankState(params: {
  banks: LoadedTaskBank[];
  loadErrors?: TaskLoadError[];
  latexWarn?: boolean;
}): Promise<TaskBankValidationResult> {
  const taxonomiesByTopicId = await loadTaxonomies();
  const teacherTopicsById = new Map(listTeacherToolsTopics().map((topic) => [topic.topicId, topic]));
  const validationErrors: string[] = [];
  const validationWarnings: string[] = [];
  const seenTaskIds = new Map<string, string>();
  const allTasks = params.banks.flatMap(({ filePath, bank }) =>
    bank.tasks.map((task) => ({ filePath, task })),
  );

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

    if (params.latexWarn) {
      const report = analyzeLatexTaskMarkdownCompatibility(task.statement_md);
      if (!report.compatible) {
        const codes = report.issues.map((issue) => issue.code).join(", ");
        validationWarnings.push(
          `${rel(filePath)} | ${task.id} | latex-compat warnings: ${codes}`,
        );
      }
    }

    const taxonomy = taxonomiesByTopicId.get(task.topic_id);
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
      continue;
    }

    const branchId = taxonomy.skillToBranchId.get(task.skill_id);
    if (!branchId) {
      validationErrors.push(
        `${rel(filePath)} | ${task.id} | no branch mapping for skill_id "${task.skill_id}" in ${rel(
          taxonomy.filePath,
        )}`,
      );
      continue;
    }

    if (!taxonomy.branchIds.has(branchId)) {
      validationErrors.push(
        `${rel(filePath)} | ${task.id} | mapped branch_id "${branchId}" is not declared in ${rel(
          taxonomy.filePath,
        )}`,
      );
    }
  }

  for (const { filePath, bank } of params.banks) {
    const taxonomy = taxonomiesByTopicId.get(bank.topic_id);
    if (!taxonomy) {
      validationErrors.push(
        `${rel(filePath)} | bank.topic_id "${bank.topic_id}" has no matching taxonomy file`,
      );
      continue;
    }

    if (bank.section_id !== taxonomy.sectionId) {
      validationErrors.push(
        `${rel(filePath)} | bank.section_id "${bank.section_id}" must match taxonomy section_id "${taxonomy.sectionId}"`,
      );
    }
    if (bank.module_id !== taxonomy.moduleId) {
      validationErrors.push(
        `${rel(filePath)} | bank.module_id "${bank.module_id}" must match taxonomy module_id "${taxonomy.moduleId}"`,
      );
    }

    const bankGrades = [...new Set(bank.grade_tags)].sort((a, b) => a - b);
    const taxonomyGrades = [...new Set(taxonomy.gradeTags)].sort((a, b) => a - b);
    if (bankGrades.join(",") !== taxonomyGrades.join(",")) {
      validationErrors.push(
        `${rel(filePath)} | bank.grade_tags "${bankGrades.join(",")}" must match taxonomy grade_tags "${taxonomyGrades.join(",")}"`,
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

  for (const [topicId, taxonomy] of taxonomiesByTopicId.entries()) {
    const edgeValidation = validateTopicSkillEdges({
      topicId,
      taxonomySkillIds: taxonomy.allowedSkillIds,
    });
    for (const warning of edgeValidation.warnings) {
      validationWarnings.push(`skill edges warning | topic=${topicId} | ${warning}`);
    }
    if (edgeValidation.errors.length > 0) {
      const bucket = MODERN_TOPICS.has(topicId) ? validationErrors : validationWarnings;
      for (const error of edgeValidation.errors) {
        bucket.push(`skill edges invalid | topic=${topicId} | ${error}`);
      }
    }

    const topicConfig = teacherTopicsById.get(topicId);
    if (!topicConfig) continue;
    const missingKinds = topicConfig.skills
      .filter((skill) => skill.kind == null)
      .map((skill) => skill.id);
    if (missingKinds.length === 0) continue;
    const message = `skill.kind missing | topic=${topicId} | skills=${missingKinds.join(",")}`;
    if (MODERN_TOPICS.has(topicId)) {
      validationErrors.push(message);
    } else {
      validationWarnings.push(message);
    }
  }

  validationErrors.push(
    ...buildCoverageDeficits({
      allTasks,
      taxonomiesByTopicId,
    }),
  );

  return {
    errors: [
      ...(params.loadErrors ?? []).map((error) => `${rel(error.filePath)}: ${error.message}`),
      ...validationErrors,
    ],
    warnings: validationWarnings,
  };
}

export async function assertValidTaskBankState(params: {
  banks: LoadedTaskBank[];
  loadErrors?: TaskLoadError[];
  latexWarn?: boolean;
}) {
  const result = await validateTaskBankState(params);
  if (result.errors.length > 0) {
    throw new TaskBankValidationError({
      errors: result.errors,
      warnings: result.warnings,
    });
  }
  return result;
}
