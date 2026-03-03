import {
  type NormalizedSkillPrereqEdge,
  type SkillPrereqEdge,
  validateSkillEdges,
} from "./prereqs";

export const MODERN_TOPICS = new Set<string>(["math.proportion"]);

const PROPORTION_SKILL_EDGES: SkillPrereqEdge[] = [
  {
    topic_id: "math.proportion",
    skill_id: "math.proportion.transform_ratio",
    relation: "required",
    prereq: { prereq_skill_id: "math.proportion.understand_ratio_as_quotient" },
    priority: 1,
    reason: "Упрощение отношения опирается на понимание записи a:b как частного.",
  },
  {
    topic_id: "math.proportion",
    skill_id: "math.proportion.compare_ratio_multiples",
    relation: "required",
    prereq: { prereq_skill_id: "math.proportion.transform_ratio" },
    priority: 2,
    reason: "Сравнение по кратности проще после приведения отношений к удобному виду.",
  },
  {
    topic_id: "math.proportion",
    skill_id: "math.proportion.part_of_whole_as_ratio",
    relation: "required",
    prereq: { prereq_skill_id: "math.proportion.understand_ratio_as_quotient" },
    priority: 2,
    reason: "Доля от целого требует уверенного перехода от отношения к дроби.",
  },
  {
    topic_id: "math.proportion",
    skill_id: "math.proportion.recognize_proportion",
    relation: "required",
    prereq: { prereq_skill_id: "math.proportion.transform_ratio" },
    priority: 1,
    reason: "Распознавание пропорции строится на сравнении эквивалентных отношений.",
  },
  {
    topic_id: "math.proportion",
    skill_id: "math.proportion.check_proportion",
    relation: "required",
    prereq: { prereq_skill_id: "math.proportion.recognize_proportion" },
    priority: 1,
    reason: "Перед проверкой нужно уметь распознавать корректную запись пропорции.",
  },
  {
    topic_id: "math.proportion",
    skill_id: "math.proportion.apply_proportion_property",
    relation: "required",
    prereq: { prereq_skill_id: "math.proportion.check_proportion" },
    priority: 1,
    reason: "Свойство ad=bc применяется после базовой проверки пропорции.",
  },
  {
    topic_id: "math.proportion",
    skill_id: "math.proportion.find_unknown_term",
    relation: "required",
    prereq: { prereq_skill_id: "math.proportion.apply_proportion_property" },
    priority: 1,
    reason: "Поиск неизвестного члена напрямую использует свойство пропорции.",
  },
  {
    topic_id: "math.proportion",
    skill_id: "math.proportion.find_unknown_term",
    relation: "recommended",
    prereq: {
      any_of: [
        "math.proportion.compare_ratio_multiples",
        "math.proportion.part_of_whole_as_ratio",
      ],
    },
    priority: 3,
    reason: "Любой из навыков на отношения помогает быстрее проверять правдоподобность ответа.",
  },
  {
    topic_id: "math.proportion",
    skill_id: "math.proportion.solve_hidden_linear_fraction",
    relation: "required",
    prereq: { prereq_skill_id: "math.proportion.find_unknown_term" },
    priority: 1,
    reason: "Скрытые дробные уравнения сводятся к нахождению неизвестного в пропорции.",
  },
  {
    topic_id: "math.proportion",
    skill_id: "math.proportion.solve_hidden_linear_fraction",
    relation: "recommended",
    prereq: { prereq_skill_id: "math.proportion.compare_ratio_multiples" },
    priority: 3,
    reason: "Оценка кратности помогает быстро контролировать промежуточные преобразования.",
  },
  {
    topic_id: "math.proportion",
    skill_id: "math.proportion.solve_hidden_linear_fraction",
    relation: "recommended",
    prereq: { prereq_skill_id: "math.proportion.part_of_whole_as_ratio" },
    priority: 3,
    reason: "Навык работы с долями от целого облегчает интерпретацию текстовых условий.",
  },
];

const SKILL_EDGES_BY_TOPIC: Record<string, SkillPrereqEdge[]> = {
  "math.proportion": PROPORTION_SKILL_EDGES,
};

export function getRawSkillEdgesForTopic(topicId: string): SkillPrereqEdge[] {
  return SKILL_EDGES_BY_TOPIC[topicId] ?? [];
}

export function validateTopicSkillEdges(params: {
  topicId: string;
  taxonomySkillIds: Set<string>;
}): {
  edges: NormalizedSkillPrereqEdge[];
  errors: string[];
  warnings: string[];
} {
  const rawEdges = getRawSkillEdgesForTopic(params.topicId);
  if (rawEdges.length === 0) {
    return { edges: [], errors: [], warnings: [] };
  }
  const result = validateSkillEdges({
    topicId: params.topicId,
    edges: rawEdges,
    taxonomySkillIds: params.taxonomySkillIds,
  });
  return {
    edges: result.normalized,
    errors: result.errors,
    warnings: result.warnings,
  };
}
