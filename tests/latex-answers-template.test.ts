import test from "node:test";
import assert from "node:assert/strict";

import { renderWorkAnswersLatex } from "@/src/lib/latex/templates/work-answers";
import type { PrintableWorkDocument } from "@/src/lib/variants/printable-work";

const doc: PrintableWorkDocument = {
  workId: "w1",
  locale: "ru",
  topicId: "math.proportion",
  title: "Работа",
  workType: "quiz",
  profile: { layout: "single", orientation: "portrait" },
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  variants: [
    {
      variantId: "v1",
      variantNo: 1,
      title: "Вариант",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      tasksCount: 2,
      tasks: [
        {
          taskId: "t1",
          skillId: "s1",
          orderIndex: 0,
          statementMd: "x",
          answerText: "3",
          print: {
            textChars: 1,
            lineBreaks: 0,
            hasKatex: false,
            hasDisplayMath: false,
            hasFractionLike: false,
            estimatedLines: 1,
            complexity: "short",
            answerSpaceHint: "inline",
          },
        },
        {
          taskId: "t2",
          skillId: "s1",
          orderIndex: 1,
          statementMd: "y",
          answerText: String.raw`\frac{1}{2}`,
          print: {
            textChars: 1,
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
  ],
};

test("renderWorkAnswersLatex renders variant sections and answers", () => {
  const tex = renderWorkAnswersLatex(doc);
  assert.match(tex, /\\section\*\{Вариант 1\}/);
  assert.match(tex, /\\begin\{enumerate\}/);
  assert.match(tex, /\\item 3/);
  assert.ok(tex.includes("\\item \\textbackslash\\{\\}frac\\{1\\}\\{2\\}"));
});
