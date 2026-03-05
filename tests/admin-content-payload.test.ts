import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAdminContentPayload,
  type ContentTopicSummary,
} from "@/src/app/api/admin/content/route";

test("buildAdminContentPayload includes global warnings and unconfigured count", () => {
  const summaries: ContentTopicSummary[] = [
    {
      topicId: "math.z_topic",
      title: { ru: "Z", en: "Z", de: "Z" },
      domain: "algebra",
      status: "ready",
      levels: [5],
      gradeTags: [5],
      skillsTotal: 2,
      skillsWithTasks: 1,
      tasksTotal: 8,
      routesTotal: 1,
      prereqEdgesTotal: 1,
      skills: [],
      warnings: ["topic_warning"],
    },
    {
      topicId: "math.a_topic",
      title: { ru: "A", en: "A", de: "A" },
      domain: "arithmetic",
      status: "soon",
      levels: [6],
      gradeTags: [6],
      skillsTotal: 3,
      skillsWithTasks: 3,
      tasksTotal: 12,
      routesTotal: 2,
      prereqEdgesTotal: 4,
      skills: [],
      warnings: [],
    },
  ];

  const payload = buildAdminContentPayload({
    summaries,
    unconfiguredSlugs: ["new-topic", "another-topic"],
  });

  assert.equal(payload.ok, true);
  assert.deepEqual(payload.globalWarnings, [
    "topic_not_configured_in_teacher_tools:new-topic",
    "topic_not_configured_in_teacher_tools:another-topic",
  ]);
  assert.equal(payload.summary.unconfiguredTopics, 2);
  assert.equal(payload.summary.topicsTotal, 2);
  assert.equal(payload.summary.skillsTotal, 5);
  assert.equal(payload.summary.tasksTotal, 20);
  assert.equal(payload.summary.topicsWithWarnings, 1);
  assert.deepEqual(payload.topics.map((item) => item.topicId), ["math.a_topic", "math.z_topic"]);
});
