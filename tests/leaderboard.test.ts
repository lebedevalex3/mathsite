import assert from "node:assert/strict";
import test from "node:test";

import {
  aggregateLeaderboard,
  aggregateLeaderboardFromUserSummaries,
  toPublicHandle,
} from "@/src/lib/progress/leaderboard";

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

test("aggregateLeaderboard marks no entry as current user when identity is missing", () => {
  const now = new Date("2026-02-24T12:00:00.000Z");
  const leaderboard = aggregateLeaderboard({
    topicId: "math.proportion",
    currentUserId: null,
    attempts: compareAttemptsFixture(now),
    now,
    limit: 5,
  });

  assert.equal(leaderboard.currentUserPosition, null);
  assert.equal(leaderboard.entries.some((entry) => entry.isCurrentUser), false);
});

test("aggregateLeaderboardFromUserSummaries ranks pre-aggregated rows identically", () => {
  const leaderboard = aggregateLeaderboardFromUserSummaries({
    currentUserId: "user-a",
    rows: [
      { userId: "user-a", total: 12, correct: 9 },
      { userId: "user-b", total: 10, correct: 5 },
      { userId: "user-c", total: 14, correct: 8 },
      { userId: "user-d", total: 16, correct: 11 },
      { userId: "user-e", total: 12, correct: 9 },
      { userId: "user-f", total: 20, correct: 18 },
    ],
    limit: 5,
  });

  assert.equal(leaderboard.cohortSize, 6);
  assert.equal(leaderboard.currentUserPosition, 2);
  assert.equal(leaderboard.entries[0]?.handle, toPublicHandle("user-f"));
  assert.equal(leaderboard.entries[1]?.handle, toPublicHandle("user-a"));
  assert.equal(leaderboard.entries[1]?.isCurrentUser, true);
});
