import { promises as fs } from "node:fs";
import path from "node:path";

type BranchId = "O" | "P" | "E" | "T" | "A";
type SubtopicSlug = "direct" | "rule" | "inverse" | "problems";

type Args = {
  operation: string;
  title: string;
  summary: string;
  taxonomyDescription: string;
  subtopic: SubtopicSlug;
  branch: BranchId;
  tasks: number;
};

type TaskBank = {
  schema_version: number;
  topic_id: string;
  title: string;
  tasks: Array<{
    id: string;
    topic_id: string;
    skill_id: string;
    difficulty: number;
    statement_md: string;
    answer: { type: "number"; value: number };
  }>;
};

const TOPIC_ID = "math.proportion";

function parseArgs(argv: string[]): Args {
  const values = new Map<string, string>();
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token?.startsWith("--")) continue;
    const key = token.slice(2);
    const value = argv[i + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for --${key}`);
    }
    values.set(key, value);
    i += 1;
  }

  const operationRaw = values.get("operation");
  const title = values.get("title");
  const summary = values.get("summary");
  const taxonomyDescription = values.get("taxonomy-description") ?? title;
  const subtopicRaw = values.get("subtopic") ?? "direct";
  const branchRaw = values.get("branch") ?? "O";
  const tasksRaw = values.get("tasks") ?? "10";

  if (!operationRaw || !title || !summary) {
    throw new Error(
      [
        "Usage:",
        'pnpm proportion:add-skill -- --operation understand_ratio_as_quotient --title "Понимать отношение как частное" --summary "Записывать отношение a:b как a/b и находить его значение." --taxonomy-description "понимать отношение как частное" --subtopic direct --branch O --tasks 10',
      ].join("\n"),
    );
  }

  if (!/^[a-z][a-z0-9_]*$/.test(operationRaw)) {
    throw new Error(`Invalid --operation "${operationRaw}". Use english snake_case.`);
  }
  if (
    subtopicRaw !== "direct" &&
    subtopicRaw !== "rule" &&
    subtopicRaw !== "inverse" &&
    subtopicRaw !== "problems"
  ) {
    throw new Error(`Invalid --subtopic "${subtopicRaw}". Use: direct|rule|inverse|problems.`);
  }
  if (branchRaw !== "O" && branchRaw !== "P" && branchRaw !== "E" && branchRaw !== "T" && branchRaw !== "A") {
    throw new Error(`Invalid --branch "${branchRaw}". Use: O|P|E|T|A.`);
  }
  const tasks = Number(tasksRaw);
  if (!Number.isInteger(tasks) || tasks <= 0 || tasks > 100) {
    throw new Error(`Invalid --tasks "${tasksRaw}". Use integer 1..100.`);
  }

  return {
    operation: operationRaw,
    title,
    summary,
    taxonomyDescription: taxonomyDescription ?? title,
    subtopic: subtopicRaw,
    branch: branchRaw,
    tasks,
  };
}

function formatTaskId(skillId: string, index: number) {
  return `${skillId}.${String(index).padStart(6, "0")}`;
}

function ensureLineInSection(source: string, line: string, sectionStart: string, nextSectionStart: string) {
  const start = source.indexOf(sectionStart);
  const end = source.indexOf(nextSectionStart);
  if (start < 0 || end < 0 || end <= start) {
    throw new Error(`Could not find section boundaries: "${sectionStart}" -> "${nextSectionStart}"`);
  }
  const section = source.slice(start, end);
  if (section.includes(line)) return source;
  const updatedSection = section.replace(/\n+$/, "\n") + `${line}\n`;
  return source.slice(0, start) + updatedSection + source.slice(end);
}

function insertSkillToModuleData(source: string, skillBlock: string) {
  const marker = "export const proportionSkills: ProportionSkill[] = [";
  const start = source.indexOf(marker);
  if (start < 0) throw new Error("Could not find proportionSkills declaration.");
  const end = source.indexOf("\n];", start);
  if (end < 0) throw new Error("Could not find end of proportionSkills array.");
  const skillsSection = source.slice(start, end);
  if (skillsSection.includes(skillBlock)) return source;
  const updated = source.slice(0, end) + `${skillBlock}\n` + source.slice(end);
  return updated;
}

function upsertSkillInBranch(source: string, branchId: BranchId, skillId: string) {
  const pattern = new RegExp(`(\\{\\n\\s*id: "${branchId}",[\\s\\S]*?skillIds:\\s*\\[)([\\s\\S]*?)(\\],)`);
  const match = source.match(pattern);
  if (!match) throw new Error(`Could not find branch "${branchId}" in proportionBranches.`);

  const prefix = match[1];
  const body = match[2];
  const suffix = match[3];

  const items = Array.from(body.matchAll(/"([^"]+)"/g)).map((part) => part[1]);
  if (!items.includes(skillId)) items.push(skillId);

  const rebuiltBody = `\n${items.map((item) => `      "${item}",`).join("\n")}\n    `;
  return source.replace(pattern, `${prefix}${rebuiltBody}${suffix}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const skillId = `${TOPIC_ID}.${args.operation}`;
  const subtopicId = `${TOPIC_ID}.${args.subtopic}`;

  const taxonomyPath = path.join(process.cwd(), "docs", "TAXONOMY.md");
  const moduleDataPath = path.join(process.cwd(), "src", "lib", "topics", "proportion", "module-data.ts");
  const tasksPath = path.join(process.cwd(), "data", "tasks", "proportion.json");

  const [taxonomyRaw, moduleDataRaw, tasksRaw] = await Promise.all([
    fs.readFile(taxonomyPath, "utf8"),
    fs.readFile(moduleDataPath, "utf8"),
    fs.readFile(tasksPath, "utf8"),
  ]);

  if (taxonomyRaw.includes(`\`${skillId}\``) || moduleDataRaw.includes(`id: "${skillId}"`)) {
    throw new Error(`Skill already exists: ${skillId}`);
  }

  const taxonomySkillLine = `- \`${skillId}\` — ${args.taxonomyDescription}`;
  const taxonomyMapLine = `- \`${skillId}\` -> \`${subtopicId}\``;

  let nextTaxonomy = ensureLineInSection(
    taxonomyRaw,
    taxonomySkillLine,
    "## Skill IDs (операции)",
    "## Subtopics (подтемы модуля)",
  );
  nextTaxonomy = ensureLineInSection(
    nextTaxonomy,
    taxonomyMapLine,
    "## Mapping: skill_id -> subtopic_id",
    "## Правила стабильности ID",
  );

  const skillBlock = [
    "  {",
    `    id: "${skillId}",`,
    `    title: "${args.title}",`,
    `    summary: "${args.summary}",`,
    `    subtopicId: "${subtopicId}",`,
    "    skillSlug: DEFAULT_SKILL_PAGE_SLUG,",
    "  },",
  ].join("\n");

  let nextModuleData = insertSkillToModuleData(moduleDataRaw, `${skillBlock}`);
  nextModuleData = upsertSkillInBranch(nextModuleData, args.branch, skillId);

  const taskBank = JSON.parse(tasksRaw) as TaskBank;
  const lastId = taskBank.tasks
    .filter((item) => item.skill_id === skillId)
    .map((item) => item.id)
    .sort()
    .at(-1);

  let startIndex = 1;
  if (lastId) {
    const lastPart = lastId.split(".").at(-1);
    const parsed = Number(lastPart);
    if (Number.isFinite(parsed) && parsed > 0) startIndex = parsed + 1;
  }

  const newTasks: TaskBank["tasks"] = [];
  for (let i = 0; i < args.tasks; i += 1) {
    const index = startIndex + i;
    newTasks.push({
      id: formatTaskId(skillId, index),
      topic_id: TOPIC_ID,
      skill_id: skillId,
      difficulty: (i % 4) + 1,
      statement_md: `TODO (${args.operation} #${index}): добавьте формулировку задачи с LaTeX`,
      answer: { type: "number", value: 0 },
    });
  }
  taskBank.tasks.push(...newTasks);

  await Promise.all([
    fs.writeFile(taxonomyPath, nextTaxonomy, "utf8"),
    fs.writeFile(moduleDataPath, nextModuleData, "utf8"),
    fs.writeFile(tasksPath, `${JSON.stringify(taskBank, null, 2)}\n`, "utf8"),
  ]);

  console.log("Skill added:");
  console.log(`- skill_id: ${skillId}`);
  console.log(`- subtopic: ${subtopicId}`);
  console.log(`- branch: ${args.branch}`);
  console.log(`- task stubs created: ${args.tasks}`);
  console.log("");
  console.log("Next:");
  console.log("1. Replace TODO statements and answers in data/tasks/proportion.json");
  console.log("2. Run pnpm validate:tasks");
}

main().catch((error) => {
  console.error("Failed to add proportion skill.");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

