import test from "node:test";
import assert from "node:assert/strict";

import { renderWorkTwoLandscapeLatex } from "@/src/lib/latex/templates/work-two-landscape";
import type { PrintableWorkDocument } from "@/src/lib/variants/printable-work";

test("renderWorkTwoLandscapeLatex uses landscape geometry and minipage columns", () => {
  const doc: PrintableWorkDocument = {
    workId: "w1",
    locale: "ru",
    topicId: "g5.proporcii",
    title: "Работа",
    workType: "quiz",
    profile: { layout: "two", orientation: "landscape" },
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
            statementMd: "Найди x: 2x=10.",
            print: {
              textChars: 14,
              lineBreaks: 0,
              hasKatex: false,
              hasDisplayMath: false,
              hasFractionLike: false,
              estimatedLines: 1,
              complexity: "short",
              answerSpaceHint: "inline",
            },
          },
        ],
      },
      {
        variantId: "v2",
        variantNo: 2,
        title: "Вариант 2",
        createdAt: new Date("2026-02-26T10:00:02.000Z"),
        tasksCount: 1,
        tasks: [
          {
            taskId: "t2",
            skillId: "s2",
            orderIndex: 0,
            statementMd: "Реши: $x+1=5$.",
            print: {
              textChars: 14,
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

  const tex = renderWorkTwoLandscapeLatex(doc);
  assert.match(tex, /a4paper,landscape/);
  assert.match(tex, /minipage/);
  assert.match(tex, /Вариант №1/);
  assert.match(tex, /Вариант №2/);
  assert.match(tex, /\\sloppy/);
  assert.match(tex, /\\setlength\{\\emergencystretch\}\{2em\}/);
});
