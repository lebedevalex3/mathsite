import test from "node:test";
import assert from "node:assert/strict";

import { getSkillKind } from "@/src/lib/skills/kind";

test("getSkillKind returns explicit kind for modern skill", () => {
  assert.equal(getSkillKind({ kind: "equation" }), "equation");
});

test("getSkillKind falls back to compute for legacy skill without kind", () => {
  assert.equal(getSkillKind({}), "compute");
});
