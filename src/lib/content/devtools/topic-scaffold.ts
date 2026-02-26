import path from "node:path";

import type { AppLocale } from "@/src/lib/i18n/format";

export type TopicScaffoldArgs = {
  domain: string;
  topic: string;
  locales: AppLocale[];
};

export type TopicScaffoldSubtopicSeed = {
  fileName: string;
  slug: string;
  order: number;
  titles: Record<AppLocale, string>;
};

export type TopicScaffoldFilePlan = {
  contentTopicDirByLocale: Record<AppLocale, string>;
  topicIndexFiles: string[];
  subtopicContentFiles: string[];
  routeTopicPageFile: string;
  routeSubtopicPageFiles: string[];
};

const LOCALES: AppLocale[] = ["ru", "en", "de"];

export function isKebabCaseSlug(value: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

export function parseLocalesCsv(value: string | undefined): AppLocale[] {
  if (!value || value.trim() === "") return [...LOCALES];
  const parsed = value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  const unique = [...new Set(parsed)];

  for (const item of unique) {
    if (item !== "ru" && item !== "en" && item !== "de") {
      throw new Error(`Invalid locale "${item}". Use comma-separated values from: ru,en,de`);
    }
  }

  return unique as AppLocale[];
}

export function defaultSubtopicSeeds(): TopicScaffoldSubtopicSeed[] {
  return [
    {
      fileName: "01-intro.mdx",
      slug: "intro",
      order: 10,
      titles: {
        ru: "Введение",
        en: "Introduction",
        de: "Einführung",
      },
    },
    {
      fileName: "02-core.mdx",
      slug: "core",
      order: 20,
      titles: {
        ru: "Основные идеи",
        en: "Core Ideas",
        de: "Grundideen",
      },
    },
    {
      fileName: "03-practice.mdx",
      slug: "practice",
      order: 30,
      titles: {
        ru: "Практика",
        en: "Practice",
        de: "Übung",
      },
    },
  ];
}

export function buildTopicScaffoldPlan(
  rootDir: string,
  routePathSegments: string[],
  args: TopicScaffoldArgs,
  subtopics = defaultSubtopicSeeds(),
): TopicScaffoldFilePlan {
  const contentTopicDirByLocale = Object.fromEntries(
    args.locales.map((locale) => [
      locale,
      path.join(rootDir, "content", locale, args.domain, args.topic),
    ]),
  ) as Record<AppLocale, string>;

  const topicIndexFiles = args.locales.map((locale) =>
    path.join(contentTopicDirByLocale[locale], "index.mdx"),
  );

  const subtopicContentFiles = args.locales.flatMap((locale) =>
    subtopics.map((seed) => path.join(contentTopicDirByLocale[locale], seed.fileName)),
  );

  const routeTopicDir = path.join(rootDir, "src", "app", "[locale]", ...routePathSegments);
  const routeTopicPageFile = path.join(routeTopicDir, "page.tsx");
  const routeSubtopicPageFiles = subtopics.map((seed) =>
    path.join(routeTopicDir, seed.slug, "page.tsx"),
  );

  return {
    contentTopicDirByLocale,
    topicIndexFiles,
    subtopicContentFiles,
    routeTopicPageFile,
    routeSubtopicPageFiles,
  };
}

export function insertRegistryTopicEntry(
  source: string,
  topicSlug: string,
  entryCode: string,
) {
  if (new RegExp(`\\b${topicSlug}\\s*:\\s*\\{`).test(source)) {
    throw new Error(`Topic "${topicSlug}" already exists in topic-registry`);
  }

  const marker = "const CONTENT_TOPIC_REGISTRY: Record<string, ContentTopicRegistryItem> = {";
  const idx = source.indexOf(marker);
  if (idx === -1) throw new Error("Could not find CONTENT_TOPIC_REGISTRY in topic-registry.ts");
  const insertPos = source.indexOf("};", idx);
  if (insertPos === -1) throw new Error("Could not find registry object end in topic-registry.ts");

  return `${source.slice(0, insertPos)}${entryCode}\n${source.slice(insertPos)}`;
}

