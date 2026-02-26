import test from "node:test";
import assert from "node:assert/strict";

import { selectWorkPdfEngine } from "@/src/lib/pdf-engines/select-engine";

function withEnv<T>(patch: Record<string, string | undefined>, fn: () => T): T {
  const prev = new Map<string, string | undefined>();
  for (const [key, value] of Object.entries(patch)) {
    prev.set(key, process.env[key]);
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  try {
    return fn();
  } finally {
    for (const [key, value] of prev.entries()) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test("query engine overrides policy", () => {
  const selected = withEnv({ LATEX_PDF_ENABLED: "1" }, () =>
    selectWorkPdfEngine({ requestedEngine: "chromium", layout: "two" }),
  );
  assert.deepEqual(selected, { engine: "chromium", source: "query" });
});

test("two-up prefers latex when enabled", () => {
  const selected = withEnv({ LATEX_PDF_ENABLED: "1", PDF_PREFER_LATEX_FOR_TWO_UP: undefined }, () =>
    selectWorkPdfEngine({ requestedEngine: null, layout: "two" }),
  );
  assert.deepEqual(selected, { engine: "latex", source: "layout_policy" });
});

test("two_dup prefers latex when enabled", () => {
  const selected = withEnv({ LATEX_PDF_ENABLED: "1", PDF_PREFER_LATEX_FOR_TWO_UP: undefined }, () =>
    selectWorkPdfEngine({ requestedEngine: null, layout: "two_dup" }),
  );
  assert.deepEqual(selected, { engine: "latex", source: "layout_policy" });
});

test("two_cut falls back when latex does not support this layout", () => {
  const selected = withEnv({ LATEX_PDF_ENABLED: "1" }, () =>
    selectWorkPdfEngine({
      requestedEngine: null,
      layout: "two_cut",
      supportedLatexLayouts: ["single", "two"],
    }),
  );
  assert.deepEqual(selected, { engine: "chromium", source: "default" });
});

test("two-up falls back to chromium when latex disabled", () => {
  const selected = withEnv({ LATEX_PDF_ENABLED: undefined }, () =>
    selectWorkPdfEngine({ requestedEngine: null, layout: "two" }),
  );
  assert.deepEqual(selected, { engine: "chromium", source: "default" });
});

test("single uses configured default engine", () => {
  const selected = withEnv({ LATEX_PDF_ENABLED: "1", PDF_ENGINE_DEFAULT: "latex" }, () =>
    selectWorkPdfEngine({ requestedEngine: null, layout: "single" }),
  );
  assert.deepEqual(selected, { engine: "latex", source: "default" });
});

test("latex default falls back to chromium when unsupported for layout", () => {
  const selected = withEnv({ LATEX_PDF_ENABLED: "1", PDF_ENGINE_DEFAULT: "latex" }, () =>
    selectWorkPdfEngine({
      requestedEngine: null,
      layout: "two_cut",
      supportedLatexLayouts: ["single", "two"],
    }),
  );
  assert.deepEqual(selected, { engine: "chromium", source: "default" });
});
