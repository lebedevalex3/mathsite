import type { TeacherToolsTopicConfig } from "@/src/lib/teacher-tools/types";

export type ContentTopicSummary = {
  topicId: string;
  title: {
    ru: string;
    en: string;
    de: string;
  };
  domain: string | null;
  status: "ready" | "soon" | null;
  levels: number[];
  gradeTags: number[];
  skillsTotal: number;
  skillsWithTasks: number;
  tasksTotal: number;
  routesTotal: number;
  prereqEdgesTotal: number;
  skills: Array<{
    id: string;
    title: string;
    branchId: string | null;
    availableCount: number;
    status: "ready" | "soon";
    kind: string | null;
  }>;
  warnings: string[];
};

type ContentTopicMeta = {
  domain: string | null;
  status: "ready" | "soon" | null;
  levels: number[];
};

type DetailedTopicSnapshot = {
  gradeTags?: number[];
  routes?: Array<unknown>;
  skillEdges?: Array<unknown>;
  skills?: Array<{
    id: string;
    title: string;
    branchId?: string;
    availableCount?: number;
    status?: "ready" | "soon";
    kind?: string;
  }>;
};

function toTopicTitle(title: { ru: string; en: string; de: string } | undefined) {
  return title ?? { ru: "", en: "", de: "" };
}

export function buildAdminContentTopicSummary(params: {
  topic: TeacherToolsTopicConfig;
  meta?: Partial<ContentTopicMeta>;
  detailed?: DetailedTopicSnapshot | null;
  errorMessage?: string;
}): ContentTopicSummary {
  const { topic, detailed = null, errorMessage } = params;
  const warnings: string[] = [];

  if (errorMessage) {
    warnings.push(errorMessage);
    const fallbackSkills = topic.skills.map((skill) => ({
      id: skill.id,
      title: skill.title,
      branchId: skill.branchId ?? null,
      availableCount: 0,
      status: skill.status ?? "ready",
      kind: skill.kind ?? null,
    }));
    return {
      topicId: topic.topicId,
      title: toTopicTitle(topic.title),
      domain: params.meta?.domain ?? null,
      status: params.meta?.status ?? null,
      levels: params.meta?.levels ?? [],
      gradeTags: [],
      skillsTotal: fallbackSkills.length,
      skillsWithTasks: 0,
      tasksTotal: 0,
      routesTotal: 0,
      prereqEdgesTotal: 0,
      skills: fallbackSkills,
      warnings,
    };
  }

  if (!detailed) {
    warnings.push("topic_details_unavailable");
  }
  const skills = (detailed?.skills ?? topic.skills).map((skill) => ({
    id: skill.id,
    title: skill.title,
    branchId: skill.branchId ?? null,
    availableCount: skill.availableCount ?? 0,
    status: skill.status ?? "ready",
    kind: skill.kind ?? null,
  }));
  const tasksTotal = skills.reduce((sum, skill) => sum + skill.availableCount, 0);
  const skillsWithTasks = skills.filter((skill) => skill.availableCount > 0).length;

  return {
    topicId: topic.topicId,
    title: toTopicTitle(topic.title),
    domain: params.meta?.domain ?? null,
    status: params.meta?.status ?? null,
    levels: params.meta?.levels ?? [],
    gradeTags: detailed?.gradeTags ?? [],
    skillsTotal: skills.length,
    skillsWithTasks,
    tasksTotal,
    routesTotal: detailed?.routes?.length ?? 0,
    prereqEdgesTotal: detailed?.skillEdges?.length ?? 0,
    skills,
    warnings,
  };
}

export async function buildAdminContentSummaries(params: {
  topicConfigs: TeacherToolsTopicConfig[];
  metaByTopicId: ReadonlyMap<
    string,
    {
      domain?: string | null;
      status?: "ready" | "soon" | null;
      levels?: number[];
    }
  >;
  getTopicSkills: (topicId: string) => Promise<DetailedTopicSnapshot | null>;
}): Promise<ContentTopicSummary[]> {
  return Promise.all(
    params.topicConfigs.map(async (topic) => {
      const metaEntry = params.metaByTopicId.get(topic.topicId);
      const meta = {
        domain: metaEntry?.domain ?? null,
        status: metaEntry?.status ?? null,
        levels: metaEntry?.levels ?? [],
      };

      try {
        const detailed = await params.getTopicSkills(topic.topicId);
        return buildAdminContentTopicSummary({ topic, meta, detailed });
      } catch (error) {
        return buildAdminContentTopicSummary({
          topic,
          meta,
          detailed: null,
          errorMessage: error instanceof Error ? error.message : "topic_load_failed",
        });
      }
    }),
  );
}

export function buildAdminContentPayload(params: {
  summaries: ContentTopicSummary[];
  unconfiguredSlugs: string[];
}) {
  const sortedTopics = [...params.summaries].sort((a, b) => a.topicId.localeCompare(b.topicId));
  const globalWarnings = params.unconfiguredSlugs.map(
    (slug) => `topic_not_configured_in_teacher_tools:${slug}`,
  );

  return {
    ok: true as const,
    topics: sortedTopics,
    globalWarnings,
    summary: {
      topicsTotal: sortedTopics.length,
      skillsTotal: sortedTopics.reduce((sum, item) => sum + item.skillsTotal, 0),
      tasksTotal: sortedTopics.reduce((sum, item) => sum + item.tasksTotal, 0),
      topicsWithWarnings: sortedTopics.filter((item) => item.warnings.length > 0).length,
      unconfiguredTopics: params.unconfiguredSlugs.length,
    },
  };
}
