import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAdminContentPayload,
  buildAdminContentSummaries,
} from "@/src/app/api/admin/content/route";
import type { TeacherToolsTopicConfig } from "@/src/lib/teacher-tools/types";

test("admin content summaries keep healthy topic data when one topic loader fails", async () => {
  const topicConfigs: TeacherToolsTopicConfig[] = [
    {
      topicId: "math.ok",
      title: { ru: "OK", en: "OK", de: "OK" },
      skills: [
        {
          id: "math.ok.s1",
          title: "Skill 1",
          summary: "",
          status: "ready",
        },
      ],
    },
    {
      topicId: "math.fail",
      title: { ru: "FAIL", en: "FAIL", de: "FAIL" },
      skills: [
        {
          id: "math.fail.s1",
          title: "Skill F",
          summary: "",
          status: "ready",
        },
      ],
    },
  ];

  const metaByTopicId = new Map([
    ["math.ok", { domain: "algebra", status: "ready" as const, levels: [5] }],
    ["math.fail", { domain: "geometry", status: "soon" as const, levels: [6] }],
  ]);

  const summaries = await buildAdminContentSummaries({
    topicConfigs,
    metaByTopicId,
    getTopicSkills: async (topicId) => {
      if (topicId === "math.fail") {
        throw new Error("topic source unavailable");
      }
      return {
        gradeTags: [5],
        routes: [{ id: "r1" }],
        skillEdges: [],
        skills: [
          {
            id: "math.ok.s1",
            title: "Skill 1",
            availableCount: 6,
            status: "ready",
            kind: "compute",
          },
        ],
      };
    },
  });

  const payload = buildAdminContentPayload({
    summaries,
    unconfiguredSlugs: [],
  });

  assert.equal(payload.ok, true);
  assert.equal(payload.topics.length, 2);
  assert.equal(payload.summary.topicsTotal, 2);
  assert.equal(payload.summary.tasksTotal, 6);
  assert.equal(payload.summary.topicsWithWarnings, 1);

  const ok = payload.topics.find((item) => item.topicId === "math.ok");
  const failed = payload.topics.find((item) => item.topicId === "math.fail");
  assert.ok(ok);
  assert.ok(failed);
  assert.equal(ok.tasksTotal, 6);
  assert.equal(ok.skillsWithTasks, 1);
  assert.deepEqual(ok.warnings, []);
  assert.equal(failed.tasksTotal, 0);
  assert.equal(failed.skillsWithTasks, 0);
  assert.deepEqual(failed.warnings, ["topic source unavailable"]);
});
