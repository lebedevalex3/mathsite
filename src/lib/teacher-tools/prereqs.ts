type SkillProgress = {
  attempts: number;
  accuracy: number;
};

export type Relation = "required" | "recommended";

export type MinMastery = {
  accuracy: number;
  attempts: number;
};

export type PrereqAtomic = {
  prereq_skill_id: string;
};

export type PrereqAnyOf = {
  any_of: string[];
};

export type SkillPrereqEdge = {
  topic_id: string;
  skill_id: string;
  relation: Relation;
  prereq: PrereqAtomic | PrereqAnyOf;
  priority?: 1 | 2 | 3;
  reason?: string;
  min_mastery?: MinMastery;
};

export type NormalizedSkillPrereqEdge = {
  topic_id: string;
  skill_id: string;
  relation: Relation;
  prereq: PrereqAtomic | PrereqAnyOf;
  priority: 1 | 2 | 3;
  reason?: string;
  min_mastery: MinMastery;
};

export type PrereqUiItem = {
  key: string;
  skill_id?: string;
  title: string;
  reason?: string;
  priority: 1 | 2 | 3;
};

export type AnalyzePrereqsResult = {
  missing_required: PrereqUiItem[];
  missing_recommended: PrereqUiItem[];
  unmet_mastery_required: PrereqUiItem[];
  unmet_mastery_recommended: PrereqUiItem[];
};

const DEFAULT_MASTERY_BY_RELATION: Record<Relation, MinMastery> = {
  required: { accuracy: 0.8, attempts: 10 },
  recommended: { accuracy: 0.65, attempts: 5 },
};

function clampPriority(value: number | undefined): 1 | 2 | 3 {
  if (value === 1 || value === 2 || value === 3) return value;
  return 2;
}

function normalizeMinMastery(relation: Relation, value: MinMastery | undefined): MinMastery {
  if (!value) return DEFAULT_MASTERY_BY_RELATION[relation];
  const attempts = Number.isInteger(value.attempts) && value.attempts >= 0 ? value.attempts : DEFAULT_MASTERY_BY_RELATION[relation].attempts;
  const accuracy = Number.isFinite(value.accuracy)
    ? Math.max(0, Math.min(1, value.accuracy))
    : DEFAULT_MASTERY_BY_RELATION[relation].accuracy;
  return { attempts, accuracy };
}

function canonicalPrereqKey(prereq: PrereqAtomic | PrereqAnyOf) {
  if ("prereq_skill_id" in prereq) return `one:${prereq.prereq_skill_id}`;
  const uniqueSorted = [...new Set(prereq.any_of)].sort();
  return `any:${uniqueSorted.join("|")}`;
}

function edgeKey(edge: SkillPrereqEdge) {
  return `${edge.topic_id}|${edge.skill_id}|${edge.relation}|${canonicalPrereqKey(edge.prereq)}`;
}

function edgeToPrereqSkillIds(edge: NormalizedSkillPrereqEdge): string[] {
  if ("prereq_skill_id" in edge.prereq) return [edge.prereq.prereq_skill_id];
  return edge.prereq.any_of;
}

function mergeReasons(current: string | undefined, next: string | undefined) {
  if (!next || next.trim().length === 0) return current;
  const value = next.trim();
  if (!current || current.trim().length === 0) return value;
  const parts = [...new Set([...current.split(";").map((s) => s.trim()).filter(Boolean), value])];
  return parts.join("; ");
}

function pushOrMergeItem(
  map: Map<string, PrereqUiItem>,
  key: string,
  item: Omit<PrereqUiItem, "key">,
) {
  const existing = map.get(key);
  if (!existing) {
    map.set(key, { key, ...item });
    return;
  }
  map.set(key, {
    ...existing,
    priority: Math.min(existing.priority, item.priority) as 1 | 2 | 3,
    reason: mergeReasons(existing.reason, item.reason),
    title: existing.title.length > 0 ? existing.title : item.title,
    skill_id: existing.skill_id ?? item.skill_id,
  });
}

function sortUiItems(items: PrereqUiItem[]) {
  return [...items].sort((left, right) => {
    if (left.priority !== right.priority) return left.priority - right.priority;
    return left.title.localeCompare(right.title, "ru");
  });
}

