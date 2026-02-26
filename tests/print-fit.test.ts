import test from "node:test";
import assert from "node:assert/strict";

import { analyzeVariantPrintFit, analyzeWorkPrintFit } from "@/src/lib/variants/print-fit";

test("variant print-fit detects long text and katex", () => {
  const metrics = analyzeVariantPrintFit([
    { statement_md: "x = 2" },
    { statement_md: `Очень длинная задача ${"а".repeat(240)} \\frac{1}{2}` },
  ]);

  assert.equal(metrics.tasksCount, 2);
  assert.equal(metrics.hasLongWordProblem, true);
  assert.equal(metrics.hasKatex, true);
  assert.ok(metrics.maxTaskChars >= 220);
});

test("work print-fit disallows two-up for heavy work", () => {
  const fit = analyzeWorkPrintFit({
    workType: "quiz",
    variants: [
      { tasksCount: 20, totalTextChars: 1500, maxTaskChars: 120, hasLongWordProblem: false, hasKatex: false },
      { tasksCount: 20, totalTextChars: 1300, maxTaskChars: 130, hasLongWordProblem: false, hasKatex: true },
    ],
  });

  assert.equal(fit.allowTwoUp, false);
  assert.equal(fit.recommendedLayout, "single");
  assert.ok(fit.reasons.some((r) => /объём текста|много задач/i.test(r)));
});

test("work print-fit allows two-up for light lesson", () => {
  const fit = analyzeWorkPrintFit({
    workType: "lesson",
    variants: [
      { tasksCount: 8, totalTextChars: 500, maxTaskChars: 90, hasLongWordProblem: false, hasKatex: false },
      { tasksCount: 10, totalTextChars: 650, maxTaskChars: 110, hasLongWordProblem: false, hasKatex: false },
    ],
  });

  assert.equal(fit.allowTwoUp, true);
  assert.equal(fit.recommendedLayout, "two");
});

test("work print-fit prefers single for test even if two-up allowed", () => {
  const fit = analyzeWorkPrintFit({
    workType: "test",
    variants: [
      { tasksCount: 8, totalTextChars: 500, maxTaskChars: 90, hasLongWordProblem: false, hasKatex: false },
    ],
  });

  assert.equal(fit.allowTwoUp, true);
  assert.equal(fit.recommendedLayout, "single");
  assert.ok(fit.reasons.some((r) => /Контрольная/i.test(r)));
});

