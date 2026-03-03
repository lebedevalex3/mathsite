import {
  type NormalizedSkillPrereqEdge,
  type SkillPrereqEdge,
  validateSkillEdges,
} from "./prereqs";
import { fractionsMultiplicationSkillIdByKey } from "@/src/lib/topics/fractions-multiplication/module-data";

export const MODERN_TOPICS = new Set<string>([
  "math.proportion",
  "math.fractions_multiplication",
]);

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

const FRACTIONS_MULTIPLICATION_TOPIC_ID = "math.fractions_multiplication";

function fmSkill(key: string) {
  const skillId = fractionsMultiplicationSkillIdByKey.get(key);
  if (!skillId) {
    throw new Error(`Unknown fractions multiplication skill key: ${key}`);
  }
  return skillId;
}

const FRACTIONS_MULTIPLICATION_SKILL_EDGES: SkillPrereqEdge[] = [
  { topic_id: FRACTIONS_MULTIPLICATION_TOPIC_ID, skill_id: fmSkill("s1.ff"), relation: "required", prereq: { prereq_skill_id: fmSkill("s0.reduce") }, priority: 1 },
  { topic_id: FRACTIONS_MULTIPLICATION_TOPIC_ID, skill_id: fmSkill("s1.fi"), relation: "required", prereq: { prereq_skill_id: fmSkill("s1.ff") }, priority: 2 },
  { topic_id: FRACTIONS_MULTIPLICATION_TOPIC_ID, skill_id: fmSkill("s1.precancel"), relation: "required", prereq: { any_of: [fmSkill("s1.ff"), fmSkill("s0.reduce")] }, priority: 1 },
  { topic_id: FRACTIONS_MULTIPLICATION_TOPIC_ID, skill_id: fmSkill("s1.mf"), relation: "required", prereq: { any_of: [fmSkill("s1.precancel"), fmSkill("s0.mixed")] }, priority: 1 },
  { topic_id: FRACTIONS_MULTIPLICATION_TOPIC_ID, skill_id: fmSkill("s1.mm"), relation: "required", prereq: { any_of: [fmSkill("s1.mf"), fmSkill("s0.mixed")] }, priority: 1 },
  { topic_id: FRACTIONS_MULTIPLICATION_TOPIC_ID, skill_id: fmSkill("s1.dec_mul"), relation: "required", prereq: { any_of: [fmSkill("s1.precancel"), fmSkill("s0.decimal")] }, priority: 2 },
  { topic_id: FRACTIONS_MULTIPLICATION_TOPIC_ID, skill_id: fmSkill("s1.multi_factor"), relation: "required", prereq: { prereq_skill_id: fmSkill("s1.precancel") }, priority: 2 },
  { topic_id: FRACTIONS_MULTIPLICATION_TOPIC_ID, skill_id: fmSkill("s1.order_ops"), relation: "required", prereq: { any_of: [fmSkill("s1.multi_factor"), fmSkill("s0.addsub")] }, priority: 2 },

  { topic_id: FRACTIONS_MULTIPLICATION_TOPIC_ID, skill_id: fmSkill("s2.frac_of"), relation: "required", prereq: { prereq_skill_id: fmSkill("s1.precancel") }, priority: 1 },
  { topic_id: FRACTIONS_MULTIPLICATION_TOPIC_ID, skill_id: fmSkill("s2.percent_of"), relation: "required", prereq: { any_of: [fmSkill("s2.frac_of"), fmSkill("s0.decimal")] }, priority: 1 },
  { topic_id: FRACTIONS_MULTIPLICATION_TOPIC_ID, skill_id: fmSkill("s2.dist_law"), relation: "required", prereq: { any_of: [fmSkill("s0.addsub"), fmSkill("s1.precancel"), fmSkill("s1.order_ops")] }, priority: 2 },
  { topic_id: FRACTIONS_MULTIPLICATION_TOPIC_ID, skill_id: fmSkill("s2.factor_common"), relation: "required", prereq: { any_of: [fmSkill("s2.dist_law"), fmSkill("s1.precancel")] }, priority: 2 },

  { topic_id: FRACTIONS_MULTIPLICATION_TOPIC_ID, skill_id: fmSkill("s3.lin_coeff"), relation: "required", prereq: { any_of: [fmSkill("s0.like_terms"), fmSkill("s0.addsub")] }, priority: 1 },
  { topic_id: FRACTIONS_MULTIPLICATION_TOPIC_ID, skill_id: fmSkill("s3.lin_a"), relation: "required", prereq: { any_of: [fmSkill("s3.lin_coeff"), fmSkill("s1.precancel")] }, priority: 2 },
  { topic_id: FRACTIONS_MULTIPLICATION_TOPIC_ID, skill_id: fmSkill("s3.parens_a"), relation: "required", prereq: { any_of: [fmSkill("s3.lin_a"), fmSkill("s1.order_ops")] }, priority: 2 },
  { topic_id: FRACTIONS_MULTIPLICATION_TOPIC_ID, skill_id: fmSkill("s3.subst_hard"), relation: "required", prereq: { any_of: [fmSkill("s3.parens_a"), fmSkill("s0.decimal"), fmSkill("s0.reduce")] }, priority: 2 },

  { topic_id: FRACTIONS_MULTIPLICATION_TOPIC_ID, skill_id: fmSkill("s4.eq_factor"), relation: "required", prereq: { any_of: [fmSkill("s3.lin_coeff"), fmSkill("s1.order_ops")] }, priority: 1 },
  { topic_id: FRACTIONS_MULTIPLICATION_TOPIC_ID, skill_id: fmSkill("s4.eq_parens"), relation: "required", prereq: { any_of: [fmSkill("s4.eq_factor"), fmSkill("s3.parens_a")] }, priority: 1 },
  { topic_id: FRACTIONS_MULTIPLICATION_TOPIC_ID, skill_id: fmSkill("s4.eq_decimal"), relation: "required", prereq: { any_of: [fmSkill("s4.eq_parens"), fmSkill("s0.decimal"), fmSkill("s0.mixed")] }, priority: 2 },

  { topic_id: FRACTIONS_MULTIPLICATION_TOPIC_ID, skill_id: fmSkill("s5.price"), relation: "required", prereq: { prereq_skill_id: fmSkill("s2.frac_of") }, priority: 1 },
  { topic_id: FRACTIONS_MULTIPLICATION_TOPIC_ID, skill_id: fmSkill("s5.speed"), relation: "required", prereq: { prereq_skill_id: fmSkill("s2.frac_of") }, priority: 1 },
  { topic_id: FRACTIONS_MULTIPLICATION_TOPIC_ID, skill_id: fmSkill("s5.remain_frac"), relation: "required", prereq: { any_of: [fmSkill("s2.frac_of"), fmSkill("s0.addsub")] }, priority: 1 },
  { topic_id: FRACTIONS_MULTIPLICATION_TOPIC_ID, skill_id: fmSkill("s5.seq_frac"), relation: "required", prereq: { any_of: [fmSkill("s5.remain_frac"), fmSkill("s2.frac_of")] }, priority: 1 },
  { topic_id: FRACTIONS_MULTIPLICATION_TOPIC_ID, skill_id: fmSkill("s5.geometry_basic"), relation: "required", prereq: { any_of: [fmSkill("s2.frac_of"), fmSkill("s0.addsub")] }, priority: 2 },
  { topic_id: FRACTIONS_MULTIPLICATION_TOPIC_ID, skill_id: fmSkill("s5.area"), relation: "required", prereq: { any_of: [fmSkill("s5.seq_frac"), fmSkill("s5.geometry_basic")] }, priority: 2 },
  { topic_id: FRACTIONS_MULTIPLICATION_TOPIC_ID, skill_id: fmSkill("s5.volume"), relation: "required", prereq: { any_of: [fmSkill("s1.multi_factor"), fmSkill("s0.mixed")] }, priority: 2 },
];

const SKILL_EDGES_BY_TOPIC: Record<string, SkillPrereqEdge[]> = {
  "math.proportion": PROPORTION_SKILL_EDGES,
  [FRACTIONS_MULTIPLICATION_TOPIC_ID]: FRACTIONS_MULTIPLICATION_SKILL_EDGES,
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
