import { promises as fs } from "node:fs";
import path from "node:path";

import { isKebabCaseSlug, parseLocalesCsv } from "../src/lib/content/devtools/topic-scaffold";

type Domain = "arithmetic" | "algebra" | "geometry" | "data";
type Locale = "ru" | "en" | "de";

type Args = {
  domain: Domain;
  topic: string;
  level: 5 | 6;
  titleRu: string;
  titleEn?: string;
  titleDe?: string;
  locales: Locale[];
  withSubtopics?: string[];
  force: boolean;
};

const SUPPORTED_DOMAINS: Domain[] = ["arithmetic", "algebra", "geometry", "data"];

const localeCopy = {
  ru: {
    topicIntro: (title: string) => `Тема «${title}». Короткое введение, цели и структура изучения.`,
    learnLabel: "Что ученик освоит",
    learnItems: ["Базовые понятия темы", "Ключевые приёмы и алгоритмы", "Типичные ошибки и проверка ответа"],
    subtopicsLabel: "Подтемы",
    subtopicsNote: "Ниже будут добавлены и связаны подтемы этой темы.",
    practiceLabel: "Практика",
    practiceNote: "Добавьте практические навыки и ссылки на тренажёр, когда будет готов банк задач.",
    todoTranslation: "TODO: перевод темы на этот язык.",
    toc: "Содержание",
    idea: "Определение / идея",
    algorithm: "Алгоритм",
    examples: "Примеры",
    mistakes: "Типичные ошибки",
    practice: "Практика",
    subtopicIntro: (title: string) =>
      `Подтема «${title}»: базовое объяснение, алгоритм и типичные ошибки (черновик).`,
  },
  en: {
    topicIntro: () => "TODO: topic introduction in English.",
    learnLabel: "What the learner will master",
    learnItems: ["Core concepts", "Key methods and algorithms", "Typical mistakes and self-check"],
    subtopicsLabel: "Subtopics",
    subtopicsNote: "Add and link subtopics for this topic here.",
    practiceLabel: "Practice",
    practiceNote: "Add practice skills and trainer links when tasks are ready.",
    todoTranslation: "TODO: translation to English.",
    toc: "Contents",
    idea: "Definition / Idea",
    algorithm: "Algorithm",
    examples: "Examples",
    mistakes: "Typical Mistakes",
    practice: "Practice",
    subtopicIntro: () => "TODO: subtopic introduction in English.",
  },
  de: {
    topicIntro: () => "TODO: Themeneinführung auf Deutsch.",
    learnLabel: "Was gelernt wird",
    learnItems: ["Grundbegriffe", "Wichtige Verfahren und Algorithmen", "Typische Fehler und Selbstkontrolle"],
    subtopicsLabel: "Unterthemen",
    subtopicsNote: "Unterthemen dieser Einheit hier ergänzen und verlinken.",
    practiceLabel: "Übung",
    practiceNote: "Fähigkeiten und Trainer-Links ergänzen, sobald Aufgaben bereit sind.",
    todoTranslation: "TODO: Übersetzung ins Deutsche.",
    toc: "Inhalt",
    idea: "Definition / Idee",
    algorithm: "Algorithmus",
    examples: "Beispiele",
    mistakes: "Typische Fehler",
    practice: "Übung",
    subtopicIntro: () => "TODO: Unterthema-Einführung auf Deutsch.",
  },
} as const;

function parseArgs(argv: string[]): Args {
  const values = new Map<string, string>();
  const flags = new Set<string>();
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token?.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      flags.add(key);
      continue;
    }
    values.set(key, next);
    i += 1;
  }

  const domain = values.get("domain") as Domain | undefined;
  const topic = values.get("topic");
  const levelRaw = values.get("level") ?? "5";
  const titleRu = values.get("title");
  const locales = parseLocalesCsv(values.get("locales")) as Locale[];
  const withSubtopics = values.get("withSubtopics")?.split(",").map((x) => x.trim()).filter(Boolean);

  if (!domain || !SUPPORTED_DOMAINS.includes(domain)) {
    throw new Error(`Invalid --domain. Use one of: ${SUPPORTED_DOMAINS.join(", ")}`);
  }
  if (!topic || !isKebabCaseSlug(topic)) {
    throw new Error(`Invalid --topic "${topic ?? ""}". Use kebab-case.`);
  }
  if (!titleRu) {
    throw new Error('Missing --title (RU title). Example: --title "Отношения"');
  }
  const level = Number(levelRaw);
  if ((level !== 5 && level !== 6) || !Number.isInteger(level)) {
    throw new Error(`Invalid --level "${levelRaw}". Supported values: 5 | 6`);
  }
  if (withSubtopics && withSubtopics.some((s) => !isKebabCaseSlug(s))) {
    throw new Error("Invalid --withSubtopics. Use comma-separated kebab-case slugs.");
  }

  return {
    domain,
    topic,
    level: level as 5 | 6,
    titleRu,
    titleEn: values.get("titleEn") ?? undefined,
    titleDe: values.get("titleDe") ?? undefined,
    locales,
    withSubtopics,
    force: flags.has("force"),
  };
}

