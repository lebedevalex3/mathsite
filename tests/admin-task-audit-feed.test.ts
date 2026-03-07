import assert from "node:assert/strict";
import test from "node:test";

import {
  buildTaskAuditWhere,
  collectTaskAuditPage,
  mapTaskAuditRow,
  matchesTaskAuditDerivedFilters,
  parseTaskAuditQuery,
} from "@/src/lib/admin/task-audit-feed";

test("parseTaskAuditQuery normalizes query params", () => {
  const params = new URLSearchParams({
    limit: "300",
    cursor: "not-a-uuid",
    action: "update",
    changedField: "status",
    actor: " Teacher@example.com ",
    from: "2026-03-01",
    to: "2026-03-07",
    statusOnly: "1",
    readyOnly: "true",
  });

  const query = parseTaskAuditQuery(params);
  assert.equal(query.limit, 100);
  assert.equal(query.cursor, null);
  assert.equal(query.actionFilter, "update");
  assert.equal(query.changedFieldFilter, "status");
  assert.equal(query.actorQuery, "teacher@example.com");
  assert.ok(query.fromDate instanceof Date);
  assert.ok(query.toDate instanceof Date);
  assert.equal(query.statusOnly, true);
  assert.equal(query.readyOnly, true);
});

test("buildTaskAuditWhere includes actor/date/action filters", () => {
  const query = parseTaskAuditQuery(
    new URLSearchParams({
      action: "delete",
      actor: "admin",
      from: "2026-03-01",
      to: "2026-03-07",
    }),
  );

  const where = buildTaskAuditWhere({
    taskId: "math.proportion.find_unknown_term.000001",
    query,
  });

  assert.ok(Array.isArray(where.AND));
  const and = where.AND as Array<Record<string, unknown>>;
  assert.equal(and.length >= 4, true);
  const actionFilter = and.find((item) => "action" in item) as {
    action: { startsWith: string };
  };
  assert.equal(actionFilter.action.startsWith, "admin.task.delete");
});

test("mapTaskAuditRow + matchesTaskAuditDerivedFilters apply derived filters", () => {
  const mapped = mapTaskAuditRow({
    id: "00000000-0000-4000-8000-000000000001",
    action: "admin.task.update",
    createdAt: new Date("2026-03-07T10:00:00.000Z"),
    payloadJson: {
      topicId: "math.proportion",
      skillId: "math.proportion.find_unknown_term",
      changedFields: ["status", "difficulty"],
      before: {
        statement_md: "before",
        answer: { type: "number", value: 4 },
        difficulty: 1,
        status: "draft",
      },
      after: {
        statement_md: "after",
        answer: { type: "number", value: 4 },
        difficulty: 2,
        status: "ready",
      },
    },
    actorUser: {
      id: "00000000-0000-4000-8000-000000000010",
      role: "admin",
      email: "admin@example.com",
      username: "admin",
    },
  });

  assert.equal(mapped.changedFields.includes("status"), true);
  assert.equal(mapped.after?.status, "ready");

  const statusOnly = parseTaskAuditQuery(new URLSearchParams({ statusOnly: "1" }));
  assert.equal(matchesTaskAuditDerivedFilters(mapped, statusOnly), true);

  const readyOnly = parseTaskAuditQuery(new URLSearchParams({ readyOnly: "1" }));
  assert.equal(matchesTaskAuditDerivedFilters(mapped, readyOnly), true);

  const changedField = parseTaskAuditQuery(new URLSearchParams({ changedField: "answer" }));
  assert.equal(matchesTaskAuditDerivedFilters(mapped, changedField), false);
});

