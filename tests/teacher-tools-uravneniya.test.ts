import test from "node:test";
import assert from "node:assert/strict";

import { getTasksForTopic } from "@/lib/tasks/query";
import { buildVariantPlan } from "@/src/lib/variants/plan";
import { buildDemoTemplate } from "@/src/lib/teacher-tools/demo";
import {
  getTeacherToolsTopicSkills,
  listTeacherToolsTopics,
} from "@/src/lib/teacher-tools/catalog";

test('teacher tools catalog includes topic "math.equations"', async () => {
  const topics = listTeacherToolsTopics();
  const topic = topics.find((item) => item.topicId === "math.equations");

  assert.ok(topic, "Expected math.equations in teacher tools topics");
  assert.ok((topic?.skills.length ?? 0) >= 5, "Expected at least 5 skills in topic config");
});

test("math.equations skills have task counts and generator builds variants", async () => {
  const topic = await getTeacherToolsTopicSkills("math.equations");
  assert.ok(topic, "Expected topic payload for math.equations");

  const readySkills = topic.skills.filter((skill) => skill.status !== "soon");
  assert.ok(readySkills.length >= 5, "Expected at least 5 ready skills");

  for (const skill of readySkills) {
    assert.ok(
      (skill.availableCount ?? 0) >= 5,
      `Expected >= 5 tasks for skill ${skill.id}, got ${skill.availableCount ?? 0}`,
    );
  }

  const { tasks, errors } = await getTasksForTopic("math.equations");
  assert.deepEqual(errors, []);

  const skillsById = new Map(readySkills.map((skill) => [skill.id, { title: skill.title }]));
  const plan20 = readySkills.slice(0, 6).map((skill, index) => ({
    skillId: skill.id,
    count: index < 2 ? 4 : 3,
  }));
  const template20 = buildDemoTemplate({
    topicId: "math.equations",
    plan: plan20,
    skillsById,
    mode: "control20",
  });

  const selected20 = buildVariantPlan({
    tasks,
    template: template20,
    seed: "uravneniya-20",
  });
  assert.equal(selected20.length, 20);

  const plan10 = readySkills.slice(0, 6).map((skill, index) => ({
    skillId: skill.id,
    count: index < 4 ? 2 : 1,
  }));
  const template10 = buildDemoTemplate({
    topicId: "math.equations",
    plan: plan10,
    skillsById,
    mode: "training10",
  });

  const selected10 = buildVariantPlan({
    tasks,
    template: template10,
    seed: "uravneniya-10",
  });
  assert.equal(selected10.length, 10);
});

test("teacher demo template supports mixed skills from multiple topics", async () => {
  const [proportion, uravneniya] = await Promise.all([
    getTeacherToolsTopicSkills("math.proportion"),
    getTeacherToolsTopicSkills("math.equations"),
  ]);
  assert.ok(proportion && uravneniya, "Expected both topics in teacher tools catalog");

  const proportionSkill = proportion.skills.find((skill) => (skill.availableCount ?? 0) >= 2);
  const uravneniyaSkill = uravneniya.skills.find((skill) => (skill.availableCount ?? 0) >= 2);
  assert.ok(proportionSkill && uravneniyaSkill, "Expected at least one populated skill in each topic");

  const [proportionTasks, uravneniyaTasks] = await Promise.all([
    getTasksForTopic("math.proportion"),
    getTasksForTopic("math.equations"),
  ]);
  assert.deepEqual(proportionTasks.errors, []);
  assert.deepEqual(uravneniyaTasks.errors, []);

  const template = buildDemoTemplate({
    topicId: "math.proportion",
    plan: [
      { topicId: "math.proportion", skillId: proportionSkill.id, count: 2 },
      { topicId: "math.equations", skillId: uravneniyaSkill.id, count: 2 },
    ],
    skillsById: new Map([
      [proportionSkill.id, { title: proportionSkill.title }],
      [uravneniyaSkill.id, { title: uravneniyaSkill.title }],
    ]),
    mode: "mixed20",
  });

  const selected = buildVariantPlan({
    tasks: [...proportionTasks.tasks, ...uravneniyaTasks.tasks],
    template,
    seed: "mixed-topics-seed",
  });
  assert.equal(selected.length, 4);
  const selectedSkillIds = new Set(selected.map((item) => item.task.skill_id));
  assert.ok(selectedSkillIds.has(proportionSkill.id));
  assert.ok(selectedSkillIds.has(uravneniyaSkill.id));
});
