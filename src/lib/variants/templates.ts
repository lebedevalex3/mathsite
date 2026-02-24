import { promises as fs } from "node:fs";
import path from "node:path";

import { getTasksForTopic } from "@/lib/tasks/query";

import { getProporciiSkillMap } from "./catalog";
import type { VariantTemplate } from "./types";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isDifficultyRange(value: unknown): value is [number, number] {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    Number.isInteger(value[0]) &&
    Number.isInteger(value[1]) &&
    value[0] >= 1 &&
    value[1] <= 5 &&
    value[0] <= value[1]
  );
}

function parseTemplate(raw: unknown, filePath: string): VariantTemplate {
  if (!isObject(raw)) throw new Error(`Template must be object: ${filePath}`);

  const sectionsRaw = raw.sections;
  const headerRaw = raw.header;

  if (!Array.isArray(sectionsRaw) || sectionsRaw.length === 0) {
    throw new Error(`Template sections must be non-empty array: ${filePath}`);
  }
  if (!isObject(headerRaw)) {
    throw new Error(`Template header must be object: ${filePath}`);
  }

  const template: VariantTemplate = {
    id: typeof raw.id === "string" ? raw.id : "",
    title: typeof raw.title === "string" ? raw.title : "",
    topicId: typeof raw.topicId === "string" ? raw.topicId : "",
    sections: sectionsRaw.map((section, index) => {
      if (!isObject(section)) {
        throw new Error(`Section #${index + 1} must be object: ${filePath}`);
      }
      const skillIds = Array.isArray(section.skillIds)
        ? section.skillIds.filter((value): value is string => typeof value === "string")
        : [];

      if (
        typeof section.label !== "string" ||
        section.label.trim().length === 0 ||
        skillIds.length === 0 ||
        typeof section.count !== "number" ||
        !Number.isInteger(section.count) ||
        section.count <= 0 ||
        !isDifficultyRange(section.difficulty)
      ) {
        throw new Error(`Invalid section #${index + 1}: ${filePath}`);
      }

      return {
        label: section.label,
        skillIds,
        count: section.count,
        difficulty: section.difficulty,
      };
    }),
    header: {
      gradeLabel: typeof headerRaw.gradeLabel === "string" ? headerRaw.gradeLabel : "",
      topicLabel: typeof headerRaw.topicLabel === "string" ? headerRaw.topicLabel : "",
    },
  };

  if (!template.id || !template.title || !template.topicId) {
    throw new Error(`Template id/title/topicId are required: ${filePath}`);
  }
  if (!template.header.gradeLabel || !template.header.topicLabel) {
    throw new Error(`Template header labels are required: ${filePath}`);
  }

  return template;
}

async function readTemplateFile(filePath: string) {
  const raw = await fs.readFile(filePath, "utf8");
  return parseTemplate(JSON.parse(raw) as unknown, filePath);
}

function templateDirForTopic(topicId: string) {
  if (topicId !== "g5.proporcii") {
    throw new Error(`Unsupported topic for templates: ${topicId}`);
  }
  return path.join(process.cwd(), "templates", "variants", "g5", "proporcii");
}

export async function listVariantTemplates(topicId: string): Promise<VariantTemplate[]> {
  const dirPath = templateDirForTopic(topicId);
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => path.join(dirPath, entry.name))
    .sort();

  const templates = await Promise.all(files.map(readTemplateFile));
  await validateTemplates(topicId, templates);
  return templates;
}

export async function getVariantTemplateById(topicId: string, templateId: string) {
  const templates = await listVariantTemplates(topicId);
  return templates.find((template) => template.id === templateId) ?? null;
}

export async function validateTemplates(topicId: string, templates: VariantTemplate[]) {
  const skillMap = getProporciiSkillMap();
  const { tasks, errors } = await getTasksForTopic(topicId);
  if (errors.length > 0) {
    throw new Error(`Task bank errors: ${errors[0]}`);
  }
  const taskBankSkillIds = new Set(tasks.map((task) => task.skill_id));

  for (const template of templates) {
    if (template.topicId !== topicId) {
      throw new Error(`Template ${template.id} topicId mismatch: ${template.topicId}`);
    }

    for (const section of template.sections) {
      for (const skillId of section.skillIds) {
        if (!skillMap.has(skillId)) {
          throw new Error(`Template ${template.id}: unknown taxonomy skill ${skillId}`);
        }
        if (!taskBankSkillIds.has(skillId)) {
          throw new Error(`Template ${template.id}: skill not found in task bank ${skillId}`);
        }
      }
    }
  }
}