export function normalizeSkillPrereqEdges(edges: SkillPrereqEdge[]): {
  normalized: NormalizedSkillPrereqEdge[];
  warnings: string[];
} {
  const warnings: string[] = [];
  const unique = new Map<string, NormalizedSkillPrereqEdge>();

  for (const edge of edges) {
    const relation: Relation = edge.relation === "recommended" ? "recommended" : "required";
    if ("any_of" in edge.prereq) {
      const anyOf = [...new Set(edge.prereq.any_of.filter((id) => typeof id === "string" && id.length > 0))];
      if (anyOf.length === 0) {
        warnings.push(`Invalid any_of for skill "${edge.skill_id}" in topic "${edge.topic_id}"`);
        continue;
      }
      const normalizedEdge: NormalizedSkillPrereqEdge = {
        topic_id: edge.topic_id,
        skill_id: edge.skill_id,
        relation,
        prereq: { any_of: anyOf.sort() },
        priority: clampPriority(edge.priority),
        ...(edge.reason && edge.reason.trim().length > 0 ? { reason: edge.reason.trim() } : {}),
        min_mastery: normalizeMinMastery(relation, edge.min_mastery),
      };
      unique.set(edgeKey(normalizedEdge), normalizedEdge);
      continue;
    }
    const prereqSkillId = edge.prereq.prereq_skill_id?.trim();
    if (!prereqSkillId) {
      warnings.push(`Invalid prereq_skill_id for skill "${edge.skill_id}" in topic "${edge.topic_id}"`);
      continue;
    }
    const normalizedEdge: NormalizedSkillPrereqEdge = {
      topic_id: edge.topic_id,
      skill_id: edge.skill_id,
      relation,
      prereq: { prereq_skill_id: prereqSkillId },
      priority: clampPriority(edge.priority),
      ...(edge.reason && edge.reason.trim().length > 0 ? { reason: edge.reason.trim() } : {}),
      min_mastery: normalizeMinMastery(relation, edge.min_mastery),
    };
    unique.set(edgeKey(normalizedEdge), normalizedEdge);
  }

  return {
    normalized: [...unique.values()],
    warnings,
  };
}

export function buildPrereqIndex(edges: NormalizedSkillPrereqEdge[]) {
  const map = new Map<string, NormalizedSkillPrereqEdge[]>();
  for (const edge of edges) {
    const current = map.get(edge.skill_id) ?? [];
    current.push(edge);
    map.set(edge.skill_id, current);
  }
  return map;
}

export function validateSkillEdges(params: {
  topicId: string;
  edges: SkillPrereqEdge[];
  taxonomySkillIds: Set<string>;
}): {
  normalized: NormalizedSkillPrereqEdge[];
  errors: string[];
  warnings: string[];
} {
  const { topicId, edges, taxonomySkillIds } = params;
  const { normalized, warnings } = normalizeSkillPrereqEdges(edges);
  const errors: string[] = [];

  for (const edge of normalized) {
    if (edge.topic_id !== topicId) {
      errors.push(`Cross-topic edge is forbidden: edge topic "${edge.topic_id}" in topic "${topicId}"`);
      continue;
    }
    if (!taxonomySkillIds.has(edge.skill_id)) {
      errors.push(`Unknown edge.skill_id "${edge.skill_id}" for topic "${topicId}"`);
      continue;
    }
    for (const prereqId of edgeToPrereqSkillIds(edge)) {
      if (!taxonomySkillIds.has(prereqId)) {
        errors.push(`Unknown prereq skill "${prereqId}" for skill "${edge.skill_id}" in topic "${topicId}"`);
      }
      if (prereqId === edge.skill_id) {
        errors.push(`Self-loop edge for skill "${edge.skill_id}" in topic "${topicId}"`);
      }
    }
  }

  const nodes = [...taxonomySkillIds];
  const adjacency = new Map<string, string[]>();
  for (const node of nodes) adjacency.set(node, []);
  for (const edge of normalized) {
    const list = adjacency.get(edge.skill_id) ?? [];
    list.push(...edgeToPrereqSkillIds(edge));
    adjacency.set(edge.skill_id, list);
  }

  const color = new Map<string, 0 | 1 | 2>();
  const stack: string[] = [];

  function dfs(node: string): boolean {
    color.set(node, 1);
    stack.push(node);
    const next = adjacency.get(node) ?? [];
    for (const to of next) {
      const state = color.get(to) ?? 0;
      if (state === 0) {
        if (dfs(to)) return true;
      } else if (state === 1) {
        const cycleStart = stack.indexOf(to);
        const cycle = [...stack.slice(cycleStart), to];
        errors.push(`Cycle detected in prerequisites graph (${topicId}): ${cycle.join(" -> ")}`);
        return true;
      }
    }
    stack.pop();
    color.set(node, 2);
    return false;
  }

  for (const node of nodes) {
    if ((color.get(node) ?? 0) === 0 && dfs(node)) {
      break;
    }
  }

  return { normalized, errors, warnings };
}