test("collectTaskAuditPage returns nextCursor when limit reached before batch end", async () => {
  const rows = [
    {
      id: "00000000-0000-4000-8000-000000000101",
      action: "admin.task.update",
      createdAt: new Date("2026-03-07T10:04:00.000Z"),
      payloadJson: {
        changedFields: ["difficulty"],
        before: { statement_md: "s1", answer: { type: "number", value: 1 }, difficulty: 1, status: "draft" },
        after: { statement_md: "s1", answer: { type: "number", value: 1 }, difficulty: 2, status: "draft" },
      },
      actorUser: null,
    },
    {
      id: "00000000-0000-4000-8000-000000000102",
      action: "admin.task.update",
      createdAt: new Date("2026-03-07T10:03:00.000Z"),
      payloadJson: {
        changedFields: ["status"],
        before: { statement_md: "s2", answer: { type: "number", value: 2 }, difficulty: 1, status: "draft" },
        after: { statement_md: "s2", answer: { type: "number", value: 2 }, difficulty: 1, status: "review" },
      },
      actorUser: null,
    },
    {
      id: "00000000-0000-4000-8000-000000000103",
      action: "admin.task.update",
      createdAt: new Date("2026-03-07T10:02:00.000Z"),
      payloadJson: {
        changedFields: ["status"],
        before: { statement_md: "s3", answer: { type: "number", value: 3 }, difficulty: 1, status: "review" },
        after: { statement_md: "s3", answer: { type: "number", value: 3 }, difficulty: 1, status: "ready" },
      },
      actorUser: null,
    },
    {
      id: "00000000-0000-4000-8000-000000000104",
      action: "admin.task.update",
      createdAt: new Date("2026-03-07T10:01:00.000Z"),
      payloadJson: {
        changedFields: ["status"],
        before: { statement_md: "s4", answer: { type: "number", value: 4 }, difficulty: 1, status: "ready" },
        after: { statement_md: "s4", answer: { type: "number", value: 4 }, difficulty: 1, status: "review" },
      },
      actorUser: null,
    },
  ];

  const query = parseTaskAuditQuery(new URLSearchParams({ limit: "2", changedField: "status" }));
  const result = await collectTaskAuditPage({
    taskId: "math.proportion.find_unknown_term.000001",
    query,
    findMany: async () => rows,
  });

  assert.equal(result.logs.length, 2);
  assert.equal(result.logs[0]?.id, "00000000-0000-4000-8000-000000000102");
  assert.equal(result.logs[1]?.id, "00000000-0000-4000-8000-000000000103");
  assert.equal(result.nextCursor, "00000000-0000-4000-8000-000000000103");
});

test("collectTaskAuditPage uses cursor for subsequent page fetches", async () => {
  const calls: Array<{ cursor?: { id: string } }> = [];
  const rows = [
    {
      id: "00000000-0000-4000-8000-000000000201",
      action: "admin.task.update",
      createdAt: new Date("2026-03-07T10:04:00.000Z"),
      payloadJson: {
        changedFields: ["status"],
        before: { statement_md: "s1", answer: { type: "number", value: 1 }, difficulty: 1, status: "draft" },
        after: { statement_md: "s1", answer: { type: "number", value: 1 }, difficulty: 1, status: "review" },
      },
      actorUser: null,
    },
    {
      id: "00000000-0000-4000-8000-000000000202",
      action: "admin.task.update",
      createdAt: new Date("2026-03-07T10:03:00.000Z"),
      payloadJson: {
        changedFields: ["status"],
        before: { statement_md: "s2", answer: { type: "number", value: 2 }, difficulty: 1, status: "review" },
        after: { statement_md: "s2", answer: { type: "number", value: 2 }, difficulty: 1, status: "ready" },
      },
      actorUser: null,
    },
  ];

  const query = parseTaskAuditQuery(
    new URLSearchParams({
      limit: "1",
      cursor: "00000000-0000-4000-8000-000000000201",
      changedField: "status",
    }),
  );

  const result = await collectTaskAuditPage({
    taskId: "math.proportion.find_unknown_term.000001",
    query,
    findMany: async (args) => {
      calls.push({ cursor: args.cursor });
      if (!args.cursor) return rows;
      const index = rows.findIndex((row) => row.id === args.cursor?.id);
      if (index < 0) return [];
      return rows.slice(index + 1);
    },
  });

  assert.equal(calls[0]?.cursor?.id, "00000000-0000-4000-8000-000000000201");
  assert.equal(result.logs.length, 1);
  assert.equal(result.logs[0]?.id, "00000000-0000-4000-8000-000000000202");
  assert.equal(result.nextCursor, null);
});
