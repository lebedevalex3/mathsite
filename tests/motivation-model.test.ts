import assert from "node:assert/strict";
import test from "node:test";

import { buildMotivationModel } from "@/src/lib/motivation/model";
import type { SkillProgressMap } from "@/src/lib/progress/types";

test("buildMotivationModel returns attempts badge for early progress", () => {
  const progressMap: SkillProgressMap = {
    s1: { total: 5, correct: 3, accuracy: 0.6, status: "in_progress" },
  };

  const model = buildMotivationModel({
    progressMap,
    rankPercentile: null,
    scope: "home",
  });

  assert.equal(model.badge.kind, "attempts");
  assert.equal(model.level, 1);
  assert.equal(model.xp, 15);
});

test("buildMotivationModel returns mastery badge after attempts and accuracy targets", () => {
  const progressMap: SkillProgressMap = {
    s1: { total: 15, correct: 13, accuracy: 13 / 15, status: "mastered" },
    s2: { total: 15, correct: 13, accuracy: 13 / 15, status: "mastered" },
    s3: { total: 10, correct: 8, accuracy: 0.8, status: "in_progress" },
  };

  const model = buildMotivationModel({
    progressMap,
    rankPercentile: 72.5,
    scope: "home",
  });

  assert.equal(model.badge.kind, "mastery");
  assert.equal(model.rankPercentile, 72.5);
});

test("buildMotivationModel supports topic-specific streak stage", () => {
  const progressMap: SkillProgressMap = {
    s1: { total: 10, correct: 8, accuracy: 0.8, status: "mastered" },
    s2: { total: 10, correct: 8, accuracy: 0.8, status: "mastered" },
    s3: { total: 4, correct: 4, accuracy: 1, status: "mastered" },
  };

  const model = buildMotivationModel({
    progressMap,
    rankPercentile: 40,
    scope: "topic",
  });

  assert.equal(model.summary.totalAttempts, 24);
  assert.equal(model.badge.kind, "streak");
  assert.equal(model.level, 2);
});
