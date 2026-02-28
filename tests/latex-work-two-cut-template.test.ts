import test from "node:test";
import assert from "node:assert/strict";

import { renderWorkTwoCutLandscapeLatex } from "@/src/lib/latex/templates/work-two-cut-landscape";
import type { PrintableWorkDocument } from "@/src/lib/variants/printable-work";
import type { PrintableTask } from "@/src/lib/variants/printable-task";

function makeTask(taskId: string, orderIndex: number, estimatedLines: number): PrintableTask {
  return {
    taskId,
    skillId: "s1",
    orderIndex,
    statementMd: `Задача ${orderIndex + 1}`,
    print: {
      textChars: 20,
      lineBreaks: 0,
      hasKatex: false,
      hasDisplayMath: false,
      hasFractionLike: false,
      estimatedLines,
      complexity: "short",
      answerSpaceHint: "inline",
    },
  };
}

test("renderWorkTwoCutLandscapeLatex swaps columns on back side for cut-safe layout", () => {
  const makeVariant = (variantNo: number, variantId: string) => ({
    variantId,
    variantNo,
    title: `Вариант ${variantNo}`,
    createdAt: new Date("2026-02-26T10:00:00.000Z"),
    tasksCount: 7,
    // 6 tasks * (estimatedLines 1 + item overhead 1) = 12 lines.
    // With first-frame capacity 12, the 7th task spills to frame 2,
    // so we can observe front/back reordering.
    tasks: Array.from({ length: 7 }, (_, i) => makeTask(`${variantId}-${i}`, i, 1)),
  });

  const doc: PrintableWorkDocument = {
    workId: "w1",
    locale: "ru",
    topicId: "math.proportion",
    title: "Работа",
    workType: "quiz",
    profile: { layout: "two_cut", orientation: "landscape" },
    createdAt: new Date("2026-02-26T10:00:00.000Z"),
    variants: [makeVariant(1, "v1"), makeVariant(2, "v2")],
  };

  const tex = renderWorkTwoCutLandscapeLatex(doc);

  assert.match(tex, /a4paper,landscape/);
  // front side order: v1 left, v2 right
  const frontV1 = tex.indexOf("Вариант №1");
  const frontV2 = tex.indexOf("Вариант №2");
  assert.ok(frontV1 >= 0 && frontV2 > frontV1);

  // back side order should swap: v2(continued) appears before v1(continued)
  const backV2 = tex.indexOf("Вариант №2\\ (\\textit{продолжение})");
  const backV1 = tex.indexOf("Вариант №1\\ (\\textit{продолжение})");
  assert.ok(backV2 >= 0 && backV1 > backV2);
});