export function analyzePrereqs(params: {
  selectedSkillIds: Set<string>;
  edges: SkillPrereqEdge[] | NormalizedSkillPrereqEdge[];
  skillTitlesById: Map<string, string>;
  progressBySkillId?: Map<string, SkillProgress>;
}): AnalyzePrereqsResult {
  const normalized = normalizeSkillPrereqEdges(params.edges as SkillPrereqEdge[]).normalized;
  const selected = params.selectedSkillIds;
  const progressBySkill = params.progressBySkillId;

  const missingRequired = new Map<string, PrereqUiItem>();
  const missingRecommended = new Map<string, PrereqUiItem>();
  const unmetRequired = new Map<string, PrereqUiItem>();
  const unmetRecommended = new Map<string, PrereqUiItem>();

  for (const edge of normalized) {
    if (!selected.has(edge.skill_id)) continue;
    const target = edge.relation === "required" ? missingRequired : missingRecommended;
    const masteryTarget = edge.relation === "required" ? unmetRequired : unmetRecommended;

    if ("prereq_skill_id" in edge.prereq) {
      const prereqId = edge.prereq.prereq_skill_id;
      const title = params.skillTitlesById.get(prereqId) ?? prereqId;
      if (!selected.has(prereqId)) {
        pushOrMergeItem(target, `one:${prereqId}:${edge.relation}`, {
          skill_id: prereqId,
          title,
          reason: edge.reason,
          priority: edge.priority,
        });
        continue;
      }
      if (!progressBySkill) continue;
      const progress = progressBySkill.get(prereqId);
      if (!progress) continue;
      if (progress.attempts < edge.min_mastery.attempts || progress.accuracy < edge.min_mastery.accuracy) {
        pushOrMergeItem(masteryTarget, `one:${prereqId}:${edge.relation}`, {
          skill_id: prereqId,
          title,
          reason: edge.reason,
          priority: edge.priority,
        });
      }
      continue;
    }

    const anyOf = edge.prereq.any_of;
    const selectedAny = anyOf.filter((id) => selected.has(id));
    const anyTitles = anyOf.map((id) => params.skillTitlesById.get(id) ?? id);
    const anyOfTitle = `Любой из: ${anyTitles.join(" / ")}`;
    const key = `any:${anyOf.join("|")}:${edge.relation}`;

    if (selectedAny.length === 0) {
      pushOrMergeItem(target, key, {
        title: anyOfTitle,
        reason: edge.reason,
        priority: edge.priority,
      });
      continue;
    }

    if (!progressBySkill) continue;
    let masteryOk = false;
    for (const skillId of selectedAny) {
      const progress = progressBySkill.get(skillId);
      if (!progress) continue;
      if (progress.attempts >= edge.min_mastery.attempts && progress.accuracy >= edge.min_mastery.accuracy) {
        masteryOk = true;
        break;
      }
    }
    if (!masteryOk) {
      pushOrMergeItem(masteryTarget, key, {
        title: anyOfTitle,
        reason: edge.reason,
        priority: edge.priority,
      });
    }
  }

  return {
    missing_required: sortUiItems([...missingRequired.values()]),
    missing_recommended: sortUiItems([...missingRecommended.values()]),
    unmet_mastery_required: sortUiItems([...unmetRequired.values()]),
    unmet_mastery_recommended: sortUiItems([...unmetRecommended.values()]),
  };
}
