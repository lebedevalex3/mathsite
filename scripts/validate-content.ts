import { promises as fs } from "node:fs";
import path from "node:path";

import { loadTopicSubtopicIndex } from "../src/lib/content";
import { listContentTopicConfigs } from "../src/lib/content/topic-registry";

function rel(filePath: string) {
  return path.relative(process.cwd(), filePath) || filePath;
}

function expectedSlugFromFilePath(filePath: string) {
  if (filePath.endsWith(path.join("page.mdx"))) {
    return path.basename(path.dirname(filePath));
  }
  if (filePath.endsWith(".mdx")) {
    return path.basename(filePath, ".mdx");
  }
  return path.basename(filePath);
}

function parseArgs(argv: string[]) {
  return {
    strictSections: argv.includes("--strict-sections"),
  };
}

function hasAtLeastOneId(ids: Set<string>, candidates: string[]) {
  return candidates.some((id) => ids.has(id));
}

async function validateTopicContent(
  topicSlug: string,
  options?: { domain?: string; strictSections?: boolean; routePathSegments?: string[]; defaultLocale?: string },
) {
  const index = await loadTopicSubtopicIndex(topicSlug, {
    domain: options?.domain,
    locale: options?.defaultLocale ?? "ru",
  });
  const errors: string[] = [];
  const seenSlug = new Map<string, string>();
  const seenOrder = new Map<number, string>();

  for (const item of index.subtopics) {
    const expectedSlug = expectedSlugFromFilePath(item.filePath);

    if (item.slug !== expectedSlug) {
      errors.push(`${rel(item.filePath)}: subtopicMeta.slug="${item.slug}" must match path slug "${expectedSlug}"`);
    }

    if (item.title.trim().length === 0) {
      errors.push(`${rel(item.filePath)}: subtopicMeta.title must not be empty`);
    }

    if (!Number.isInteger(item.order) || item.order <= 0) {
      errors.push(`${rel(item.filePath)}: subtopicMeta.order must be a positive integer`);
    }

    const prevSlugFile = seenSlug.get(item.slug);
    if (prevSlugFile) {
      errors.push(`Duplicate subtopic slug "${item.slug}" in ${rel(item.filePath)} (already in ${rel(prevSlugFile)})`);
    } else {
      seenSlug.set(item.slug, item.filePath);
    }

    const prevOrderFile = seenOrder.get(item.order);
    if (prevOrderFile) {
      errors.push(`Duplicate subtopic order "${item.order}" in ${rel(item.filePath)} (already in ${rel(prevOrderFile)})`);
    } else {
      seenOrder.set(item.order, item.filePath);
    }

    const raw = await fs.readFile(item.filePath, "utf8");
    if (!/<h2\s+id=["']toc["']/.test(raw)) {
      errors.push(`${rel(item.filePath)}: missing "<h2 id=\\"toc\\">" section`);
    }

    const tocHrefIds = [...raw.matchAll(/<a\s+href=["']#([^"']+)["']/g)].map((m) => m[1]).filter(Boolean);
    if (tocHrefIds.length === 0) {
      errors.push(`${rel(item.filePath)}: TOC section is empty (add at least one <a href="#..."> item)`);
    }

    const headingIdList = [...raw.matchAll(/<h[23]\s+id=["']([^"']+)["']/g)].map((m) => m[1]).filter(Boolean);
    const headingIds = new Set(headingIdList);
    const duplicateHeadingIds = [...new Set(headingIdList.filter((id, i) => headingIdList.indexOf(id) !== i))];
    for (const duplicateId of duplicateHeadingIds) {
      errors.push(`${rel(item.filePath)}: duplicate heading id "${duplicateId}"`);
    }
    for (const anchorId of tocHrefIds) {
      if (!headingIds.has(anchorId)) {
        errors.push(`${rel(item.filePath)}: TOC href "#${anchorId}" has no matching heading id`);
      }
    }

    if (item.toc.length === 0) {
      errors.push(`${rel(item.filePath)}: sidebar TOC is empty (add h2/h3 headings with ids)`);
    }

    if (options?.strictSections) {
      if (!hasAtLeastOneId(headingIds, ["opredelenie", "ideya", "idea"])) {
        errors.push(`${rel(item.filePath)}: strict sections check: missing idea/definition section heading id`);
      }
      if (!hasAtLeastOneId(headingIds, ["algoritm", "algoritm-resheniya", "algorithm"])) {
        errors.push(`${rel(item.filePath)}: strict sections check: missing algorithm section heading id`);
      }
      if (!hasAtLeastOneId(headingIds, ["mistakes", "oshibki", "tipichnye-oshibki"])) {
        errors.push(`${rel(item.filePath)}: strict sections check: missing mistakes section heading id`);
      }
      if (!hasAtLeastOneId(headingIds, ["praktika", "practice"])) {
        errors.push(`${rel(item.filePath)}: strict sections check: missing practice section heading id`);
      }
    }
  }

  if (options?.routePathSegments) {
    const routeTopicDir = path.join(process.cwd(), "src", "app", "[locale]", ...options.routePathSegments);
    const topicRoutePage = path.join(routeTopicDir, "page.tsx");
    try {
      const stat = await fs.stat(topicRoutePage);
      if (!stat.isFile()) errors.push(`${rel(topicRoutePage)}: expected topic route page wrapper`);
    } catch {
      errors.push(`${rel(topicRoutePage)}: missing topic route page wrapper for Stage 2C topic`);
    }

    for (const item of index.subtopics) {
      const wrapperFile = path.join(routeTopicDir, item.slug, "page.tsx");
      try {
        const stat = await fs.stat(wrapperFile);
        if (!stat.isFile()) errors.push(`${rel(wrapperFile)}: expected subtopic route wrapper`);
      } catch {
        errors.push(`${rel(wrapperFile)}: missing subtopic route wrapper for content file ${rel(item.filePath)}`);
      }
    }
  }

  return {
    topic: index.topicSlug,
    count: index.subtopics.length,
    errors,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const configs = listContentTopicConfigs();
  const results = await Promise.all(
    configs.map((config) =>
      validateTopicContent(config.topicSlug, {
        domain: config.domain,
        routePathSegments: config.routePathSegments,
        defaultLocale: config.defaultLocale,
        strictSections: args.strictSections,
      }),
    ),
  );

  const totalErrors = results.reduce((sum, result) => sum + result.errors.length, 0);

  console.log("Content validation summary");
  for (const result of results) {
    console.log(`- Topic: ${result.topic} (subtopics: ${result.count}, errors: ${result.errors.length})`);
  }
  if (args.strictSections) {
    console.log("- Mode: strict sections");
  }

  if (totalErrors > 0) {
    console.error(`- Total errors: ${totalErrors}`);
    for (const result of results) {
      for (const error of result.errors) {
        console.error(`  * ${error}`);
      }
    }
    process.exitCode = 1;
    return;
  }

  console.log("- Total errors: 0");
  console.log("OK");
}

main().catch((error) => {
  console.error("Content validation failed with unexpected error.");
  console.error(error);
  process.exitCode = 1;
});
