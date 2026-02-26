export type ProporciiSubtopic = {
  id: "g5.proporcii.rule" | "g5.proporcii.direct" | "g5.proporcii.inverse" | "g5.proporcii.problems";
  slug: "rule" | "direct" | "inverse" | "problems";
  title: string;
  description: string;
  status: "ready" | "soon";
};

export type ProporciiSkill = {
  id: string;
  title: string;
  summary: string;
  subtopicId: ProporciiSubtopic["id"];
  skillSlug: string;
};

export type SubtopicTocItem = {
  id: string;
  label: string;
};

export const proporciiSubtopics: ProporciiSubtopic[] = [
  {
    id: "g5.proporcii.rule",
    slug: "rule",
    title: "Основное правило пропорции",
    description: "Свойство ad = bc, проверка пропорции и поиск неизвестного члена.",
    status: "ready",
  },
  {
    id: "g5.proporcii.direct",
    slug: "direct",
    title: "Прямая пропорциональность",
    description: "Как связаны величины, растущие или уменьшающиеся вместе.",
    status: "ready",
  },
  {
    id: "g5.proporcii.inverse",
    slug: "inverse",
    title: "Обратная пропорциональность",
    description: "Зависимости вида «больше одной величины — меньше другой».",
    status: "ready",
  },
  {
    id: "g5.proporcii.problems",
    slug: "problems",
    title: "Задачи на пропорции",
    description: "Текстовые задачи на масштаб, цену, производительность и модели.",
    status: "ready",
  },
];

export const proporciiSubtopicToc: Record<ProporciiSubtopic["slug"], SubtopicTocItem[]> = {
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

const DEFAULT_SKILL_PAGE_SLUG = "naiti-neizvestnyi";

export const proporciiSkills: ProporciiSkill[] = [
  {
    id: "g5.proporcii.raspoznat_proporciyu",
    title: "Распознать пропорцию",
    summary: "Понять, можно ли считать запись равенством двух отношений.",
    subtopicId: "g5.proporcii.rule",
    skillSlug: DEFAULT_SKILL_PAGE_SLUG,
  },
  {
    id: "g5.proporcii.proverit_proporciyu",
    title: "Проверить пропорцию",
    summary: "Проверка равенства отношений по основному свойству.",
    subtopicId: "g5.proporcii.rule",
    skillSlug: DEFAULT_SKILL_PAGE_SLUG,
  },
  {
    id: "g5.proporcii.naiti_neizvestnyi_krainei",
    title: "Найти неизвестный крайний член",
    summary: "Решение пропорций вида x/b = c/d или a/b = c/x.",
    subtopicId: "g5.proporcii.rule",
    skillSlug: DEFAULT_SKILL_PAGE_SLUG,
  },
  {
    id: "g5.proporcii.naiti_neizvestnyi_srednii",
    title: "Найти неизвестный средний член",
    summary: "Решение пропорций, где неизвестное стоит в среднем члене.",
    subtopicId: "g5.proporcii.rule",
    skillSlug: DEFAULT_SKILL_PAGE_SLUG,
  },
  {
    id: "g5.proporcii.primenit_svoistvo_proporcii",
    title: "Применить свойство пропорции",
    summary: "Переход от равенства отношений к произведениям ad = bc.",
    subtopicId: "g5.proporcii.rule",
    skillSlug: DEFAULT_SKILL_PAGE_SLUG,
  },
  {
    id: "g5.proporcii.preobrazovat_otnoshenie",
    title: "Преобразовать отношение",
    summary: "Привести отношения к удобному виду перед составлением пропорции.",
    subtopicId: "g5.proporcii.direct",
    skillSlug: DEFAULT_SKILL_PAGE_SLUG,
  },
  {
    id: "g5.proporcii.sostavit_proporciyu_po_usloviyu",
    title: "Составить пропорцию по условию",
    summary: "Перевести текстовую зависимость в запись пропорции.",
    subtopicId: "g5.proporcii.direct",
    skillSlug: DEFAULT_SKILL_PAGE_SLUG,
  },
  {
    id: "g5.proporcii.reshit_zadachu_na_proizvoditelnost",
    title: "Задачи на производительность",
    summary: "Применение пропорции в задачах с одинаковым объемом работы.",
    subtopicId: "g5.proporcii.inverse",
    skillSlug: DEFAULT_SKILL_PAGE_SLUG,
  },
  {
    id: "g5.proporcii.reshit_zadachu_na_masshtab",
    title: "Задачи на масштаб",
    summary: "Переход между длиной на плане и длиной на местности через отношение.",
    subtopicId: "g5.proporcii.problems",
    skillSlug: DEFAULT_SKILL_PAGE_SLUG,
  },
  {
    id: "g5.proporcii.reshit_zadachu_na_cenu",
    title: "Задачи на цену",
    summary: "Одинаковая цена за единицу: стоимость, количество, цена.",
    subtopicId: "g5.proporcii.problems",
    skillSlug: DEFAULT_SKILL_PAGE_SLUG,
  },
];

export function getSubtopicBySlug(slug: string) {
  return proporciiSubtopics.find((item) => item.slug === slug);
}

export function getSkillsForSubtopic(subtopicId: ProporciiSubtopic["id"]) {
  return proporciiSkills.filter((skill) => skill.subtopicId === subtopicId);
}