function titleMap(args: Args): Record<Locale, string> {
  return {
    ru: args.titleRu,
    en: args.titleEn ?? `TODO: ${args.topic} (EN)`,
    de: args.titleDe ?? `TODO: ${args.topic} (DE)`,
  };
}

function topicIdFor(topic: string, level: 5 | 6) {
  return `g${level}.${topic}`;
}

function routeSegmentsFor(topic: string, level: 5 | 6) {
  return [`${level}-klass`, topic];
}

async function readTemplate(name: string) {
  return fs.readFile(path.join(process.cwd(), "templates", "content", name), "utf8");
}

function replaceAllMap(template: string, vars: Record<string, string | number>) {
  let out = template;
  for (const [key, value] of Object.entries(vars)) {
    out = out.replaceAll(key, String(value));
  }
  return out;
}

function buildTopicIndexContent(locale: Locale, args: Args, localizedTitle: string, template: string) {
  const t = localeCopy[locale];
  const intro = locale === "ru" ? t.topicIntro(localizedTitle) : `${t.todoTranslation} ${t.topicIntro(localizedTitle)}`;
  const vars = {
    TOPIC_TITLE: localizedTitle,
    TOPIC_SLUG: args.topic,
    TOPIC_DOMAIN: args.domain,
    TOPIC_INTRO: intro,
    TOPIC_LEARN_LABEL: t.learnLabel,
    TOPIC_LEARN_ITEM_1: t.learnItems[0],
    TOPIC_LEARN_ITEM_2: t.learnItems[1],
    TOPIC_LEARN_ITEM_3: t.learnItems[2],
    TOPIC_SUBTOPICS_LABEL: t.subtopicsLabel,
    TOPIC_SUBTOPICS_NOTE: t.subtopicsNote,
    TOPIC_PRACTICE_LABEL: t.practiceLabel,
    TOPIC_PRACTICE_NOTE: t.practiceNote,
  };
  return replaceAllMap(template, vars);
}

function buildSubtopicStarterContent(
  locale: Locale,
  title: string,
  slug: string,
  order: number,
  template: string,
) {
  const t = localeCopy[locale];
  const prefix = locale === "ru" ? "" : `${t.todoTranslation} `;
  return replaceAllMap(template, {
    SUBTOPIC_TITLE: title,
    SUBTOPIC_SLUG: slug,
    SUBTOPIC_ORDER: order,
    SUBTOPIC_INTRO: `${prefix}${t.subtopicIntro(title)}`,
    TOC_LABEL: t.toc,
    TOC_ITEM_IDEA: t.idea,
    TOC_ITEM_ALGORITHM: t.algorithm,
    TOC_ITEM_EXAMPLES: t.examples,
    TOC_ITEM_MISTAKES: t.mistakes,
    TOC_ITEM_PRACTICE: t.practice,
    SECTION_IDEA: t.idea,
    SECTION_IDEA_TEXT: locale === "ru" ? "Добавьте краткое объяснение подтемы." : t.todoTranslation,
    SECTION_ALGORITHM: t.algorithm,
    ALGORITHM_STEP_1: locale === "ru" ? "Шаг 1." : "TODO",
    ALGORITHM_STEP_2: locale === "ru" ? "Шаг 2." : "TODO",
    ALGORITHM_STEP_3: locale === "ru" ? "Шаг 3." : "TODO",
    SECTION_EXAMPLES: t.examples,
    SECTION_EXAMPLES_TEXT: locale === "ru" ? "Добавьте 1–2 примера." : t.todoTranslation,
    SECTION_MISTAKES: t.mistakes,
    MISTAKE_1: locale === "ru" ? "Ошибка 1." : "TODO",
    MISTAKE_2: locale === "ru" ? "Ошибка 2." : "TODO",
    SECTION_PRACTICE: t.practice,
    SECTION_PRACTICE_TEXT: locale === "ru" ? "Добавьте практические задания или ссылку на тренажёр." : t.todoTranslation,
  });
}

