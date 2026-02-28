import test from "node:test";
import assert from "node:assert/strict";

import { getTasksForTopic } from "@/lib/tasks/query";
import { buildVariantPlan } from "@/src/lib/variants/plan";
import { buildDemoTemplate } from "@/src/lib/teacher-tools/demo";
import { getTeacherToolsTopicSkills } from "@/src/lib/teacher-tools/catalog";

test("math.negative_numbers topic is available in teacher tools and can generate", async () => {
  const topic = await getTeacherToolsTopicSkills("math.negative_numbers");
  assert.ok(topic, "Expected topic payload for math.negative_numbers");

  const readySkills = topic.skills.filter((skill) => skill.status !== "soon");
  assert.ok(readySkills.length >= 4, "Expected at least 4 ready skills");

  for (const skill of readySkills) {
    assert.ok(
      (skill.availableCount ?? 0) >= 5,
      `Expected >= 5 tasks for skill ${skill.id}, got ${skill.availableCount ?? 0}`,
    );
  }

  const { tasks, errors } = await getTasksForTopic("math.negative_numbers");
  assert.deepEqual(errors, []);

  const skillsById = new Map(readySkills.map((skill) => [skill.id, { title: skill.title }]));

  const plan20 = readySkills.slice(0, 4).map((skill) => ({
    skillId: skill.id,
    count: 5,
  }));
  const template20 = buildDemoTemplate({
    topicId: "math.negative_numbers",
    plan: plan20,
    skillsById,
    mode: "control20",
  });

  const selected20 = buildVariantPlan({
    tasks,
    template: template20,
    seed: "g6-negative-20",
  });
  assert.equal(selected20.length, 20);

  const plan10 = readySkills.slice(0, 4).map((skill, index) => ({
    skillId: skill.id,
    count: index < 2 ? 3 : 2,
  }));
  const template10 = buildDemoTemplate({
    topicId: "math.negative_numbers",
    plan: plan10,
    skillsById,
    mode: "training10",
  });

  const selected10 = buildVariantPlan({
    tasks,
    template: template10,
    seed: "g6-negative-10",
  });
  assert.equal(selected10.length, 10);
});
