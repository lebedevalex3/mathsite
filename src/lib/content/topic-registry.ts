import type { AppLocale } from "@/src/lib/i18n/format";

export type ContentTopicRegistryItem = {
  topicSlug: string;
  domain: string;
  routePathSegments: string[];
  defaultLocale: "ru" | "en" | "de";
  titles?: Partial<Record<AppLocale, string>>;
};

const CONTENT_TOPIC_REGISTRY: Record<string, ContentTopicRegistryItem> = {
  proporcii: {
    topicSlug: "proporcii",
    domain: "arithmetic",
    routePathSegments: ["5-klass", "proporcii"],
    defaultLocale: "ru",
    titles: {
      ru: "Пропорции",
      en: "Proportions",
      de: "Proportionen",
    },
  },
  uravneniya: {
    topicSlug: "uravneniya",
    domain: "algebra",
    routePathSegments: ["5-klass", "uravneniya"],
    defaultLocale: "ru",
    titles: {
      ru: "Уравнения",
      en: "Equations",
      de: "Gleichungen",
    },
  },
  "g6.otricatelnye_chisla": {
    topicSlug: "g6.otricatelnye_chisla",
    domain: "algebra",
    routePathSegments: ["6-klass", "otricatelnye-chisla"],
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
