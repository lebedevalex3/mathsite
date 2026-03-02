export type CoverageRule = {
  requiredDifficulties: number[];
  minTasksPerCell: number;
};

export type ResolvedCoverageRule = CoverageRule & {
  source: "skill" | "topic" | "default";
};

const DEFAULT_RULE: CoverageRule = {
  requiredDifficulties: [1, 2, 3, 4, 5],
  minTasksPerCell: 1,
};

const TOPIC_RULES: Record<string, CoverageRule> = {
  "math.proportion": {
    requiredDifficulties: [1, 2],
    minTasksPerCell: 1,
  },
};

const SKILL_RULES: Record<string, CoverageRule> = {
  "math.proportion.understand_ratio_as_quotient": {
    requiredDifficulties: [1, 2],
    minTasksPerCell: 1,
  },
};

function normalizeDifficulties(values: number[]) {
  return [...new Set(values)]
    .filter((value) => Number.isInteger(value) && value >= 1 && value <= 5)
    .sort((a, b) => a - b);
}

function validateAndNormalizeRule(rawRule: CoverageRule, key: string): CoverageRule {
  const requiredDifficulties = normalizeDifficulties(rawRule.requiredDifficulties);

  if (requiredDifficulties.length === 0) {
    throw new Error(`Invalid coverage config for "${key}": requiredDifficulties is empty`);
  }
  if (!Number.isInteger(rawRule.minTasksPerCell) || rawRule.minTasksPerCell < 1) {
    throw new Error(`Invalid coverage config for "${key}": minTasksPerCell must be >= 1`);
  }

  return {
    requiredDifficulties,
    minTasksPerCell: rawRule.minTasksPerCell,
  };
}

export function resolveCoverageRule(topicId: string, skillId: string): ResolvedCoverageRule {
  if (SKILL_RULES[skillId]) {
    return {
      ...validateAndNormalizeRule(SKILL_RULES[skillId], `skill:${skillId}`),
      source: "skill",
    };
  }
  if (TOPIC_RULES[topicId]) {
    return {
      ...validateAndNormalizeRule(TOPIC_RULES[topicId], `topic:${topicId}`),
      source: "topic",
    };
  }
  return {
    ...validateAndNormalizeRule(DEFAULT_RULE, "default"),
    source: "default",
  };
}
