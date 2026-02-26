import test from "node:test";
import assert from "node:assert/strict";

import { markdownTaskToLatex } from "@/src/lib/latex/task-markdown-to-latex";

test("markdownTaskToLatex preserves inline/display math and escapes text", () => {
  const input = "Реши: $x+1=5$ и запиши 50%.\n\n$$\\\\frac{1}{2}=\\\\frac{x}{6}$$";
  const out = markdownTaskToLatex(input);

  assert.match(out, /\$x\+1=5\$/);
  assert.match(out, /\\\[/);
  assert.match(out, /\\frac\{1\}\{2\}/);
  assert.match(out, /50\\%/);
});

test("markdownTaskToLatex supports simple bold and italic markers", () => {
  const out = markdownTaskToLatex("**Важно**: *проверь* пропорцию.");
  assert.match(out, /\\textbf\{Важно\}/);
  assert.match(out, /\\textit\{проверь\}/);
});
