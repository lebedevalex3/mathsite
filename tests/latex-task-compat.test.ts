import test from "node:test";
import assert from "node:assert/strict";

import { analyzeLatexTaskMarkdownCompatibility } from "@/src/lib/latex/task-latex-compat";

test("analyzeLatexTaskMarkdownCompatibility returns compatible for simple markdown+math", () => {
  const report = analyzeLatexTaskMarkdownCompatibility(
    "Реши: $x+1=5$.\n\n- шаг 1\n- шаг 2",
  );
  assert.equal(report.compatible, true);
  assert.equal(report.issues.length, 0);
});

test("analyzeLatexTaskMarkdownCompatibility flags unsupported markdown constructs", () => {
  const report = analyzeLatexTaskMarkdownCompatibility(
    "Таблица:\n|a|b|\n|-|-|\n|1|2|\n\n![img](x.png)\n\n`code`",
  );
  assert.equal(report.compatible, false);
  assert.ok(report.issues.some((i) => i.code === "TABLE_MARKDOWN"));
  assert.ok(report.issues.some((i) => i.code === "IMAGE_MARKDOWN"));
  assert.ok(report.issues.some((i) => i.code === "INLINE_CODE"));
});

