import type { DifficultyBand } from "@/lib/tasks/difficulty-band";

import type { TeacherToolsRoute, TeacherToolsRouteStep } from "./types";

type RawRouteStep = {
  step_id: string;
  skill_key: string;
  allowed_bands: DifficultyBand[];
  order: number;
  allowed_archetypes?: string[];
};

type RawRoute = {
  routeId: string;
  title: string;
  steps: RawRouteStep[];
};

type TopicRouteConfig = {
  skillMap: Record<string, string>;
  rawRoutes: RawRoute[];
};

export function compileRoutes(
  rawRoutes: RawRoute[],
  skillMap: Record<string, string>,
  taxonomySkillIds: Set<string>,
): TeacherToolsRoute[] {
  return rawRoutes.map((rawRoute) => {
    const warnings: string[] = [];
    const steps: TeacherToolsRouteStep[] = [];

    for (const rawStep of rawRoute.steps) {
      const mappedSkillId = skillMap[rawStep.skill_key];
      if (!mappedSkillId) {
        warnings.push(
          `Missing SKILL_MAP for "${rawStep.skill_key}" in route "${rawRoute.routeId}"`,
        );
        continue;
      }
      if (!taxonomySkillIds.has(mappedSkillId)) {
        warnings.push(
          `Excluded step "${rawStep.step_id}" in route "${rawRoute.routeId}" because skill "${mappedSkillId}" is not in taxonomy`,
        );
        continue;
      }
      steps.push({
        step_id: rawStep.step_id,
        skill_id: mappedSkillId,
        allowed_bands: rawStep.allowed_bands,
        order: rawStep.order,
        allowed_archetypes: rawStep.allowed_archetypes,
      });
    }

    steps.sort((a, b) => a.order - b.order);
    return {
      routeId: rawRoute.routeId,
      title: rawRoute.title,
      steps,
      ...(warnings.length > 0 ? { warnings } : {}),
    };
  });
}

