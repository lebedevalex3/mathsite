import test from "node:test";
import assert from "node:assert/strict";

import { analyzePrereqs, validateSkillEdges, type SkillPrereqEdge } from "@/src/lib/teacher-tools/prereqs";

test("validateSkillEdges detects missing prereq skill ids", () => {
  const edges: SkillPrereqEdge[] = [
    {
      topic_id: "math.proportion",
      skill_id: "math.proportion.find_unknown_term",
      relation: "required",
      prereq: { prereq_skill_id: "math.proportion.unknown" },
    },
  ];

  const result = validateSkillEdges({
    topicId: "math.proportion",
    edges,
    taxonomySkillIds: new Set(["math.proportion.find_unknown_term"]),
  });

  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0] ?? "", /Unknown prereq skill/);
});

test("validateSkillEdges detects cycles", () => {
  const edges: SkillPrereqEdge[] = [
    {
      topic_id: "math.proportion",
      skill_id: "math.proportion.a",
      relation: "required",
      prereq: { prereq_skill_id: "math.proportion.b" },
    },
    {
      topic_id: "math.proportion",
      skill_id: "math.proportion.b",
      relation: "required",
      prereq: { prereq_skill_id: "math.proportion.a" },
    },
  ];

  const result = validateSkillEdges({
    topicId: "math.proportion",
    edges,
    taxonomySkillIds: new Set(["math.proportion.a", "math.proportion.b"]),
  });

  assert.ok(result.errors.some((message) => message.includes("Cycle detected")));
});

test("analyzePrereqs groups missing required/recommended and deduplicates", () => {
  const edges: SkillPrereqEdge[] = [
    {
      topic_id: "math.proportion",
      skill_id: "math.proportion.find_unknown_term",
      relation: "required",
      prereq: { prereq_skill_id: "math.proportion.apply_proportion_property" },
      priority: 1,
      reason: "База для поиска неизвестного.",
    },
    {
      topic_id: "math.proportion",
      skill_id: "math.proportion.solve_hidden_linear_fraction",
      relation: "required",
      prereq: { prereq_skill_id: "math.proportion.apply_proportion_property" },
      priority: 2,
      reason: "Нужно для преобразований.",
    },
    {
      topic_id: "math.proportion",
      skill_id: "math.proportion.find_unknown_term",
      relation: "recommended",
      prereq: { any_of: ["math.proportion.transform_ratio", "math.proportion.compare_ratio_multiples"] },
      priority: 3,
      reason: "Помогает проверять ответ.",
    },
  ];

  const result = analyzePrereqs({
    selectedSkillIds: new Set(["math.proportion.find_unknown_term", "math.proportion.solve_hidden_linear_fraction"]),
    edges,
    skillTitlesById: new Map([
      ["math.proportion.apply_proportion_property", "Применять свойство пропорции"],
      ["math.proportion.transform_ratio", "Упрощать отношение"],
      ["math.proportion.compare_ratio_multiples", "Сравнивать по кратности"],
    ]),
  });

  assert.equal(result.missing_required.length, 1);
  assert.equal(result.missing_required[0]?.title, "Применять свойство пропорции");
  assert.equal(result.missing_required[0]?.priority, 1);
  assert.ok((result.missing_required[0]?.reason ?? "").includes("База"));
  assert.equal(result.missing_recommended.length, 1);
  assert.ok((result.missing_recommended[0]?.title ?? "").startsWith("Любой из:"));
});
