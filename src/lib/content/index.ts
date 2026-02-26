import type { TopicContentIndex } from "./types";
import { loadTopicSubtopicIndexFromContentDir, type LoadContentDirOptions } from "./source-content-dir";
import { loadTopicSubtopicIndexFromAppRoutes } from "./source-app-routes";

const topicIndexCache = new Map<string, Promise<TopicContentIndex>>();

function shouldBypassCache() {
  return process.env.TASKBANK_NO_CACHE === "1";
}

function makeCacheKey(topicSlug: string, options: LoadTopicSubtopicIndexOptions = {}) {
  return `${topicSlug}|${options.locale ?? "ru"}|${options.domain ?? ""}`;
}

export type LoadTopicSubtopicIndexOptions = LoadContentDirOptions;

async function loadWithContentFallbacks(
  topicSlug: string,
  options: LoadTopicSubtopicIndexOptions = {},
): Promise<TopicContentIndex> {
  const requestedLocale = options.locale ?? "ru";
  const localeFallbacks = requestedLocale === "ru" ? ["ru"] : [requestedLocale, "ru"];

  for (const locale of localeFallbacks) {
    const fromContent = await loadTopicSubtopicIndexFromContentDir(topicSlug, {
      ...options,
      locale,
    });
    if (fromContent) return fromContent;
  }

  return loadTopicSubtopicIndexFromAppRoutes(topicSlug);
}

/**
 * Stage 2B content API facade.
 * Reads from content/{locale}/{domain}/{topic} first (pilot), then falls back to route-level MDX in src/app/...
 */
export async function loadTopicSubtopicIndex(
  topicSlug: string,
  options: LoadTopicSubtopicIndexOptions = {},
): Promise<TopicContentIndex> {
  if (shouldBypassCache()) {
    return loadWithContentFallbacks(topicSlug, options);
  }

  const cacheKey = makeCacheKey(topicSlug, options);
  const cached = topicIndexCache.get(cacheKey);
  if (cached) return cached;

  const promise = loadWithContentFallbacks(topicSlug, options);
  topicIndexCache.set(cacheKey, promise);
  return promise;
}

export function clearTopicSubtopicIndexCache() {
  topicIndexCache.clear();
}

export type {
  ContentSubtopicDoc as SubtopicDocIndexItem,
  ContentSubtopicMeta as SubtopicMeta,
  ContentTocItem as TocItem,
  TopicContentIndex as TopicSubtopicIndex,
} from "./types";
