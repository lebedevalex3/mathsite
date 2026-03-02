import { promises as fs } from "node:fs";

export type ParsedTaxonomy = {
  topicId: string;
  allowedSkillIds: Set<string>;
};

export type TaxonomySkillEntry = {
  skillId: string;
  description: string;
  branchId?: string;
};

export type ParsedTaxonomyDetails = ParsedTaxonomy & {
  sectionId: string;
  moduleId: string;
  gradeTags: number[];
  branchIds: Set<string>;
  skillToBranchId: Map<string, string>;
  skills: TaxonomySkillEntry[];
};

function parseTopicId(text: string, filePath: string) {
  const topicMatch = text.match(/^- `topic_id`: `([^`]+)`/m);
  if (!topicMatch) {
    throw new Error(`Could not extract topic_id from ${filePath}`);
  }
  return topicMatch[1];
}

function parseField(text: string, key: string, filePath: string) {
  const fieldMatch = text.match(new RegExp(`^- \`${key}\`: \`([^\\\`]+)\``, "m"));
  if (!fieldMatch) {
    throw new Error(`Could not extract ${key} from ${filePath}`);
  }
  return fieldMatch[1].trim();
}

function parseGradeTags(text: string, filePath: string) {
  const raw = parseField(text, "grade_tags", filePath);
  const values = raw
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isInteger(value) && value >= 1 && value <= 11);
  const uniqueSorted = [...new Set(values)].sort((a, b) => a - b);
  if (uniqueSorted.length === 0) {
    throw new Error(`Could not extract valid grade_tags from ${filePath}`);
  }
  return uniqueSorted;
}

export function parseTaxonomyMarkdownText(
  text: string,
  filePathForErrors = "TAXONOMY.md",
): ParsedTaxonomyDetails {
  const topicId = parseTopicId(text, filePathForErrors);
  const sectionId = parseField(text, "section_id", filePathForErrors);
  const moduleId = parseField(text, "module_id", filePathForErrors);
  const gradeTags = parseGradeTags(text, filePathForErrors);
  const skills: TaxonomySkillEntry[] = [];
  const allowedSkillIds = new Set<string>();
  const branchIds = new Set<string>();
  const skillToBranchId = new Map<string, string>();

  for (const line of text.split(/\r?\n/)) {
    const branchMatch = line.match(
      /^- `(?:branch_id|subtopic_id)`: `([a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+)`/,
    );
    if (!branchMatch) continue;
    branchIds.add(branchMatch[1]);
  }

  for (const line of text.split(/\r?\n/)) {
    const skillMatch = line.match(
      /^- `([a-z][a-z0-9_]*\.[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*)`\s+—\s+(.+)$/,
    );
    if (!skillMatch) continue;

    const skillId = skillMatch[1];
    const description = skillMatch[2].trim();
    allowedSkillIds.add(skillId);
    skills.push({ skillId, description, branchId: undefined });
  }

  for (const line of text.split(/\r?\n/)) {
    const mappingMatch = line.match(
      /^- `([a-z][a-z0-9_]*\.[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*)`\s*->\s*`([a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+)`$/,
    );
    if (!mappingMatch) continue;
    const skillId = mappingMatch[1];
    const branchId = mappingMatch[2];
    if (!allowedSkillIds.has(skillId)) {
      throw new Error(`skill->branch mapping uses unknown skill_id "${skillId}" in ${filePathForErrors}`);
    }
    skillToBranchId.set(skillId, branchId);
    branchIds.add(branchId);
  }

  for (const skill of skills) {
    const branchId = skillToBranchId.get(skill.skillId);
    if (branchId) {
      skill.branchId = branchId;
    }
  }

  if (allowedSkillIds.size === 0) {
    throw new Error(`Could not extract any skill_id values from ${filePathForErrors}`);
  }
  if (skillToBranchId.size === 0) {
    throw new Error(`Could not extract any skill->branch mappings from ${filePathForErrors}`);
  }
  if (skillToBranchId.size !== allowedSkillIds.size) {
    const missing = [...allowedSkillIds].filter((skillId) => !skillToBranchId.has(skillId));
    throw new Error(
      `Missing skill->branch mappings in ${filePathForErrors}: ${missing.join(", ")}`,
    );
  }

  return {
    topicId,
    sectionId,
    moduleId,
    gradeTags,
    allowedSkillIds,
    branchIds,
    skillToBranchId,
    skills,
  };
}

export async function parseTaxonomyMarkdown(filePath: string): Promise<ParsedTaxonomy> {
  const text = await fs.readFile(filePath, "utf8");
  const parsed = parseTaxonomyMarkdownText(text, filePath);
  return {
    topicId: parsed.topicId,
    allowedSkillIds: parsed.allowedSkillIds,
  };
}

export async function parseTaxonomyMarkdownDetails(
  filePath: string,
): Promise<ParsedTaxonomyDetails> {
  const text = await fs.readFile(filePath, "utf8");
  return parseTaxonomyMarkdownText(text, filePath);
}
