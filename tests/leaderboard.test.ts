import assert from "node:assert/strict";
import test from "node:test";

import { aggregateLeaderboard, toPublicHandle } from "@/src/lib/progress/leaderboard";

import {
  compareAttemptsCurrentUserBelowThresholdFixture,
  compareAttemptsFixture,
} from "./fixtures/attempts.compare";

test("aggregateLeaderboard returns top entries in expected order", () => {
  const now = new Date("2026-02-24T12:00:00.000Z");
  const leaderboard = aggregateLeaderboard({
    topicId: "math.proportion",
    currentUserId: "user-a",
    attempts: compareAttemptsFixture(now),
    now,
    limit: 5,
  });

  assert.equal(leaderboard.cohortSize, 6);
  assert.equal(leaderboard.currentUserPosition, 2);
  assert.equal(leaderboard.entries.length, 5);

  assert.equal(leaderboard.entries[0]?.position, 1);
  assert.equal(leaderboard.entries[0]?.handle, toPublicHandle("user-f"));
  assert.equal(leaderboard.entries[0]?.isCurrentUser, false);

  assert.equal(leaderboard.entries[1]?.position, 2);
  assert.equal(leaderboard.entries[1]?.handle, toPublicHandle("user-a"));
  assert.equal(leaderboard.entries[1]?.isCurrentUser, true);
});

test("aggregateLeaderboard returns null position when current user is outside cohort", () => {
  const now = new Date("2026-02-24T12:00:00.000Z");
  const leaderboard = aggregateLeaderboard({
    topicId: "math.proportion",
    currentUserId: "user-a",
    attempts: compareAttemptsCurrentUserBelowThresholdFixture(now),
    now,
    limit: 5,
  });

  assert.equal(leaderboard.cohortSize, 2);
  assert.equal(leaderboard.currentUserPosition, null);
  assert.equal(leaderboard.entries[0]?.handle, toPublicHandle("user-b"));
});
