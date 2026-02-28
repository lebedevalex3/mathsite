import test from "node:test";
import assert from "node:assert/strict";

import {
  buildTopicScaffoldPlan,
  insertRegistryTopicEntry,
  isKebabCaseSlug,
  parseLocalesCsv,
} from "@/src/lib/content/devtools/topic-scaffold";

test("isKebabCaseSlug validates fs-safe slugs", () => {
  assert.equal(isKebabCaseSlug("ratios"), true);
  assert.equal(isKebabCaseSlug("ratio-problems"), true);
  assert.equal(isKebabCaseSlug("Ratio"), false);
  assert.equal(isKebabCaseSlug("ratio_problems"), false);
  assert.equal(isKebabCaseSlug("ratio problems"), false);
});

test("parseLocalesCsv parses and defaults locales", () => {
  assert.deepEqual(parseLocalesCsv(undefined), ["ru", "en", "de"]);
  assert.deepEqual(parseLocalesCsv("ru,en"), ["ru", "en"]);
  assert.throws(() => parseLocalesCsv("ru,fr"));
});

test("buildTopicScaffoldPlan produces expected paths", () => {
  const plan = buildTopicScaffoldPlan("/repo", ["5-klass", "ratios"], {
    domain: "arithmetic",
    topic: "ratios",
    locales: ["ru", "en", "de"],
  });

  assert.equal(plan.contentTopicDirByLocale.ru, "/repo/content/ru/arithmetic/ratios");
  assert.equal(plan.routeTopicPageFile, "/repo/src/app/[locale]/5-klass/ratios/page.tsx");
  assert.equal(plan.topicIndexFiles.length, 3);
  assert.equal(plan.routeSubtopicPageFiles.length, 3);
  assert.equal(plan.subtopicContentFiles.length, 9);
});

test("insertRegistryTopicEntry appends topic and rejects duplicates", () => {
  const source = `const CONTENT_TOPIC_REGISTRY: Record<string, ContentTopicRegistryItem> = {\n  proportion: {\n    topicSlug: "proportion",\n  },\n};\n`;
  const inserted = insertRegistryTopicEntry(
    source,
    "ratios",
    '  ratios: {\n    topicSlug: "ratios",\n  },',
  );
  assert.match(inserted, /\bratios:\s*\{/);
  assert.throws(() =>
    insertRegistryTopicEntry(
      inserted,
      "ratios",
      '  ratios: {\n    topicSlug: "ratios",\n  },',
    ),
  );
});

