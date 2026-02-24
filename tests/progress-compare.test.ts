import assert from "node:assert/strict";
import test from "node:test";

import { aggregateSkillProgress } from "@/src/lib/progress/aggregate";
import { aggregateCompare } from "@/src/lib/progress/compare";

import { compareAttemptsCurrentUserBelowThresholdFixture, compareAttemptsFixture } from "./fixtures/attempts.compare";
import { progressAttemptsFixture } from "./fixtures/attempts.progress";

test("aggregateSkillProgress computes counts, accuracy and status per skill", () => {
  const progress = aggregateSkillProgress(progressAttemptsFixture());

  assert.deepEqual(progress["g5.proporcii.naiti_neizvestnyi_krainei"], {
    total: 3,
    correct: 2,
    accuracy: 2 / 3,
    status: "in_progress",
  });

  assert.deepEqual(progress["g5.proporcii.naiti_neizvestnyi_srednii"], {
    total: 2,
    correct: 0,
    accuracy: 0,
    status: "in_progress",
  });

  assert.deepEqual(progress["g5.proporcii.reshit_zadachu_na_cenu"], {
    total: 5,
    correct: 5,
    accuracy: 1,
    status: "in_progress",
  });
});

test("aggregateSkillProgress returns empty map for empty input", () => {
  assert.deepEqual(aggregateSkillProgress([]), {});
});

test("aggregateCompare computes user/platform metrics and filters by 30-day window", () => {
  const now = new Date("2026-02-24T12:00:00.000Z");
  const result = aggregateCompare({
    topicId: "g5.proporcii",
    currentUserId: "user-a",
    attempts: compareAttemptsFixture(now),
    now,
  });

  assert.equal(result.currentUser.total, 12);
  assert.equal(result.currentUser.correct, 9);
  assert.equal(result.currentUser.accuracy, 0.75);

  // Cohort users in window and >=10 attempts: a,b,c,d,e,f => 6 users
  assert.equal(result.platform.usersCount, 6);

  // Median of totals [10,12,12,14,16,20] => (12 + 14) / 2 = 13
  assert.equal(result.platform.medianTotal, 13);

  // Avg accuracy across cohort users
  const expectedAvg =
    (0.75 + 0.5 + 8 / 14 + 11 / 16 + 0.75 + 0.9) / 6;
  assert.equal(result.platform.avgAccuracy, expectedAvg);

  // Users with accuracy < current user's 0.75: b,c,d => 3 / 6 => 50%
  assert.equal(result.percentile, 50);
});

test("aggregateCompare handles current user with total < 10 while cohort still exists", () => {
  const now = new Date("2026-02-24T12:00:00.000Z");
  const result = aggregateCompare({
    topicId: "g5.proporcii",
    currentUserId: "user-a",
    attempts: compareAttemptsCurrentUserBelowThresholdFixture(now),
    now,
  });

  assert.equal(result.currentUser.total, 6);
  assert.equal(result.currentUser.correct, 3);
  assert.equal(result.currentUser.accuracy, 0.5);

  assert.equal(result.platform.usersCount, 2);
  assert.equal(result.platform.medianTotal, 11);
  assert.equal(result.percentile, 0);
});

test("aggregateCompare returns null percentile/platform values when no cohort users match threshold", () => {
  const now = new Date("2026-02-24T12:00:00.000Z");
  const attempts = [
    {
      userId: "user-a",
      topicId: "g5.proporcii",
      isCorrect: true,
      createdAt: now,
    },
    {
      userId: "user-b",
      topicId: "g5.proporcii",
      isCorrect: false,
      createdAt: now,
    },
  ];

  const result = aggregateCompare({
    topicId: "g5.proporcii",
    currentUserId: "user-a",
    attempts,
    now,
  });

  assert.equal(result.currentUser.total, 1);
  assert.equal(result.platform.usersCount, 0);
  assert.equal(result.platform.avgAccuracy, null);
  assert.equal(result.platform.medianTotal, null);
  assert.equal(result.percentile, null);
});
