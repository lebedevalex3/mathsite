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
    skillIds: ["math.proportion.understand_ratio_as_quotient"],
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