const FRACTIONS_MULTIPLICATION_ROUTES: TopicRouteConfig = {
  skillMap: {
    "s1.ff": "math.fractions.multiply_fractions",
    "s1.fi": "math.fractions.multiply_fraction_by_integer",
    "s1.mf": "math.fractions.multiply_mixed_numbers",
    "s2.frac_of": "math.fractions.find_fraction_of_number",
    "s2.percent_of": "math.fractions.find_percent_of_number",
    "s5.price": "math.fractions.word_price",
    "s5.speed": "math.fractions.word_speed",
    "s1.mm": "math.fractions.multiply_mixed_numbers",
    "s1.dec_mul": "math.fractions.multiply_decimals",
    "s1.multi_factor": "math.fractions.multiply_many_factors",
    "s1.order_ops": "math.fractions.order_of_operations",
    "s2.dist_law": "math.fractions.distributive_property",
    "s2.factor_common": "math.fractions.factor_common_term",
    "s3.lin_coeff": "math.fractions.linear_with_coefficient",
    "s3.lin_a": "math.fractions.linear_isolate_variable",
    "s5.remain_frac": "math.fractions.word_remaining_fraction",
    "s5.seq_frac": "math.fractions.word_sequence_fraction",
    "s3.parens_a": "math.fractions.parens_transform",
    "s3.subst_hard": "math.fractions.hard_substitution",
    "s4.eq_factor": "math.fractions.equation_factor_form",
    "s4.eq_parens": "math.fractions.equation_parens_form",
    "s4.eq_decimal": "math.fractions.equation_decimal_form",
    "s5.volume": "math.fractions.word_volume",
  },
  rawRoutes: [
    {
      routeId: "mul_fractions:A",
      title: "Уровень A",
      steps: [
        { step_id: "A.S1.1", skill_key: "s1.ff", allowed_bands: ["A"], order: 1 },
        { step_id: "A.S1.2", skill_key: "s1.fi", allowed_bands: ["A"], order: 2 },
        { step_id: "A.S1.3", skill_key: "s1.mf", allowed_bands: ["A"], order: 3 },
        { step_id: "A.S2.1", skill_key: "s2.frac_of", allowed_bands: ["A"], order: 4 },
        { step_id: "A.S2.2", skill_key: "s2.percent_of", allowed_bands: ["A"], order: 5 },
        { step_id: "A.S5.1", skill_key: "s5.price", allowed_bands: ["A"], order: 6 },
        { step_id: "A.S5.2", skill_key: "s5.speed", allowed_bands: ["A"], order: 7 },
      ],
    },
    {
      routeId: "mul_fractions:B",
      title: "Уровень B",
      steps: [
        { step_id: "B.S1.1", skill_key: "s1.mm", allowed_bands: ["B"], order: 1 },
        { step_id: "B.S1.2", skill_key: "s1.dec_mul", allowed_bands: ["B"], order: 2 },
        { step_id: "B.S1.3", skill_key: "s1.multi_factor", allowed_bands: ["B"], order: 3 },
        { step_id: "B.S1.4", skill_key: "s1.order_ops", allowed_bands: ["B"], order: 4 },
        { step_id: "B.S2.1", skill_key: "s2.percent_of", allowed_bands: ["B"], order: 5 },
        { step_id: "B.S2.2", skill_key: "s2.dist_law", allowed_bands: ["B"], order: 6 },
        { step_id: "B.S2.3", skill_key: "s2.factor_common", allowed_bands: ["B"], order: 7 },
        { step_id: "B.S3.1", skill_key: "s3.lin_coeff", allowed_bands: ["B"], order: 8 },
        { step_id: "B.S3.2", skill_key: "s3.lin_a", allowed_bands: ["B"], order: 9 },
        { step_id: "B.S5.1", skill_key: "s5.remain_frac", allowed_bands: ["B"], order: 10 },
        { step_id: "B.S5.2", skill_key: "s5.seq_frac", allowed_bands: ["B"], order: 11 },
      ],
    },
    {
      routeId: "mul_fractions:C",
      title: "Уровень C",
      steps: [
        { step_id: "C.S1.1", skill_key: "s1.order_ops", allowed_bands: ["C"], order: 1 },
        { step_id: "C.S1.2", skill_key: "s1.order_ops", allowed_bands: ["C"], order: 2 },
        { step_id: "C.S1.3", skill_key: "s2.factor_common", allowed_bands: ["C"], order: 3 },
        { step_id: "C.S3.1", skill_key: "s3.parens_a", allowed_bands: ["C"], order: 4 },
        { step_id: "C.S3.2", skill_key: "s3.subst_hard", allowed_bands: ["C"], order: 5 },
        { step_id: "C.S4.1", skill_key: "s4.eq_factor", allowed_bands: ["C"], order: 6 },
        { step_id: "C.S4.2", skill_key: "s4.eq_parens", allowed_bands: ["C"], order: 7 },
        { step_id: "C.S4.3", skill_key: "s4.eq_decimal", allowed_bands: ["C"], order: 8 },
        { step_id: "C.S5.1", skill_key: "s5.seq_frac", allowed_bands: ["C"], order: 9 },
        { step_id: "C.S5.2", skill_key: "s5.seq_frac", allowed_bands: ["C"], order: 10 },
        { step_id: "C.S5.3", skill_key: "s5.volume", allowed_bands: ["C"], order: 11 },
      ],
    },
  ],
};

const TOPIC_ROUTE_CONFIGS: Record<string, TopicRouteConfig> = {
  "math.fractions": FRACTIONS_MULTIPLICATION_ROUTES,
  "math.fractions_multiplication": FRACTIONS_MULTIPLICATION_ROUTES,
};

export function getRoutesForTopic(topicId: string, taxonomySkillIds: Set<string>): TeacherToolsRoute[] {
  const config = TOPIC_ROUTE_CONFIGS[topicId];
  if (!config) return [];
  return compileRoutes(config.rawRoutes, config.skillMap, taxonomySkillIds).filter(
    (route) => route.steps.length > 0,
  );
}

export function getRouteById(
  topicId: string,
  routeId: string,
  taxonomySkillIds: Set<string>,
): TeacherToolsRoute | null {
  return getRoutesForTopic(topicId, taxonomySkillIds).find((route) => route.routeId === routeId) ?? null;
}

export function hasRoutes(topicId: string, taxonomySkillIds: Set<string>): boolean {
  return getRoutesForTopic(topicId, taxonomySkillIds).length > 0;
}
