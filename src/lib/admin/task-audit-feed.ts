import type { Prisma, UserRole } from "@prisma/client";

import { normalizeTaskAuditPayload, type TaskAuditField, type TaskAuditSnapshot } from "@/src/lib/admin/task-audit";

type TaskActionFilter = "all" | "create" | "update" | "delete";

type TaskChangedFieldFilter = "all" | TaskAuditField;

type ActorView = {
  id: string;
  role: UserRole;
  email: string | null;
  username: string | null;
};

type AuditRow = {
  id: string;
  action: string;
  payloadJson: unknown;
  createdAt: Date;
  actorUser: ActorView | null;
};

type TaskAuditFindManyArgs = {
  where: Prisma.AuditLogWhereInput;
  orderBy: Array<{ createdAt: "asc" | "desc" } | { id: "asc" | "desc" }>;
  take: number;
  cursor?: { id: string };
  skip?: number;
  select: {
    id: true;
    action: true;
    payloadJson: true;
    createdAt: true;
    actorUser: {
      select: {
        id: true;
        role: true;
        email: true;
        username: true;
      };
    };
  };
};

export type TaskAuditListItem = {
  id: string;
  action: string;
  createdAt: string;
  actor: ActorView | null;
  topicId: string | null;
  skillId: string | null;
  changedFields: TaskAuditField[];
  before: TaskAuditSnapshot | null;
  after: TaskAuditSnapshot | null;
};

export type TaskAuditQuery = {
  limit: number;
  cursor: string | null;
  actionFilter: TaskActionFilter;
  changedFieldFilter: TaskChangedFieldFilter;
  actorQuery: string;
  fromDate: Date | null;
  toDate: Date | null;
  statusOnly: boolean;
  readyOnly: boolean;
};

function parseActionFilter(raw: string | null): TaskActionFilter {
  if (raw === "create" || raw === "update" || raw === "delete") return raw;
  return "all";
}

function parseChangedFieldFilter(raw: string | null): TaskChangedFieldFilter {
  if (
    raw === "statement_md" ||
    raw === "answer" ||
    raw === "difficulty" ||
    raw === "difficulty_band" ||
    raw === "status"
  ) {
    return raw;
  }
  return "all";
}

function parseDateStart(raw: string | null): Date | null {
  if (!raw) return null;
  const text = raw.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const value = new Date(`${text}T00:00:00.000Z`);
  return Number.isNaN(value.getTime()) ? null : value;
}

function parseDateEnd(raw: string | null): Date | null {
  if (!raw) return null;
  const text = raw.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const value = new Date(`${text}T23:59:59.999Z`);
  return Number.isNaN(value.getTime()) ? null : value;
}

function parseBooleanFlag(raw: string | null) {
  return raw === "1" || raw === "true";
}

function parseLimit(raw: string | null) {
  const value = Number(raw ?? 20);
  if (!Number.isFinite(value)) return 20;
  return Math.min(100, Math.max(1, Math.trunc(value)));
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function parseTaskAuditQuery(searchParams: URLSearchParams): TaskAuditQuery {
  const cursorRaw = (searchParams.get("cursor") ?? "").trim();
  return {
    limit: parseLimit(searchParams.get("limit")),
    cursor: isUuid(cursorRaw) ? cursorRaw : null,
    actionFilter: parseActionFilter(searchParams.get("action")),
    changedFieldFilter: parseChangedFieldFilter(searchParams.get("changedField")),
    actorQuery: (searchParams.get("actor") ?? "").trim().toLowerCase(),
    fromDate: parseDateStart(searchParams.get("from")),
    toDate: parseDateEnd(searchParams.get("to")),
    statusOnly: parseBooleanFlag(searchParams.get("statusOnly")),
    readyOnly: parseBooleanFlag(searchParams.get("readyOnly")),
  };
}

export function buildTaskAuditWhere(params: {
  taskId: string;
  query: TaskAuditQuery;
}): Prisma.AuditLogWhereInput {
  const { taskId, query } = params;
  const and: Prisma.AuditLogWhereInput[] = [
    {
      entityType: "task",
      entityId: taskId,
    },
    {
      action: {
        startsWith: query.actionFilter === "all" ? "admin.task." : `admin.task.${query.actionFilter}`,
      },
    },
  ];

  if (query.fromDate || query.toDate) {
    and.push({
      createdAt: {
        gte: query.fromDate ?? undefined,
        lte: query.toDate ?? undefined,
      },
    });
  }

  if (query.actorQuery) {
    const actorOr: Prisma.AuditLogWhereInput[] = [
      {
        actorUser: {
          is: {
            username: { contains: query.actorQuery, mode: "insensitive" },
          },
        },
      },
      {
        actorUser: {
          is: {
            email: { contains: query.actorQuery, mode: "insensitive" },
          },
        },
      },
    ];
    if (isUuid(query.actorQuery)) {
      actorOr.push({
        actorUserId: query.actorQuery,
      });
    }
    and.push({ OR: actorOr });
  }

  return { AND: and };
}

export function mapTaskAuditRow(row: AuditRow): TaskAuditListItem {
  const payload = normalizeTaskAuditPayload(row.payloadJson);
  return {
    id: row.id,
    action: row.action,
    createdAt: row.createdAt.toISOString(),
    actor: row.actorUser,
    topicId: payload.topicId,
    skillId: payload.skillId,
    changedFields: payload.changedFields,
    before: payload.before,
    after: payload.after,
  };
}

export function matchesTaskAuditDerivedFilters(item: TaskAuditListItem, query: TaskAuditQuery) {
  if (query.changedFieldFilter !== "all" && !item.changedFields.includes(query.changedFieldFilter)) {
    return false;
  }
  if (query.statusOnly && !item.changedFields.includes("status")) {
    return false;
  }
  if (query.readyOnly && item.after?.status !== "ready") {
    return false;
  }
  return true;
}

export async function collectTaskAuditPage(params: {
  taskId: string;
  query: TaskAuditQuery;
  findMany: (args: TaskAuditFindManyArgs) => Promise<AuditRow[]>;
}) {
  const { taskId, query, findMany } = params;
  const logs: TaskAuditListItem[] = [];
  let cursor: string | null = query.cursor;
  let exhausted = false;
  let hasMore = false;
  const batchSize = Math.min(200, Math.max(query.limit * 3, 60));

  while (logs.length < query.limit && !exhausted) {
    const rows = await findMany({
      where: buildTaskAuditWhere({ taskId, query }),
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: batchSize,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        action: true,
        payloadJson: true,
        createdAt: true,
        actorUser: {
          select: {
            id: true,
            role: true,
            email: true,
            username: true,
          },
        },
      },
    });

    if (rows.length === 0) {
      exhausted = true;
      break;
    }

    let reachedLimit = false;
    for (const row of rows) {
      cursor = row.id;
      const mapped = mapTaskAuditRow(row);
      if (!matchesTaskAuditDerivedFilters(mapped, query)) continue;
      logs.push(mapped);
      if (logs.length >= query.limit) {
        reachedLimit = true;
        break;
      }
    }

    if (reachedLimit) {
      const cursorIndex = rows.findIndex((row) => row.id === cursor);
      hasMore = cursorIndex >= 0 && (cursorIndex < rows.length - 1 || rows.length === batchSize);
      break;
    }

    if (rows.length < batchSize) {
      exhausted = true;
    }
  }

  return {
    logs,
    nextCursor: logs.length >= query.limit && hasMore ? cursor : null,
  };
}
