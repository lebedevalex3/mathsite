import assert from "node:assert/strict";
import test from "node:test";

import { prisma } from "@/src/lib/db/prisma";
import { fetchTopicUserTotals } from "@/src/lib/progress/query";

test("fetchTopicUserTotals normalizes raw SQL number shapes", async () => {
  const originalQueryRaw = prisma.$queryRaw;
  const seenParams: unknown[] = [];

  prisma.$queryRaw = (async (...args: unknown[]) => {
    seenParams.push(...args);
    return [
      { userId: "user-a", total: BigInt(12), correct: BigInt(9) },
      { userId: "user-b", total: "10", correct: "5" },
    ];
  }) as typeof prisma.$queryRaw;

  try {
    const rows = await fetchTopicUserTotals({
      topicId: "math.proportion",
      cutoff: new Date("2026-02-01T00:00:00.000Z"),
    });

    assert.deepEqual(rows, [
      { userId: "user-a", total: 12, correct: 9 },
      { userId: "user-b", total: 10, correct: 5 },
    ]);
    assert.ok(seenParams.length > 0);
  } finally {
    prisma.$queryRaw = originalQueryRaw;
  }
});
