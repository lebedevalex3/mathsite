export type TopicCoverageRule = {
  requiredDifficulties: number[];
  minTasksPerCell: number;
};

const DEFAULT_RULE: TopicCoverageRule = {
  requiredDifficulties: [1, 2, 3, 4, 5],
  minTasksPerCell: 1,
};

const TOPIC_RULES: Record<string, TopicCoverageRule> = {
  "math.proportion": {
    requiredDifficulties: [1, 2],
    minTasksPerCell: 1,
  },
};

function normalizeDifficulties(values: number[]) {
  return [...new Set(values)]
    .filter((value) => Number.isInteger(value) && value >= 1 && value <= 5)
    .sort((a, b) => a - b);
}

export function getCoverageRule(topicId: string): TopicCoverageRule {
  const rawRule = TOPIC_RULES[topicId] ?? DEFAULT_RULE;
  const requiredDifficulties = normalizeDifficulties(rawRule.requiredDifficulties);

  if (requiredDifficulties.length === 0) {
    throw new Error(`Invalid coverage config for "${topicId}": requiredDifficulties is empty`);
  }
  if (!Number.isInteger(rawRule.minTasksPerCell) || rawRule.minTasksPerCell < 1) {
    throw new Error(`Invalid coverage config for "${topicId}": minTasksPerCell must be >= 1`);
  }

  return {
    requiredDifficulties,
    minTasksPerCell: rawRule.minTasksPerCell,
  };
}
