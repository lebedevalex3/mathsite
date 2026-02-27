import { promises as fs } from "node:fs";

export type ParsedTaxonomy = {
  topicId: string;
  allowedSkillIds: Set<string>;
};

export type TaxonomySkillEntry = {
  skillId: string;
  description: string;
};

export type ParsedTaxonomyDetails = ParsedTaxonomy & {
  skills: TaxonomySkillEntry[];
};

function parseTopicId(text: string, filePath: string) {
  const topicMatch = text.match(/^- `topic_id`: `([^`]+)`/m);
  if (!topicMatch) {
    throw new Error(`Could not extract topic_id from ${filePath}`);
  }
  return topicMatch[1];
}

export function parseTaxonomyMarkdownText(
  text: string,
  filePathForErrors = "TAXONOMY.md",
): ParsedTaxonomyDetails {
  const topicId = parseTopicId(text, filePathForErrors);
  const skills: TaxonomySkillEntry[] = [];
  const allowedSkillIds = new Set<string>();

  for (const line of text.split(/\r?\n/)) {
    const skillMatch = line.match(
      /^- `(g\d+\.[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*)`\s+—\s+(.+)$/,
    );
    if (!skillMatch) continue;

    const skillId = skillMatch[1];
    const description = skillMatch[2].trim();
    allowedSkillIds.add(skillId);
    skills.push({ skillId, description });
  }

  if (allowedSkillIds.size === 0) {
    throw new Error(`Could not extract any skill_id values from ${filePathForErrors}`);
  }

  return { topicId, allowedSkillIds, skills };
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
