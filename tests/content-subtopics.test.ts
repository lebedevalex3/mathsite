import test from "node:test";
import assert from "node:assert/strict";

import {
  extractTocFromMdx,
  parseSubtopicMetaFromMdx,
  sortSubtopicsByOrder,
} from "@/src/lib/content/subtopics";

test("parseSubtopicMetaFromMdx parses metadata export", () => {
  const mdx = `
import { SubtopicPageTemplate } from "../subtopic-page-template";

export const subtopicMeta = {
  title: "Прямая пропорциональность",
  slug: "direct",
  order: 20,
} as const;

export default function Page() { return null; }
`;

  const meta = parseSubtopicMetaFromMdx(mdx, "direct/page.mdx");
  assert.deepEqual(meta, {
    title: "Прямая пропорциональность",
    slug: "direct",
    order: 20,
  });
});

test("extractTocFromMdx extracts TOC from HTML headings and skips #toc", () => {
  const mdx = `
<h2 id="toc">Содержание</h2>
<h2 id="opredelenie">Определение</h2>
<h2 id="algoritm">Алгоритм</h2>
<h3 id="shag-1">Шаг 1</h3>
`;

  const toc = extractTocFromMdx(mdx);
  assert.deepEqual(toc, [
    { id: "opredelenie", label: "Определение", depth: 2 },
    { id: "algoritm", label: "Алгоритм", depth: 2 },
    { id: "shag-1", label: "Шаг 1", depth: 3 },
  ]);
});

test("sortSubtopicsByOrder sorts by order then title", () => {
  const sorted = sortSubtopicsByOrder([
    { title: "B", order: 20 },
    { title: "A", order: 10 },
    { title: "C", order: 20 },
  ]);

  assert.deepEqual(sorted, [
    { title: "A", order: 10 },
    { title: "B", order: 20 },
    { title: "C", order: 20 },
  ]);
});
