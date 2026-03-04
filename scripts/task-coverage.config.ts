import type { DifficultyBand } from "../lib/tasks/difficulty-band";

export type CoverageRule = {
  requiredBands: DifficultyBand[];
  minTasksPerCell: number;
};

export type ResolvedCoverageRule = CoverageRule & {
  source: "skill" | "topic" | "default";
};

const DEFAULT_RULE: CoverageRule = {
  requiredBands: ["A", "B", "C"],
  minTasksPerCell: 1,
};

const TOPIC_RULES: Record<string, CoverageRule> = {
  "math.proportion": {
    requiredBands: ["A"],
    minTasksPerCell: 1,
  },
  "math.fractions_multiplication": {
    requiredBands: ["A"],
    minTasksPerCell: 0,
  },
};

const SKILL_RULES: Record<string, CoverageRule> = {
  "math.proportion.understand_ratio_as_quotient": {
    requiredBands: ["A"],
    minTasksPerCell: 1,
  },
  "math.fractions_multiplication.s1_ff": {
    requiredBands: ["A"],
    minTasksPerCell: 1,
  },
  "math.rectangular_prism.s_volume_relations": {
    requiredBands: ["C"],
    minTasksPerCell: 1,
  },
};

function normalizeBands(values: DifficultyBand[]) {
  const order: Record<DifficultyBand, number> = { A: 1, B: 2, C: 3 };
  return [...new Set(values)].filter((value): value is DifficultyBand => value === "A" || value === "B" || value === "C").sort((a, b) => order[a] - order[b]);
}

function validateAndNormalizeRule(rawRule: CoverageRule, key: string): CoverageRule {
  const requiredBands = normalizeBands(rawRule.requiredBands);

  if (requiredBands.length === 0) {
    throw new Error(`Invalid coverage config for "${key}": requiredBands is empty`);
  }
  if (!Number.isInteger(rawRule.minTasksPerCell) || rawRule.minTasksPerCell < 0) {
    throw new Error(`Invalid coverage config for "${key}": minTasksPerCell must be >= 0`);
  }

  return {
    requiredBands,
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
