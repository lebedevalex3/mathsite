import { prisma } from "@/src/lib/db/prisma";

export type TopicUserTotalsRow = {
  userId: string;
  total: number;
  correct: number;
};

function toNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string") return Number.parseInt(value, 10);
  return 0;
}

export async function fetchTopicUserTotals(params: {
  topicId: string;
  cutoff: Date;
}) {
  const rows = await prisma.$queryRaw<Array<{ userId: string; total: unknown; correct: unknown }>>`
    SELECT
      "userId" AS "userId",
      COUNT(*)::int AS "total",
      SUM(CASE WHEN "isCorrect" THEN 1 ELSE 0 END)::int AS "correct"
    FROM "Attempt"
    WHERE "topicId" = ${params.topicId}
      AND "createdAt" >= ${params.cutoff}
    GROUP BY "userId"
  `;

  return rows.map((row) => ({
    userId: row.userId,
    total: toNumber(row.total),
    correct: toNumber(row.correct),
  })) satisfies TopicUserTotalsRow[];
}