async function fileExists(filePath: string) {
  try {
    const stat = await fs.stat(filePath);
    return stat.isFile();
  } catch {
    return false;
  }
}

async function ensureWritableFile(filePath: string, force: boolean) {
  if (!force && (await fileExists(filePath))) {
    throw new Error(`File already exists: ${path.relative(process.cwd(), filePath)} (use --force to overwrite files)`);
  }
}

async function upsertTextFile(filePath: string, content: string, force: boolean) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const exists = await fileExists(filePath);
  if (exists && !force) {
    throw new Error(`File already exists: ${path.relative(process.cwd(), filePath)} (use --force to overwrite files)`);
  }
  await fs.writeFile(filePath, content, "utf8");
}

function appendBeforeLast(source: string, marker: string, chunk: string) {
  const idx = source.lastIndexOf(marker);
  if (idx === -1) throw new Error(`Could not find marker "${marker}"`);
  return `${source.slice(0, idx)}${chunk}${source.slice(idx)}`;
}

function hasRegistryKey(source: string, key: string) {
  return new RegExp(`\\b${key}\\s*:\\s*\\{`).test(source);
}

const DOMAIN_ORDER: Domain[] = ["arithmetic", "algebra", "geometry", "data"];

function insertTopicMetaEntryOrdered(source: string, args: Args, chunk: string) {
  const start = source.indexOf("export const topicCatalogEntries: TopicCatalogEntry[] = [");
  if (start === -1) throw new Error("Could not find topicCatalogEntries array in src/lib/topicMeta.ts");
  const end = source.indexOf("\n];", start);
  if (end === -1) throw new Error("Could not find topicCatalogEntries array end in src/lib/topicMeta.ts");

  const arrayBody = source.slice(start, end);
  const entryRegex = /{\s*[\s\S]*?\bid:\s*"([^"]+)"[\s\S]*?\bdomain:\s*"([^"]+)"[\s\S]*?\blevels:\s*\[(\d+)\][\s\S]*?},/g;
  let match: RegExpExecArray | null = null;
  let insertPos = end;
  const targetDomainIndex = DOMAIN_ORDER.indexOf(args.domain);

  while ((match = entryRegex.exec(arrayBody))) {
    const absoluteStart = start + match.index;
    const absoluteEnd = start + entryRegex.lastIndex;
    const domain = match[2] as Domain;
    const level = Number(match[3]);
    const domainIndex = DOMAIN_ORDER.indexOf(domain);

    if (domainIndex > targetDomainIndex || (domainIndex === targetDomainIndex && level > args.level)) {
      insertPos = absoluteStart;
      break;
    }

    insertPos = absoluteEnd;
  }

  return `${source.slice(0, insertPos)}\n${chunk}${source.slice(insertPos)}`;
}

async function updateTopicRegistry(args: Args, titles: Record<Locale, string>, force: boolean) {
  const file = path.join(process.cwd(), "src", "lib", "content", "topic-registry.ts");
  const source = await fs.readFile(file, "utf8");
  if (hasRegistryKey(source, args.topic)) {
    if (force) return { changed: false, skipped: true };
    throw new Error(`Topic "${args.topic}" already exists in topic-registry.ts (use --force to skip file overwrites only; registry duplicates are not allowed)`);
  }
  const chunk = [
    `  ${args.topic}: {`,
    `    topicSlug: "${args.topic}",`,
    `    domain: "${args.domain}",`,
    `    routePathSegments: ["${args.level}-klass", "${args.topic}"],`,
    `    defaultLocale: "ru",`,
    `    titles: {`,
    `      ru: ${JSON.stringify(titles.ru)},`,
    `      en: ${JSON.stringify(titles.en)},`,
    `      de: ${JSON.stringify(titles.de)},`,
    "    },",
    "  },",
  ].join("\n");
  const next = appendBeforeLast(source, "\n};", `\n${chunk}\n`);
  await fs.writeFile(file, next, "utf8");
  return { changed: true, skipped: false };
}

