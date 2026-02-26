import test from "node:test";
import assert from "node:assert/strict";

import { renderWorkTwoDuplicateLandscapeLatex } from "@/src/lib/latex/templates/work-two-duplicate-landscape";
import type { PrintableWorkDocument } from "@/src/lib/variants/printable-work";

test("renderWorkTwoDuplicateLandscapeLatex duplicates the same variant in two columns", () => {
  const doc: PrintableWorkDocument = {
    workId: "w1",
    locale: "ru",
    topicId: "g5.proporcii",
    title: "Работа",
    workType: "lesson",
    profile: { layout: "two_dup", orientation: "landscape" },
    createdAt: new Date("2026-02-26T10:00:00.000Z"),
    variants: [
      {
        variantId: "v1",
        variantNo: 1,
        title: "Вариант 1",
        createdAt: new Date("2026-02-26T10:00:01.000Z"),
        tasksCount: 1,
        tasks: [
          {
            taskId: "t1",
            skillId: "s1",
            orderIndex: 0,
            statementMd: "Найди x: $x+2=5$.",
            print: {
              textChars: 16,
              lineBreaks: 0,
              hasKatex: true,
              hasDisplayMath: false,
              hasFractionLike: false,
              estimatedLines: 1,
              complexity: "short",
              answerSpaceHint: "short",
            },
          },
        ],
      },
    ],
  };

  const tex = renderWorkTwoDuplicateLandscapeLatex(doc);
  assert.match(tex, /a4paper,landscape/);
  assert.match(tex, /minipage/);

  const occurrences = (tex.match(/Вариант №1/g) ?? []).length;
  assert.equal(occurrences, 2);
});

