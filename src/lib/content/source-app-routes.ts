import { promises as fs } from "node:fs";
import path from "node:path";

import type { ContentSubtopicDoc, ContentSubtopicMeta, ContentTocItem, TopicContentIndex } from "./types";

function parseStringField(block: string, field: string) {
  const match = block.match(new RegExp(`${field}\\s*:\\s*["']([^"']+)["']`));
  return match?.[1]?.trim() ?? null;
}

function parseNumberField(block: string, field: string) {
  const match = block.match(new RegExp(`${field}\\s*:\\s*(\\d+)`));
  return match ? Number(match[1]) : null;
}

export function parseSubtopicMetaFromMdx(source: string, filePath = "unknown.mdx"): ContentSubtopicMeta {
  const exportMatch = source.match(
    /export\s+const\s+subtopicMeta\s*=\s*\{([\s\S]*?)\}\s*(?:as\s+const)?\s*;/,
  );

  if (!exportMatch?.[1]) {
    throw new Error(`Missing subtopicMeta export in ${filePath}`);
  }

  const block = exportMatch[1];
  const title = parseStringField(block, "title");
  const slug = parseStringField(block, "slug");
  const order = parseNumberField(block, "order");

  if (!title || !slug || order === null || Number.isNaN(order)) {
    throw new Error(`Invalid subtopicMeta in ${filePath}: expected title/slug/order`);
  }

  return { title, slug, order };
}

function stripInlineTags(value: string) {
  return value.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function slugifyHeading(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function extractTocFromMdx(source: string): ContentTocItem[] {
  const items: ContentTocItem[] = [];
  const seen = new Set<string>();

  const htmlHeadingRegex = /<h([23])\s+id=["']([^"']+)["'][^>]*>([\s\S]*?)<\/h\1>/g;
  let htmlMatch: RegExpExecArray | null = null;
  while ((htmlMatch = htmlHeadingRegex.exec(source))) {
    const depth = Number(htmlMatch[1]) as 2 | 3;
    const id = htmlMatch[2]?.trim();
    const label = stripInlineTags(htmlMatch[3] ?? "");
    if (!id || id === "toc" || !label || seen.has(id)) continue;
    seen.add(id);
    items.push({ id, label, depth });
  }

  if (items.length > 0) return items;

  const mdHeadingRegex = /^(##|###)\s+(.+)$/gm;
  let mdMatch: RegExpExecArray | null = null;
  while ((mdMatch = mdHeadingRegex.exec(source))) {
    const raw = mdMatch[2]?.trim() ?? "";
    const label = raw.replace(/\s+\{#.+\}\s*$/, "").trim();
    if (!label || /^содержание$/i.test(label) || /^contents$/i.test(label)) continue;
    const explicitIdMatch = raw.match(/\{#([^}]+)\}\s*$/);
    const id = explicitIdMatch?.[1] ?? slugifyHeading(label);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    items.push({ id, label, depth: mdMatch[1] === "###" ? 3 : 2 });
  }

  return items;
}

export function sortSubtopicsByOrder<T extends { order: number; title: string }>(items: T[]) {
  return [...items].sort((a, b) => (a.order === b.order ? a.title.localeCompare(b.title) : a.order - b.order));
}

async function readSubtopicMdxFile(filePath: string): Promise<ContentSubtopicDoc> {
  const source = await fs.readFile(filePath, "utf8");
  const meta = parseSubtopicMetaFromMdx(source, filePath);
  const toc = extractTocFromMdx(source);

  return { ...meta, filePath, toc };
}

async function listTopicMdxFilesFromAppRoutes(topicSlug: string) {
  const topicDir = path.join(process.cwd(), "src", "app", "[locale]", "5-klass", topicSlug);
  const entries = await fs.readdir(topicDir, { withFileTypes: true });
  const mdxFiles = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(topicDir, entry.name, "page.mdx"));

  const existingFiles: string[] = [];
  for (const filePath of mdxFiles) {
    try {
      const stat = await fs.stat(filePath);
      if (stat.isFile()) existingFiles.push(filePath);
    } catch {
      // ignore non-content folders without page.mdx (train/, skills/, etc.)
    }
  }

  return existingFiles;
}

export async function loadTopicSubtopicIndexFromAppRoutes(topicSlug: string): Promise<TopicContentIndex> {
  const files = await listTopicMdxFilesFromAppRoutes(topicSlug);
  const subtopics = sortSubtopicsByOrder(await Promise.all(files.map(readSubtopicMdxFile)));
  const tocBySlug = Object.fromEntries(subtopics.map((item) => [item.slug, item.toc]));

  return {
    topicSlug,
    subtopics,
    tocBySlug,
  };
}