async function updateTopicMeta(args: Args, titles: Record<Locale, string>) {
  const file = path.join(process.cwd(), "src", "lib", "topicMeta.ts");
  const source = await fs.readFile(file, "utf8");
  const id = topicIdFor(args.topic, args.level);
  if (source.includes(`id: "${id}"`)) {
    throw new Error(`Topic "${id}" already exists in src/lib/topicMeta.ts`);
  }
  const slug = `${args.level}-klass/${args.topic}`;
  const chunk = `
  {
    id: "${id}",
    slug: "${slug}",
    domain: "${args.domain}",
    levels: [${args.level}],
    status: "ready",
    title: {
      ru: ${JSON.stringify(titles.ru)},
      en: ${JSON.stringify(titles.en)},
      de: ${JSON.stringify(titles.de)},
    },
    description: {
      ru: "TODO: краткое описание темы.",
      en: "TODO: topic description.",
      de: "TODO: Themenbeschreibung.",
    },
    searchTerms: {
      ru: [${JSON.stringify(args.topic)}, "TODO"],
      en: [${JSON.stringify(args.topic)}, "TODO"],
      de: [${JSON.stringify(args.topic)}, "TODO"],
    },
    canRead: true,
    canTrain: false,
  },`;
  const next = insertTopicMetaEntryOrdered(source, args, chunk);
  await fs.writeFile(file, next, "utf8");
}

async function updateGrade5Nav(args: Args, titles: Record<Locale, string>) {
  if (args.level !== 5) {
    return { skipped: true };
  }
  const file = path.join(process.cwd(), "src", "lib", "nav", "grade5.ts");
  const source = await fs.readFile(file, "utf8");
  const id = topicIdFor(args.topic, args.level);
  if (source.includes(`id: "${id}"`)) {
    throw new Error(`Topic "${id}" already exists in src/lib/nav/grade5.ts`);
  }
  const title = titles.ru;
  const chunk = `
  {
    id: "${id}",
    slug: "${args.topic}",
    title: ${JSON.stringify(title)},
    description: "Черновая тема: добавьте описание и подтемы.",
    status: "ready",
  },`;
  const next = appendBeforeLast(source, "\n];", `${chunk}\n`);
  await fs.writeFile(file, next, "utf8");
  return { skipped: false };
}

async function updateTopicMastery(args: Args) {
  const file = path.join(process.cwd(), "src", "lib", "topicMastery.ts");
  const source = await fs.readFile(file, "utf8");
  const masteryKey = `"${topicIdFor(args.topic, args.level)}"`;
  if (source.includes(`${masteryKey}:`)) {
    throw new Error(`Topic mastery "${masteryKey}" already exists in src/lib/topicMastery.ts`);
  }
  const chunk = `
  ${masteryKey}: {
    masteryLevels: [],
  },`;
  const next = appendBeforeLast(source, "\n};", `${chunk}\n`);
  await fs.writeFile(file, next, "utf8");
}

function buildTopicRouteWrapperImport(args: Args) {
  return `@/content/ru/${args.domain}/${args.topic}/index.mdx`;
}

