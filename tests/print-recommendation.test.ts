import test from "node:test";
import assert from "node:assert/strict";

import { recommendPrintLayout } from "@/src/lib/variants/print-recommendation";

test("recommends two-up for light lesson variants", () => {
  const rec = recommendPrintLayout({
    workType: "lesson",
    variantTaskCounts: [10, 10],
  });

  assert.equal(rec.recommendedLayout, "two");
  assert.ok(rec.reasonCodes.includes("LIGHT_VARIANTS"));
});

test("recommends single for heavy variants", () => {
  const rec = recommendPrintLayout({
    workType: "quiz",
    variantTaskCounts: [20, 20],
  });

  assert.equal(rec.recommendedLayout, "single");
  assert.ok(rec.reasonCodes.includes("LONG_VARIANT"));
});

test("recommends single by default for tests", () => {
  const rec = recommendPrintLayout({
    workType: "test",
    variantTaskCounts: [10, 10],
  });

  assert.equal(rec.recommendedLayout, "single");
  assert.ok(rec.reasonCodes.includes("TEST_DEFAULT"));
});

