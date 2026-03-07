export type ContentBoardTopicInput = {
  topicId: string;
  title: Record<"ru" | "en" | "de", string>;
  domain: string | null;
  status: "ready" | "soon" | null;
  skillsTotal: number;
  skillsWithTasks: number;
  tasksTotal: number;
  routesTotal: number;
  prereqEdgesTotal: number;
  warnings: string[];
  skills: Array<{
    id: string;
    title: string;
    branchId: string | null;
    availableCount: number;
    status: "ready" | "soon";
    kind: string | null;
  }>;
};

export type ContentBoardSkillInput = {
  topicId: string;
  skillId: string;
  title: string;
  summary: string | null;
  status: "ready" | "soon";
  kind: string;
  branchId: string | null;
  trainerHref: string | null;
  tasksTotal: number;
};

export type ContentBoardDeficitInput = {
  topicId: string;
  skillId: string;
  title: string;
  status: "ready" | "soon";
  coverage: {
    readyTotal: number;
    readyByBand: {
      A: number;
      B: number;
      C: number;
    };
  };
  reasons: string[];
};

export type ContentBoardActionItem = {
  topicId: string;
  topicTitle: string;
  branchId: string | null;
  skillId: string;
  skillTitle: string;
  status: "ready" | "soon";
  tasksTotal: number;
  hasSummary: boolean;
  hasTrainer: boolean;
  deficitReasons: string[];
  deficitCoverage: ContentBoardDeficitInput["coverage"] | null;
  actionReasons: string[];
  priorityScore: number;
};

export type ContentBoardBranch = {
  branchId: string | null;
  label: string;
  skillsTotal: number;
  readySkills: number;
  soonSkills: number;
  withTasks: number;
  withoutTasks: number;
  tasksTotal: number;
  deficitSkills: number;
  missingSummary: number;
  missingTrainer: number;
  actionableSkills: number;
  topActions: ContentBoardActionItem[];
};

export type ContentBoardTopic = {
  topicId: string;
  title: string;
  domain: string | null;
  status: "ready" | "soon" | null;
  skillsTotal: number;
  skillsWithTasks: number;
  tasksTotal: number;
  routesTotal: number;
  prereqEdgesTotal: number;
  warnings: string[];
  deficitSkills: number;
  missingSummary: number;
  missingTrainer: number;
  actionableSkills: number;
  branches: ContentBoardBranch[];
};

export type ContentBoardSummary = {
  topicsTotal: number;
  tasksTotal: number;
  skillsTotal: number;
  skillsWithTasks: number;
  actionableSkills: number;
  deficitSkills: number;
  skillsWithoutTasks: number;
  missingSummary: number;
  missingTrainer: number;
  topicsWithWarnings: number;
};

export type ContentBoardModel = {
  summary: ContentBoardSummary;
  topics: ContentBoardTopic[];
  actions: ContentBoardActionItem[];
};

function sortActions(a: ContentBoardActionItem, b: ContentBoardActionItem) {
  if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
  return a.skillId.localeCompare(b.skillId);
}

function branchLabel(branchId: string | null) {
  return branchId ?? "unassigned";
}

function actionReasonsForSkill(params: {
  tasksTotal: number;
  hasSummary: boolean;
  hasTrainer: boolean;
  deficitReasons: string[];
}) {
  const reasons: string[] = [];
  if (params.tasksTotal === 0) reasons.push("no_tasks");
  if (params.deficitReasons.length > 0) reasons.push("deficit");
  if (!params.hasSummary) reasons.push("missing_summary");
  if (!params.hasTrainer) reasons.push("missing_trainer");
  return reasons;
}

function priorityScore(params: {
  status: "ready" | "soon";
  tasksTotal: number;
  hasSummary: boolean;
  hasTrainer: boolean;
  deficitReasons: string[];
}) {
  let score = 0;
  if (params.tasksTotal === 0) score += 100;
  if (params.deficitReasons.length > 0) score += 40 + params.deficitReasons.length * 10;
  if (!params.hasTrainer) score += 12;
  if (!params.hasSummary) score += 10;
  if (params.status === "ready") score += 4;
  return score;
}

