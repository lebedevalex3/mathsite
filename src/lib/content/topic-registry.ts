import type { AppLocale } from "@/src/lib/i18n/format";

export type ContentTopicRegistryItem = {
  topicSlug: string;
  domain: string;
  routePathSegments: string[];
  defaultLocale: "ru" | "en" | "de";
  titles?: Partial<Record<AppLocale, string>>;
};

const CONTENT_TOPIC_REGISTRY: Record<string, ContentTopicRegistryItem> = {
  proportion: {
    topicSlug: "proportion",
    domain: "arithmetic",
    routePathSegments: ["topics", "proportion"],
    defaultLocale: "ru",
    titles: {
      ru: "Пропорции",
      en: "Proportions",
      de: "Proportionen",
    },
  },
  equations: {
    topicSlug: "equations",
    domain: "algebra",
    routePathSegments: ["topics", "equations"],
    defaultLocale: "ru",
    titles: {
      ru: "Уравнения",
      en: "Equations",
      de: "Gleichungen",
    },
  },
  "negative-numbers": {
    topicSlug: "negative-numbers",
    domain: "algebra",
    routePathSegments: ["topics", "negative-numbers"],
    defaultLocale: "ru",
    titles: {
      ru: "Отрицательные числа",
      en: "Negative Numbers",
      de: "Negative Zahlen",
    },
  },
};

export function getContentTopicConfig(topicSlug: string): ContentTopicRegistryItem | null {
  return CONTENT_TOPIC_REGISTRY[topicSlug] ?? null;
}

export function listContentTopicConfigs() {
  return Object.values(CONTENT_TOPIC_REGISTRY);
}

export function requireContentTopicConfig(topicSlug: string): ContentTopicRegistryItem {
  const config = getContentTopicConfig(topicSlug);
  if (!config) {
    throw new Error(
      `Unsupported topic "${topicSlug}" for content workflow. Add it to src/lib/content/topic-registry.ts first.`,
    );
  }
  return config;
}
