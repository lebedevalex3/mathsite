import { promises as fs } from "node:fs";
import path from "node:path";

import { getTasksForTopic } from "@/lib/tasks/query";

import { getProporciiSkillMap } from "./catalog";
import { validateTemplate } from "./templateSchema";
import type { VariantTemplate } from "./types";

async function readTemplateFile(filePath: string) {
  const raw = await fs.readFile(filePath, "utf8");
  return validateTemplate(JSON.parse(raw) as unknown, filePath);
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