function routeFileNameForSeed(seedSlug: string, index: number) {
  const defaults = ["intro", "core", "practice"];
  if (defaults[index] === seedSlug) {
    return `${String(index + 1).padStart(2, "0")}-${seedSlug}.mdx`;
  }
  return `${String((index + 1) * 10).padStart(2, "0")}-${seedSlug}.mdx`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const titles = titleMap(args);
  const topicId = topicIdFor(args.topic, args.level);
  const routeSegments = routeSegmentsFor(args.topic, args.level);
  const routeTopicDir = path.join(process.cwd(), "src", "app", "[locale]", ...routeSegments);
  const topicIndexTemplate = await readTemplate("topic-index.mdx.template");
  const subtopicTemplate = await readTemplate("subtopic-starter.mdx.template");

  const subtopicSlugs = args.withSubtopics?.length
    ? args.withSubtopics
    : ["intro", "core", "practice"];
  const subtopicSeeds = subtopicSlugs.map((slug, idx) => ({
    slug,
    order: (idx + 1) * 10,
    fileName: routeFileNameForSeed(slug, idx),
    titleByLocale: {
      ru: slug === "intro" ? "Введение" : slug === "core" ? "Основные идеи" : slug === "practice" ? "Практика" : `Подтема: ${slug}`,
      en: slug === "intro" ? "Introduction" : slug === "core" ? "Core Ideas" : slug === "practice" ? "Practice" : `Subtopic: ${slug}`,
      de: slug === "intro" ? "Einführung" : slug === "core" ? "Grundideen" : slug === "practice" ? "Übung" : `Unterthema: ${slug}`,
    } as Record<Locale, string>,
  }));

  const createdFiles: string[] = [];

  for (const locale of args.locales) {
    const topicDir = path.join(process.cwd(), "content", locale, args.domain, args.topic);
    await fs.mkdir(topicDir, { recursive: true });

    const topicIndexFile = path.join(topicDir, "index.mdx");
    await ensureWritableFile(topicIndexFile, args.force);
    const topicIndexContent = buildTopicIndexContent(locale, args, titles[locale], topicIndexTemplate);
    await upsertTextFile(topicIndexFile, topicIndexContent, true);
    createdFiles.push(path.relative(process.cwd(), topicIndexFile));

    for (const seed of subtopicSeeds) {
      const contentFile = path.join(topicDir, seed.fileName);
      await ensureWritableFile(contentFile, args.force);
      const mdx = buildSubtopicStarterContent(locale, seed.titleByLocale[locale], seed.slug, seed.order, subtopicTemplate);
      await upsertTextFile(contentFile, mdx, true);
      createdFiles.push(path.relative(process.cwd(), contentFile));
    }
  }

  const topicWrapperFile = path.join(routeTopicDir, "page.tsx");
  await ensureWritableFile(topicWrapperFile, args.force);
  await upsertTextFile(
    topicWrapperFile,
    `export { default } from "${buildTopicRouteWrapperImport(args)}";\n`,
    true,
  );
  createdFiles.push(path.relative(process.cwd(), topicWrapperFile));

  for (let i = 0; i < subtopicSeeds.length; i += 1) {
    const seed = subtopicSeeds[i];
    const wrapperFile = path.join(routeTopicDir, seed.slug, "page.tsx");
    await ensureWritableFile(wrapperFile, args.force);
    const importPath = `@/content/ru/${args.domain}/${args.topic}/${seed.fileName.replace(/\.mdx$/, ".mdx")}`;
    await upsertTextFile(wrapperFile, `export { default } from "${importPath}";\n`, true);
    createdFiles.push(path.relative(process.cwd(), wrapperFile));
  }

  await updateTopicRegistry(args, titles, args.force);
  await updateTopicMeta(args, titles);
  const grade5NavUpdate = await updateGrade5Nav(args, titles);
  await updateTopicMastery(args);

  console.log(`Created topic scaffold: ${topicId}`);
  console.log(`- Domain: ${args.domain}`);
  console.log(`- Level: ${args.level}`);
  console.log(`- Locales: ${args.locales.join(", ")}`);
  console.log(`- Subtopics: ${subtopicSeeds.map((s) => s.slug).join(", ")}`);
  console.log("");
  console.log("Files:");
  for (const file of createdFiles) {
    console.log(`- ${file}`);
  }
  console.log("");
  console.log("Next steps:");
  console.log("1. Update topic titles/descriptions/searchTerms in src/lib/topicMeta.ts");
  if (grade5NavUpdate.skipped) {
    console.log("2. Add navigation entry in the appropriate *klass nav file (grade5 nav was skipped because --level != 5).");
    console.log("3. Fill content/*.mdx texts and translations.");
    console.log("4. Add real mastery levels/skills in src/lib/topicMastery.ts.");
    console.log("5. Run: pnpm validate:content");
  } else {
    console.log("2. Fill content/*.mdx texts and translations.");
    console.log("3. Add real mastery levels/skills in src/lib/topicMastery.ts.");
    console.log("4. Run: pnpm validate:content");
  }
}

main().catch((error) => {
  console.error("Failed to scaffold new topic.");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
