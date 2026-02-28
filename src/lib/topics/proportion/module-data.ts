export type ProportionSubtopic = {
  id: "math.proportion.rule" | "math.proportion.direct" | "math.proportion.inverse" | "math.proportion.problems";
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
    description: "Свойство ad = bc, проверка пропорции и поиск неизвестного члена.",
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
    description: "Текстовые задачи на масштаб, цену, производительность и модели.",
    status: "ready",
  },
];

export const proportionSubtopicToc: Record<ProportionSubtopic["slug"], SubtopicTocItem[]> = {
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
    id: "math.proportion.recognize_proportion",
    title: "Распознать пропорцию",
    summary: "Понять, можно ли считать запись равенством двух отношений.",
    subtopicId: "math.proportion.rule",
    skillSlug: DEFAULT_SKILL_PAGE_SLUG,
  },
  {
    id: "math.proportion.check_proportion",
    title: "Проверить пропорцию",
    summary: "Проверка равенства отношений по основному свойству.",
    subtopicId: "math.proportion.rule",
    skillSlug: DEFAULT_SKILL_PAGE_SLUG,
  },
  {
    id: "math.proportion.find_unknown_extreme",
    title: "Найти неизвестный крайний член",
    summary: "Решение пропорций вида $\\frac{x}{b}=\\frac{c}{d}$ или $\\frac{a}{b}=\\frac{c}{x}$.",
    subtopicId: "math.proportion.rule",
    skillSlug: DEFAULT_SKILL_PAGE_SLUG,
  },
  {
    id: "math.proportion.find_unknown_middle",
    title: "Найти неизвестный средний член",
    summary: "Решение пропорций, где неизвестное стоит в среднем члене.",
    subtopicId: "math.proportion.rule",
    skillSlug: DEFAULT_SKILL_PAGE_SLUG,
  },
  {
    id: "math.proportion.apply_proportion_property",
    title: "Применить свойство пропорции",
    summary: "Переход от равенства отношений к произведениям $ad=bc$.",
    subtopicId: "math.proportion.rule",
    skillSlug: DEFAULT_SKILL_PAGE_SLUG,
  },
  {
    id: "math.proportion.transform_ratio",
    title: "Преобразовать отношение",
    summary: "Привести отношения к удобному виду перед составлением пропорции.",
    subtopicId: "math.proportion.direct",
    skillSlug: DEFAULT_SKILL_PAGE_SLUG,
  },
  {
    id: "math.proportion.build_proportion_from_text",
    title: "Составить пропорцию по условию",
    summary: "Перевести текстовую зависимость в запись пропорции.",
    subtopicId: "math.proportion.direct",
    skillSlug: DEFAULT_SKILL_PAGE_SLUG,
  },
  {
    id: "math.proportion.solve_productivity_word_problem",
    title: "Задачи на производительность",
    summary: "Применение пропорции в задачах с одинаковым объемом работы.",
    subtopicId: "math.proportion.inverse",
    skillSlug: DEFAULT_SKILL_PAGE_SLUG,
  },
  {
    id: "math.proportion.solve_scale_word_problem",
    title: "Задачи на масштаб",
    summary: "Переход между длиной на плане и длиной на местности через отношение.",
    subtopicId: "math.proportion.problems",
    skillSlug: DEFAULT_SKILL_PAGE_SLUG,
  },
  {
    id: "math.proportion.solve_price_word_problem",
    title: "Задачи на цену",
    summary: "Одинаковая цена за единицу: стоимость, количество, цена.",
    subtopicId: "math.proportion.problems",
    skillSlug: DEFAULT_SKILL_PAGE_SLUG,
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
      "math.proportion.transform_ratio",
    ],
  },
  {
    id: "P",
    order: 2,
    title: {
      ru: "Ветка P: Понятие пропорции",
      en: "Branch P: Proportion Basics",
      de: "Zweig P: Grundlagen der Proportion",
    },
    goal: {
      ru: "Понимание определения и проверка верности пропорции.",
      en: "Understand and verify whether a proportion is valid.",
      de: "Verstehen und pruefen, ob eine Proportion gueltig ist.",
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
      ru: "Ветка E: Уравнения в пропорциях",
      en: "Branch E: Proportion Equations",
      de: "Zweig E: Gleichungen mit Proportionen",
    },
    goal: {
      ru: "Решение пропорций с неизвестным членом.",
      en: "Solve proportions with an unknown term.",
      de: "Proportionen mit unbekanntem Glied loesen.",
    },
    skillIds: [
      "math.proportion.find_unknown_extreme",
      "math.proportion.find_unknown_middle",
    ],
    dependsOn: ["P"],
  },
  {
    id: "T",
    order: 4,
    title: {
      ru: "Ветка T: Преобразования и конструирование",
      en: "Branch T: Transform and Construct",
      de: "Zweig T: Umformen und Konstruieren",
    },
    goal: {
      ru: "Составление корректной пропорции из условия.",
      en: "Build a correct proportion from text conditions.",
      de: "Eine korrekte Proportion aus Textbedingungen aufstellen.",
    },
    skillIds: [
      "math.proportion.build_proportion_from_text",
    ],
    dependsOn: ["P"],
  },
  {
    id: "A",
    order: 5,
    optional: true,
    title: {
      ru: "Ветка A: Применение",
      en: "Branch A: Applications",
      de: "Zweig A: Anwendungen",
    },
    goal: {
      ru: "Применение пропорций в сюжетных задачах.",
      en: "Apply proportions in word problems.",
      de: "Proportionen in Sachaufgaben anwenden.",
    },
    skillIds: [
      "math.proportion.solve_scale_word_problem",
      "math.proportion.solve_price_word_problem",
      "math.proportion.solve_productivity_word_problem",
    ],
    dependsOn: ["E", "T"],
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
