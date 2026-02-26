import test from "node:test";
import assert from "node:assert/strict";

import { getTasksForTopic } from "@/lib/tasks/query";
import { buildVariantPlan } from "@/src/lib/variants/plan";
import { buildDemoTemplate } from "@/src/lib/teacher-tools/demo";
import {
  getTeacherToolsTopicSkills,
  listTeacherToolsTopics,
} from "@/src/lib/teacher-tools/catalog";

test('teacher tools catalog includes topic "g5.uravneniya"', async () => {
  const topics = listTeacherToolsTopics();
  const topic = topics.find((item) => item.topicId === "g5.uravneniya");

  assert.ok(topic, "Expected g5.uravneniya in teacher tools topics");
  assert.ok((topic?.skills.length ?? 0) >= 5, "Expected at least 5 skills in topic config");
});

test("g5.uravneniya skills have task counts and generator builds variants", async () => {
  const topic = await getTeacherToolsTopicSkills("g5.uravneniya");
  assert.ok(topic, "Expected topic payload for g5.uravneniya");

  const readySkills = topic.skills.filter((skill) => skill.status !== "soon");
  assert.ok(readySkills.length >= 5, "Expected at least 5 ready skills");

  for (const skill of readySkills) {
    assert.ok(
      (skill.availableCount ?? 0) >= 5,
      `Expected >= 5 tasks for skill ${skill.id}, got ${skill.availableCount ?? 0}`,
    );
  }

  const { tasks, errors } = await getTasksForTopic("g5.uravneniya");
  assert.deepEqual(errors, []);

  const skillsById = new Map(readySkills.map((skill) => [skill.id, { title: skill.title }]));
  const plan20 = readySkills.slice(0, 6).map((skill, index) => ({
    skillId: skill.id,
    count: index < 2 ? 4 : 3,
  }));
  const template20 = buildDemoTemplate({
    topicId: "g5.uravneniya",
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
    topicId: "g5.uravneniya",
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
