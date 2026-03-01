export type ProportionSubtopic = {
  id:
    | "math.proportion.rule"
    | "math.proportion.direct"
    | "math.proportion.inverse"
    | "math.proportion.problems";
  slug: "rule" | "direct" | "inverse" | "problems";
  title: string;
  description: string;
  status: "ready" | "soon";
};

export type ProportionSkill = {
  id: string;
  title: string;
  summary: string;
  subtopicId: ProportionSubtopic["id"];
  skillSlug: string;
  defaultTrainingCount?: number;
};

export type ProportionBranchId = "O" | "P" | "E" | "T" | "A";

export type ProportionBranch = {
  id: ProportionBranchId;
  order: number;
  title: { ru: string; en: string; de: string };
  goal: { ru: string; en: string; de: string };
  skillIds: string[];
  optional?: boolean;
  dependsOn?: ProportionBranchId[];
};

export type SubtopicTocItem = {
  id: string;
  label: string;
};

export const proportionSubtopics: ProportionSubtopic[] = [
  {
    id: "math.proportion.rule",
    slug: "rule",
    title: "Основное правило пропорции",
    description:
      "Свойство ad = bc, проверка пропорции и поиск неизвестного члена.",
    status: "ready",
  },
  {
    id: "math.proportion.direct",
    slug: "direct",
    title: "Прямая пропорциональность",
    description: "Как связаны величины, растущие или уменьшающиеся вместе.",
    status: "ready",
  },
  {
    id: "math.proportion.inverse",
    slug: "inverse",
    title: "Обратная пропорциональность",
    description: "Зависимости вида «больше одной величины — меньше другой».",
    status: "ready",
  },
  {
    id: "math.proportion.problems",
    slug: "problems",
    title: "Задачи на пропорции",
    description:
      "Текстовые задачи на масштаб, цену, производительность и модели.",
    status: "ready",
  },
];

export const proportionSubtopicToc: Record<
  ProportionSubtopic["slug"],
  SubtopicTocItem[]
> = {
  rule: [
    { id: "opredelenie", label: "Определение" },
    { id: "osnovnoe-svoystvo", label: "Основное свойство" },
    { id: "algoritm-resheniya", label: "Алгоритм решения" },
    { id: "primery", label: "Примеры" },
    { id: "tipichnye-oshibki", label: "Типичные ошибки" },
    { id: "praktika", label: "Практика" },
  ],
  direct: [
    { id: "opredelenie", label: "Определение / идея" },
    { id: "algoritm", label: "Алгоритм" },
    { id: "tipichnye-oshibki", label: "Типичные ошибки" },
  ],
  inverse: [
    { id: "ideya", label: "Идея" },
    { id: "algoritm", label: "Алгоритм" },
    { id: "oshibki", label: "Типичные ошибки" },
  ],
  problems: [
    { id: "ideya", label: "Идея" },
    { id: "algoritm", label: "Алгоритм" },
    { id: "oshibki", label: "Типичные ошибки" },
  ],
};

const DEFAULT_SKILL_PAGE_SLUG = "find-unknown";

