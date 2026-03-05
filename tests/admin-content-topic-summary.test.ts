import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAdminContentPayload,
  buildAdminContentTopicSummary,
} from "@/src/lib/admin/content-registry";
import type { TeacherToolsTopicConfig } from "@/src/lib/teacher-tools/types";

test("buildAdminContentTopicSummary keeps healthy topic metrics when another topic fails", () => {
  const okTopic: TeacherToolsTopicConfig = {
    topicId: "math.ok",
    title: { ru: "OK", en: "OK", de: "OK" },
    skills: [
      {
        id: "math.ok.s1",
        title: "Skill 1",
        summary: "",
        status: "ready",
      },
      {
        id: "math.ok.s2",
        title: "Skill 2",
        summary: "",
        status: "ready",
      },
    ],
  };

  const brokenTopic: TeacherToolsTopicConfig = {
    topicId: "math.broken",
    title: { ru: "Broken", en: "Broken", de: "Broken" },
    skills: [
      {
        id: "math.broken.s1",
        title: "Broken Skill",
        summary: "",
        status: "ready",
      },
    ],
  };

  const okSummary = buildAdminContentTopicSummary({
    topic: okTopic,
    meta: { domain: "algebra", status: "ready", levels: [5] },
    detailed: {
      gradeTags: [5],
      routes: [{ id: "r1" }],
      skillEdges: [{ from: "math.ok.s1", to: "math.ok.s2" }],
      skills: [
        {
          id: "math.ok.s1",
          title: "Skill 1",
          availableCount: 7,
          status: "ready",
          kind: "compute",
        },
        {
          id: "math.ok.s2",
          title: "Skill 2",
          availableCount: 3,
          status: "ready",
          kind: "compute",
        },
      ],
    },
  });

  const brokenSummary = buildAdminContentTopicSummary({
    topic: brokenTopic,
    meta: { domain: "geometry", status: "soon", levels: [6] },
    errorMessage: "task bank failed",
  });

  const payload = buildAdminContentPayload({
    summaries: [brokenSummary, okSummary],
    unconfiguredSlugs: [],
  });

  const okFromPayload = payload.topics.find((item) => item.topicId === "math.ok");
  const brokenFromPayload = payload.topics.find((item) => item.topicId === "math.broken");

  assert.ok(okFromPayload, "Expected healthy topic summary");
  assert.ok(brokenFromPayload, "Expected broken topic summary");

  assert.equal(okFromPayload.tasksTotal, 10);
  assert.equal(okFromPayload.skillsWithTasks, 2);
  assert.deepEqual(okFromPayload.warnings, []);

  assert.equal(brokenFromPayload.tasksTotal, 0);
  assert.equal(brokenFromPayload.skillsWithTasks, 0);
  assert.deepEqual(brokenFromPayload.warnings, ["task bank failed"]);
});
