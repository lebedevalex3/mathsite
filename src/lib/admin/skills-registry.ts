import { getTasksForTopic } from "@/lib/tasks/query";
import type { SkillOverride } from "@prisma/client";

import { SKILL_KINDS, type SkillKind } from "@/src/lib/skills/kind";
import { listTeacherToolsTopics } from "@/src/lib/teacher-tools/catalog";
import { topicCatalogEntries } from "@/src/lib/topicMeta";

export type SkillStatus = "ready" | "soon";

export type AdminSkillRegistryItem = {
  topicId: string;
  topicTitle: Record<"ru" | "en" | "de", string>;
  topicDomain: string | null;
  topicStatus: "ready" | "soon" | null;
  skillId: string;
  title: string;
  summary: string | null;
  status: SkillStatus;
  kind: SkillKind;
  branchId: string | null;
  trainerHref: string | null;
  tasksTotal: number;
  hasOverride: boolean;
  updatedAt: string | null;
};

export type AdminSkillFilters = {
  q?: string;
  topicId?: string;
  status?: "all" | SkillStatus;
  withoutTasksOnly?: boolean;
};

type SkillSnapshot = {
  id: string;
  title: string;
  summary: string | null;
  status: SkillStatus;
  kind: SkillKind;
  branchId: string | null;
  trainerHref: string | null;
};

export function isSkillStatus(value: unknown): value is SkillStatus {
  return value === "ready" || value === "soon";
}

export function normalizeSkillStatus(value: unknown, fallback: SkillStatus): SkillStatus {
  return isSkillStatus(value) ? value : fallback;
}

export function normalizeSkillKind(value: unknown, fallback: SkillKind): SkillKind {
  return typeof value === "string" && (SKILL_KINDS as readonly string[]).includes(value) ? (value as SkillKind) : fallback;
}

export function applySkillOverrideToSnapshot(
  base: SkillSnapshot,
  override: Pick<SkillOverride, "title" | "summary" | "status" | "kind"> | null,
): SkillSnapshot {
  if (!override) return base;

  return {
    ...base,
    title: override.title?.trim() ? override.title : base.title,
    summary: typeof override.summary === "string" ? override.summary : base.summary,
    status: normalizeSkillStatus(override.status, base.status),
    kind: normalizeSkillKind(override.kind, base.kind),
  };
}

function normalizeQuery(raw: string | undefined) {
  return (raw ?? "").trim().toLowerCase();
}

export function filterAdminSkillRegistry(items: AdminSkillRegistryItem[], filters: AdminSkillFilters) {
  const q = normalizeQuery(filters.q);
  const byTopic = filters.topicId && filters.topicId !== "all" ? filters.topicId : null;
  const byStatus = filters.status && filters.status !== "all" ? filters.status : null;

  return items.filter((item) => {
    if (byTopic && item.topicId !== byTopic) return false;
    if (byStatus && item.status !== byStatus) return false;
    if (filters.withoutTasksOnly && item.tasksTotal > 0) return false;
    if (!q) return true;

    const searchText = [
      item.skillId,
      item.title,
      item.summary ?? "",
      item.topicId,
      item.topicTitle.ru,
      item.topicTitle.en,
      item.topicTitle.de,
    ]
      .join(" ")
      .toLowerCase();

    return searchText.includes(q);
  });
}

export async function buildAdminSkillRegistry(params: {
  overridesBySkillId: ReadonlyMap<string, SkillOverride>;
  filters?: AdminSkillFilters;
}): Promise<AdminSkillRegistryItem[]> {
  const topics = listTeacherToolsTopics();
  const topicMetaById = new Map(topicCatalogEntries.map((item) => [item.id, item] as const));
  const countsByTopicId = new Map<string, Map<string, number>>();

  await Promise.all(
    topics.map(async (topic) => {
      const { tasks, errors } = await getTasksForTopic(topic.topicId);
      if (errors.length > 0) {
        throw new Error(`Task bank errors for ${topic.topicId}: ${errors[0]}`);
      }

      const counts = new Map<string, number>();
      for (const task of tasks) {
        counts.set(task.skill_id, (counts.get(task.skill_id) ?? 0) + 1);
      }
      countsByTopicId.set(topic.topicId, counts);
    }),
  );

  const allItems: AdminSkillRegistryItem[] = topics.flatMap((topic) => {
    const topicMeta = topicMetaById.get(topic.topicId);
    const counts = countsByTopicId.get(topic.topicId) ?? new Map<string, number>();

    return topic.skills.map((skill) => {
      const base: SkillSnapshot = {
        id: skill.id,
        title: skill.title,
        summary: skill.summary ?? null,
        status: skill.status ?? "ready",
        kind: normalizeSkillKind(skill.kind, "compute"),
        branchId: skill.branchId ?? null,
        trainerHref: skill.trainerHref ?? null,
      };
      const override = params.overridesBySkillId.get(skill.id) ?? null;
      const merged = applySkillOverrideToSnapshot(base, override);

      return {
        topicId: topic.topicId,
        topicTitle: topic.title,
        topicDomain: topicMeta?.domain ?? null,
        topicStatus: topicMeta?.status ?? null,
        skillId: merged.id,
        title: merged.title,
        summary: merged.summary,
        status: merged.status,
        kind: merged.kind,
        branchId: merged.branchId,
        trainerHref: merged.trainerHref,
        tasksTotal: counts.get(merged.id) ?? 0,
        hasOverride: Boolean(override),
        updatedAt: override ? override.updatedAt.toISOString() : null,
      };
    });
  });

  const filtered = params.filters ? filterAdminSkillRegistry(allItems, params.filters) : allItems;
  return filtered.sort((a, b) => a.skillId.localeCompare(b.skillId));
}
