import { promises as fs } from "node:fs";
import path from "node:path";

import type { ContentSubtopicDoc, TopicContentIndex } from "./types";
import { getContentTopicConfig } from "./topic-registry";
import {
  extractTocFromMdx,
  parseSubtopicMetaFromMdx,
  sortSubtopicsByOrder,
} from "./source-app-routes";

export type LoadContentDirOptions = {
  locale?: string;
  domain?: string;
};

function resolveTopicDomain(topicSlug: string, explicitDomain?: string) {
  return explicitDomain ?? getContentTopicConfig(topicSlug)?.domain ?? null;
}

async function readContentDirMdxFile(filePath: string): Promise<ContentSubtopicDoc> {
  const source = await fs.readFile(filePath, "utf8");
  const meta = parseSubtopicMetaFromMdx(source, filePath);
  const toc = extractTocFromMdx(source);
  return { ...meta, filePath, toc };
}

async function listTopicMdxFilesFromContentDir(
  topicSlug: string,
  options: LoadContentDirOptions = {},
) {
  const locale = options.locale ?? "ru";
  const domain = resolveTopicDomain(topicSlug, options.domain);
  if (!domain) return null;

  const topicDir = path.join(process.cwd(), "content", locale, domain, topicSlug);

  let entries;
  try {
    entries = await fs.readdir(topicDir, { withFileTypes: true });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException)?.code;
    if (code === "ENOENT") return null;
    throw error;
  }

  const mdxFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".mdx"))
    .map((entry) => path.join(topicDir, entry.name));

  return mdxFiles;
}

export async function loadTopicSubtopicIndexFromContentDir(
  topicSlug: string,
  options: LoadContentDirOptions = {},
): Promise<TopicContentIndex | null> {
  const files = await listTopicMdxFilesFromContentDir(topicSlug, options);
  if (!files || files.length === 0) return null;

  const subtopics = sortSubtopicsByOrder(await Promise.all(files.map(readContentDirMdxFile)));
  const tocBySlug = Object.fromEntries(subtopics.map((item) => [item.slug, item.toc]));

  return {
    topicSlug,
    subtopics,
    tocBySlug,
  };
}