export function buildAdminContentBoard(params: {
  locale: "ru" | "en" | "de";
  topics: ContentBoardTopicInput[];
  skills: ContentBoardSkillInput[];
  deficits: ContentBoardDeficitInput[];
}): ContentBoardModel {
  const skillById = new Map(params.skills.map((skill) => [skill.skillId, skill] as const));
  const deficitBySkillId = new Map(params.deficits.map((deficit) => [deficit.skillId, deficit] as const));

  const actions: ContentBoardActionItem[] = [];
  const topics: ContentBoardTopic[] = params.topics.map((topic) => {
    const branchMap = new Map<string, ContentBoardBranch>();

    for (const topicSkill of topic.skills) {
      const registrySkill = skillById.get(topicSkill.id);
      const deficit = deficitBySkillId.get(topicSkill.id) ?? null;
      const tasksTotal = registrySkill?.tasksTotal ?? topicSkill.availableCount;
      const hasSummary = Boolean(registrySkill?.summary?.trim());
      const hasTrainer = Boolean(registrySkill?.trainerHref?.trim());
      const actionReasons = actionReasonsForSkill({
        tasksTotal,
        hasSummary,
        hasTrainer,
        deficitReasons: deficit?.reasons ?? [],
      });
      const action: ContentBoardActionItem = {
        topicId: topic.topicId,
        topicTitle: topic.title[params.locale] || topic.title.ru,
        branchId: registrySkill?.branchId ?? topicSkill.branchId ?? null,
        skillId: topicSkill.id,
        skillTitle: registrySkill?.title ?? topicSkill.title,
        status: registrySkill?.status ?? topicSkill.status,
        tasksTotal,
        hasSummary,
        hasTrainer,
        deficitReasons: deficit?.reasons ?? [],
        deficitCoverage: deficit?.coverage ?? null,
        actionReasons,
        priorityScore: priorityScore({
          status: registrySkill?.status ?? topicSkill.status,
          tasksTotal,
          hasSummary,
          hasTrainer,
          deficitReasons: deficit?.reasons ?? [],
        }),
      };

      const key = branchLabel(action.branchId);
      const branch =
        branchMap.get(key) ??
        {
          branchId: action.branchId,
          label: key,
          skillsTotal: 0,
          readySkills: 0,
          soonSkills: 0,
          withTasks: 0,
          withoutTasks: 0,
          tasksTotal: 0,
          deficitSkills: 0,
          missingSummary: 0,
          missingTrainer: 0,
          actionableSkills: 0,
          topActions: [],
        };

      branch.skillsTotal += 1;
      branch.tasksTotal += tasksTotal;
      if (action.status === "ready") branch.readySkills += 1;
      if (action.status === "soon") branch.soonSkills += 1;
      if (tasksTotal > 0) branch.withTasks += 1;
      if (tasksTotal === 0) branch.withoutTasks += 1;
      if (action.deficitReasons.length > 0) branch.deficitSkills += 1;
      if (!action.hasSummary) branch.missingSummary += 1;
      if (!action.hasTrainer) branch.missingTrainer += 1;
      if (action.actionReasons.length > 0) branch.actionableSkills += 1;
      branch.topActions.push(action);

      branchMap.set(key, branch);
      actions.push(action);
    }

    const branches = [...branchMap.values()]
      .map((branch) => ({
        ...branch,
        topActions: branch.topActions.sort(sortActions).slice(0, 3),
      }))
      .sort((a, b) => {
        if (b.actionableSkills !== a.actionableSkills) return b.actionableSkills - a.actionableSkills;
        return a.label.localeCompare(b.label);
      });

    return {
      topicId: topic.topicId,
      title: topic.title[params.locale] || topic.title.ru,
      domain: topic.domain,
      status: topic.status,
      skillsTotal: topic.skillsTotal,
      skillsWithTasks: topic.skillsWithTasks,
      tasksTotal: topic.tasksTotal,
      routesTotal: topic.routesTotal,
      prereqEdgesTotal: topic.prereqEdgesTotal,
      warnings: topic.warnings,
      deficitSkills: branches.reduce((sum, branch) => sum + branch.deficitSkills, 0),
      missingSummary: branches.reduce((sum, branch) => sum + branch.missingSummary, 0),
      missingTrainer: branches.reduce((sum, branch) => sum + branch.missingTrainer, 0),
      actionableSkills: branches.reduce((sum, branch) => sum + branch.actionableSkills, 0),
      branches,
    };
  });

  const sortedTopics = topics.sort((a, b) => {
    if (b.actionableSkills !== a.actionableSkills) return b.actionableSkills - a.actionableSkills;
    return a.topicId.localeCompare(b.topicId);
  });
  const sortedActions = actions.filter((item) => item.actionReasons.length > 0).sort(sortActions);

  return {
    summary: {
      topicsTotal: sortedTopics.length,
      tasksTotal: sortedTopics.reduce((sum, topic) => sum + topic.tasksTotal, 0),
      skillsTotal: sortedTopics.reduce((sum, topic) => sum + topic.skillsTotal, 0),
      skillsWithTasks: sortedTopics.reduce((sum, topic) => sum + topic.skillsWithTasks, 0),
      actionableSkills: sortedTopics.reduce((sum, topic) => sum + topic.actionableSkills, 0),
      deficitSkills: sortedTopics.reduce((sum, topic) => sum + topic.deficitSkills, 0),
      skillsWithoutTasks: sortedTopics.reduce(
        (sum, topic) => sum + topic.branches.reduce((acc, branch) => acc + branch.withoutTasks, 0),
        0,
      ),
      missingSummary: sortedTopics.reduce((sum, topic) => sum + topic.missingSummary, 0),
      missingTrainer: sortedTopics.reduce((sum, topic) => sum + topic.missingTrainer, 0),
      topicsWithWarnings: sortedTopics.filter((topic) => topic.warnings.length > 0).length,
    },
    topics: sortedTopics,
    actions: sortedActions,
  };
}
