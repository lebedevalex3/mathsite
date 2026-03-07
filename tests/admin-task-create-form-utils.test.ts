import assert from "node:assert/strict";
import test from "node:test";

import { filterTaskSkillsByTopic, validateTaskSkillSelection } from "@/src/components/ui/admin-task-create-form.utils";

const skillItems = [
  {
    topicId: "math.proportion",
    skillId: "math.proportion.find_unknown_term",
    title: "Find unknown term",
  },
  {
    topicId: "math.proportion",
    skillId: "math.proportion.transform_ratio",
    title: "Transform ratio",
  },
  {
    topicId: "math.equations",
    skillId: "math.equations.check_root",
    title: "Check root",
  },
];

test("filterTaskSkillsByTopic applies topic scope and query", () => {
  const result = filterTaskSkillsByTopic(skillItems, "math.proportion", "unknown");
  assert.equal(result.length, 1);
  assert.equal(result[0]?.skillId, "math.proportion.find_unknown_term");
});

test("validateTaskSkillSelection requires skill id", () => {
  const error = validateTaskSkillSelection({
    skillIdRaw: " ",
    topicId: "math.proportion",
    topicSkillSet: new Set(["math.proportion.find_unknown_term"]),
    requiredMessage: "required",
    invalidMessage: "invalid",
  });
  assert.equal(error, "required");
});

test("validateTaskSkillSelection rejects skill that is outside selected topic", () => {
  const error = validateTaskSkillSelection({
    skillIdRaw: "math.equations.check_root",
    topicId: "math.proportion",
    topicSkillSet: new Set(["math.proportion.find_unknown_term"]),
    requiredMessage: "required",
    invalidMessage: "invalid",
  });
  assert.equal(error, "invalid");
});

test("create-task flow: topic + valid skill passes validation", () => {
  const options = filterTaskSkillsByTopic(skillItems, "math.proportion", "transform");
  assert.equal(options.length, 1);
  const selectedSkillId = options[0]?.skillId ?? "";

  const error = validateTaskSkillSelection({
    skillIdRaw: selectedSkillId,
    topicId: "math.proportion",
    topicSkillSet: new Set(options.map((item) => item.skillId)),
    requiredMessage: "required",
    invalidMessage: "invalid",
  });
  assert.equal(error, null);
});