export const proportionSkills: ProportionSkill[] = [
  {
    id: "math.proportion.understand_ratio_as_quotient",
    title: "Понимать отношение как частное",
    summary: "про a:b и a/b",
    subtopicId: "math.proportion.direct",
    skillSlug: DEFAULT_SKILL_PAGE_SLUG,
    defaultTrainingCount: 5,
  },
  {
    id: "math.proportion.transform_ratio",
    title: "Упрощение отношения",
    summary: "сократить отношение до несократимого вида",
    subtopicId: "math.proportion.direct",
    skillSlug: DEFAULT_SKILL_PAGE_SLUG,
    defaultTrainingCount: 8,
  },
  {
    id: "math.proportion.compare_ratio_multiples",
    title: "Во сколько раз больше/меньше",
    summary: "сравнить величины по кратности",
    subtopicId: "math.proportion.direct",
    skillSlug: DEFAULT_SKILL_PAGE_SLUG,
    defaultTrainingCount: 8,
  },
  {
    id: "math.proportion.part_of_whole_as_ratio",
    title: "Доля от целого как отношение",
    summary: "находить часть от целого в виде дроби",
    subtopicId: "math.proportion.direct",
    skillSlug: DEFAULT_SKILL_PAGE_SLUG,
    defaultTrainingCount: 8,
  },
  {
    id: "math.proportion.recognize_proportion",
    title: "Определение пропорции",
    summary: "распознавать и дополнять пропорции",
    subtopicId: "math.proportion.rule",
    skillSlug: DEFAULT_SKILL_PAGE_SLUG,
    defaultTrainingCount: 8,
  },
  {
    id: "math.proportion.check_proportion",
    title: "Проверка пропорции по определению",
    summary: "проверять равенство отношений a:b = c:d",
    subtopicId: "math.proportion.rule",
    skillSlug: DEFAULT_SKILL_PAGE_SLUG,
    defaultTrainingCount: 8,
  },
  {
    id: "math.proportion.apply_proportion_property",
    title: "Проверка пропорции по основному свойству",
    summary: "проверять пропорции правилом крест-накрест",
    subtopicId: "math.proportion.rule",
    skillSlug: DEFAULT_SKILL_PAGE_SLUG,
    defaultTrainingCount: 8,
  },
  {
    id: "math.proportion.solve_hidden_linear_fraction",
    title: "Пропорции, замаскированные под линейные дроби",
    summary: "решать пропорции в виде линейных дробей",
    subtopicId: "math.proportion.problems",
    skillSlug: DEFAULT_SKILL_PAGE_SLUG,
    defaultTrainingCount: 8,
  },
  {
    id: "math.proportion.find_unknown_term",
    title: "Нахождение неизвестного члена пропорции",
    summary:
      "находить неизвестный член пропорции с помощью правила крест-накрест",
    subtopicId: "math.proportion.rule",
    skillSlug: DEFAULT_SKILL_PAGE_SLUG,
    defaultTrainingCount: 8,
  },
];

export const proportionBranches: ProportionBranch[] = [
  {
    id: "O",
    order: 1,
    title: {
      ru: "Ветка O: Отношение",
      en: "Branch O: Ratio",
      de: "Zweig O: Verhaeltnis",
    },
    goal: {
      ru: "Базовые действия с отношениями и подготовка к пропорциям.",
      en: "Core ratio operations as a foundation for proportions.",
      de: "Grundlagen zu Verhaeltnissen als Basis fuer Proportionen.",
    },
    skillIds: [
      "math.proportion.understand_ratio_as_quotient",
      "math.proportion.transform_ratio",
      "math.proportion.compare_ratio_multiples",
      "math.proportion.part_of_whole_as_ratio",
    ],
  },
  {
    id: "P",
    order: 2,
    title: {
      ru: "Ветка P: Пропорция",
      en: "Branch P: Proportion",
      de: "Zweig P: Proportion",
    },
    goal: {
      ru: "Распознавать пропорции и работать с их записью.",
      en: "Recognize proportions and work with their notation.",
      de: "Proportionen erkennen und korrekt notieren.",
    },
    skillIds: [
      "math.proportion.recognize_proportion",
      "math.proportion.check_proportion",
      "math.proportion.apply_proportion_property",
    ],
    dependsOn: ["O"],
  },
  {
    id: "E",
    order: 3,
    title: {
      ru: "Ветка E: Уравнения на пропорции",
      en: "Branch E: Proportion Equations",
      de: "Zweig E: Proportionen als Gleichungen",
    },
    goal: {
      ru: "Решать уравнения, замаскированные под пропорции.",
      en: "Solve equations disguised as proportions.",
      de: "Gleichungen loesen, die als Proportionen dargestellt sind.",
    },
    skillIds: [
      "math.proportion.solve_hidden_linear_fraction",
      "math.proportion.find_unknown_term",
    ],
    dependsOn: ["P"],
  },
];

export function getProportionBranchValidationErrors() {
  const skillIds = new Set(proportionSkills.map((skill) => skill.id));
  const errors: string[] = [];

  for (const branch of proportionBranches) {
    for (const skillId of branch.skillIds) {
      if (!skillIds.has(skillId)) {
        errors.push(`Unknown skill_id in branch ${branch.id}: ${skillId}`);
      }
    }
  }

  return errors;
}

export function getProportionBranchBySkillId(skillId: string) {
  return proportionBranches.find((branch) => branch.skillIds.includes(skillId));
}

export function getSubtopicBySlug(slug: string) {
  return proportionSubtopics.find((item) => item.slug === slug);
}

export function getSkillsForSubtopic(subtopicId: ProportionSubtopic["id"]) {
  return proportionSkills.filter((skill) => skill.subtopicId === subtopicId);
}
