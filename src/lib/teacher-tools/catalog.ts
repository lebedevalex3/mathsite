import { getTasksForTopic } from "@/lib/tasks/query";
import { proporciiSkills } from "@/src/lib/topics/proporcii/module-data";
import { listContentTopicConfigs } from "@/src/lib/content/topic-registry";

import type { TeacherToolsSkill, TeacherToolsTopicConfig } from "./types";

const proporciiSkillCards: Record<
  string,
  Pick<TeacherToolsSkill, "cardHref" | "trainerHref" | "example" | "algorithm">
> = {
  "g5.proporcii.raspoznat_proporciyu": {
    cardHref: "/teacher-tools/skills/g5.proporcii.raspoznat_proporciyu",
    trainerHref: "/topics/proporcii/train?skill=g5.proporcii.raspoznat_proporciyu",
    example: "Является ли равенство 2:3 = 4:6 пропорцией?",
    algorithm: [
      "Проверь, что записаны два отношения.",
      "Сравни их значения или приведи к общему виду.",
      "Если отношения равны, это пропорция.",
    ],
  },
  "g5.proporcii.proverit_proporciyu": {
    cardHref: "/teacher-tools/skills/g5.proporcii.proverit_proporciyu",
    trainerHref: "/topics/proporcii/train?skill=g5.proporcii.proverit_proporciyu",
    example: "Проверь пропорцию: 3/5 = 9/15.",
    algorithm: [
      "Перемножь крайние и средние члены.",
      "Сравни полученные произведения.",
      "Если они равны, пропорция верна.",
    ],
  },
  "g5.proporcii.naiti_neizvestnyi_krainei": {
    cardHref: "/teacher-tools/skills/g5.proporcii.naiti_neizvestnyi_krainei",
    trainerHref: "/topics/proporcii/train?skill=g5.proporcii.naiti_neizvestnyi_krainei",
    example: "Реши пропорцию: x/9 = 4/6.",
    algorithm: [
      "Запиши основное свойство пропорции ad = bc.",
      "Вырази неизвестный крайний член.",
      "Выполни вычисления и проверь подстановкой.",
    ],
  },
  "g5.proporcii.naiti_neizvestnyi_srednii": {
    cardHref: "/teacher-tools/skills/g5.proporcii.naiti_neizvestnyi_srednii",
    trainerHref: "/topics/proporcii/train?skill=g5.proporcii.naiti_neizvestnyi_srednii",
    example: "Реши: 3/x = 6/10.",
    algorithm: [
      "Применяй равенство произведений ad = bc.",
      "Вырази неизвестный средний член через известные.",
      "Посчитай и проверь ответ.",
    ],
  },
  "g5.proporcii.primenit_svoistvo_proporcii": {
    cardHref: "/teacher-tools/skills/g5.proporcii.primenit_svoistvo_proporcii",
    trainerHref: "/topics/proporcii/train?skill=g5.proporcii.primenit_svoistvo_proporcii",
    example: "Используй ad = bc для 4/7 = x/21.",
    algorithm: [
      "Перепиши пропорцию в виде произведений ad = bc.",
      "Подставь известные значения.",
      "Найди неизвестное и проверь.",
    ],
  },
  "g5.proporcii.preobrazovat_otnoshenie": {
    cardHref: "/teacher-tools/skills/g5.proporcii.preobrazovat_otnoshenie",
    trainerHref: "/topics/proporcii/train?skill=g5.proporcii.preobrazovat_otnoshenie",
    example: "Преобразуй отношение 12:18 к простому виду.",
    algorithm: [
      "Найди общий делитель чисел в отношении.",
      "Раздели обе части отношения на один и тот же делитель.",
      "Убедись, что отношение стало проще.",
    ],
  },
  "g5.proporcii.sostavit_proporciyu_po_usloviyu": {
    cardHref: "/teacher-tools/skills/g5.proporcii.sostavit_proporciyu_po_usloviyu",
    trainerHref: "/topics/proporcii/train?skill=g5.proporcii.sostavit_proporciyu_po_usloviyu",
    example: "По условию «3 тетради стоят 120 руб.» составь пропорцию для 5 тетрадей.",
    algorithm: [
      "Выдели две связанные величины и одинаковую единицу.",
      "Запиши отношение для известных данных.",
      "Составь второе отношение и приравняй их.",
    ],
  },
  "g5.proporcii.reshit_zadachu_na_proizvoditelnost": {
    cardHref: "/teacher-tools/skills/g5.proporcii.reshit_zadachu_na_proizvoditelnost",
    trainerHref: "/topics/proporcii/train?skill=g5.proporcii.reshit_zadachu_na_proizvoditelnost",
    example: "Если 4 рабочих делают задачу за 6 часов, за сколько сделают 6 рабочих?",
    algorithm: [
      "Определи тип зависимости (обратная пропорциональность).",
      "Составь пропорцию между числом рабочих и временем.",
      "Реши пропорцию и запиши ответ с единицами.",
    ],
  },
  "g5.proporcii.reshit_zadachu_na_masshtab": {
    cardHref: "/teacher-tools/skills/g5.proporcii.reshit_zadachu_na_masshtab",
    trainerHref: "/topics/proporcii/train?skill=g5.proporcii.reshit_zadachu_na_masshtab",
    example: "Масштаб 1:100000, на карте 3 см. Найди расстояние на местности.",
    algorithm: [
      "Запиши соответствие масштаба в одинаковых единицах.",
      "Составь пропорцию «карта - местность».",
      "Реши и переведи ответ в нужные единицы.",
    ],
  },
  "g5.proporcii.reshit_zadachu_na_cenu": {
    cardHref: "/teacher-tools/skills/g5.proporcii.reshit_zadachu_na_cenu",
    trainerHref: "/topics/proporcii/train?skill=g5.proporcii.reshit_zadachu_na_cenu",
    example: "3 кг яблок стоят 180 руб. Сколько стоят 5 кг?",
    algorithm: [
      "Определи, что цена за единицу постоянна.",
      "Составь пропорцию между количеством и стоимостью.",
      "Реши пропорцию и проверь смысл ответа.",
    ],
  },
};

const uravneniyaSkills: TeacherToolsSkill[] = [
  {
    id: "g5.uravneniya.ponyat_uravnenie_i_koren",
    title: "Понимать, что такое уравнение и корень",
    summary: "Различать уравнение и находить число, которое делает равенство верным.",
    example: "Какое число является корнем уравнения x + 4 = 9?",
    cardHref: "/teacher-tools/skills/g5.uravneniya.ponyat_uravnenie_i_koren",
    trainerHref: "/5-klass/uravneniya/train?skill=g5.uravneniya.ponyat_uravnenie_i_koren",
    algorithm: [
      "Прочитай уравнение и найди, где стоит x.",
      "Подбери число или выполни обратное действие.",
      "Подставь найденное число в уравнение.",
      "Проверь, что левая и правая части равны.",
    ],
    status: "ready",
  },
  {
    id: "g5.uravneniya.proverit_koren",
    title: "Проверять, является ли число корнем уравнения",
    summary: "Подставлять число и определять, верно ли равенство.",
    example: "Проверь: число 3 является корнем уравнения x + 5 = 8?",
    cardHref: "/teacher-tools/skills/g5.uravneniya.proverit_koren",
    trainerHref: "/5-klass/uravneniya/train?skill=g5.uravneniya.proverit_koren",
    algorithm: [
      "Подставь данное число вместо x.",
      "Вычисли левую часть уравнения.",
      "Сравни результат с правой частью.",
      "Если равны — это корень, если нет — не корень.",
    ],
    status: "ready",
  },
  {
    id: "g5.uravneniya.reshat_x_plus_minus_a_ravno_b",
    title: "Решать x + a = b и x - a = b",
    summary: "Находить неизвестное при сложении и вычитании, когда x стоит слева.",
    example: "Реши уравнение: x + 9 = 17",
    cardHref: "/teacher-tools/skills/g5.uravneniya.reshat_x_plus_minus_a_ravno_b",
    trainerHref: "/5-klass/uravneniya/train?skill=g5.uravneniya.reshat_x_plus_minus_a_ravno_b",
    algorithm: [
      "Определи вид уравнения: x + a = b или x - a = b.",
      "Для x + a = b: вычисли x = b - a.",
      "Для x - a = b: вычисли x = b + a.",
      "Подставь ответ и проверь равенство.",
    ],
    status: "ready",
  },
  {
    id: "g5.uravneniya.reshat_a_plus_minus_x_ravno_b",
    title: "Решать a + x = b и a - x = b",
    summary: "Решать уравнения, где неизвестное стоит после числа.",
    example: "Реши уравнение: 25 - x = 7",
    cardHref: "/teacher-tools/skills/g5.uravneniya.reshat_a_plus_minus_x_ravno_b",
    trainerHref: "/5-klass/uravneniya/train?skill=g5.uravneniya.reshat_a_plus_minus_x_ravno_b",
    algorithm: [
      "Определи вид уравнения: a + x = b или a - x = b.",
      "Для a + x = b: вычисли x = b - a.",
      "Для a - x = b: вычисли x = a - b.",
      "Подставь найденное значение и проверь.",
    ],
    status: "ready",
  },
  {
    id: "g5.uravneniya.reshat_mnozhenie_i_delenie",
    title: "Решать a·x = b и x : a = b",
    summary: "Решать уравнения на умножение и деление с целыми ответами.",
    example: "Реши уравнение: 6 · x = 42",
    cardHref: "/teacher-tools/skills/g5.uravneniya.reshat_mnozhenie_i_delenie",
    trainerHref: "/5-klass/uravneniya/train?skill=g5.uravneniya.reshat_mnozhenie_i_delenie",
    algorithm: [
      "Определи вид уравнения: a · x = b или x : a = b.",
      "Для a · x = b: вычисли x = b : a.",
      "Для x : a = b: вычисли x = b · a.",
      "Проверь ответ обратной подстановкой.",
    ],
    status: "ready",
  },
  {
    id: "g5.uravneniya.reshat_prostye_tekstovye_uravneniya",
    title: "Составлять и решать простые уравнения по условию",
    summary: "Короткие текстовые задачи в 1 шаг на составление уравнения.",
    example: "У Маши было x карандашей. После покупки ещё 6 стало 15. Найди x.",
    cardHref: "/teacher-tools/skills/g5.uravneniya.reshat_prostye_tekstovye_uravneniya",
    trainerHref: "/5-klass/uravneniya/train?skill=g5.uravneniya.reshat_prostye_tekstovye_uravneniya",
    algorithm: [
      "Выдели неизвестное и обозначь его x.",
      "Переведи условие в уравнение.",
      "Реши уравнение обратным действием.",
      "Проверь ответ по тексту задачи.",
    ],
    status: "ready",
  },
];

const otricatelnyeChislaSkills: TeacherToolsSkill[] = [
  {
    id: "g6.otricatelnye_chisla.sravnit_celye_chisla",
    title: "Сравнивать целые числа",
    summary: "Сравнивать положительные и отрицательные числа по координатной прямой.",
    example: "Какое число больше: -3 или -8?",
    status: "ready",
  },
  {
    id: "g6.otricatelnye_chisla.naiti_modul_chisla",
    title: "Находить модуль числа",
    summary: "Определять модуль положительных и отрицательных чисел.",
    example: "Найди модуль числа -12.",
    status: "ready",
  },
  {
    id: "g6.otricatelnye_chisla.slozhenie_i_vychitanie_celyh",
    title: "Складывать и вычитать целые числа",
    summary: "Выполнять действия с числами разных знаков без скобок.",
    example: "Вычисли: -7 + 10.",
    status: "ready",
  },
  {
    id: "g6.otricatelnye_chisla.umnozhenie_i_delenie_celyh",
    title: "Умножать и делить целые числа",
    summary: "Применять правила знаков при умножении и делении.",
    example: "Вычисли: -6 · 4.",
    status: "ready",
  },
];

export function listTeacherToolsTopics(): TeacherToolsTopicConfig[] {
  const topics: TeacherToolsTopicConfig[] = [];
  for (const cfg of listContentTopicConfigs()) {
    if (cfg.topicSlug === "proporcii") {
      topics.push({
        topicId: "g5.proporcii",
        title: {
          ru: cfg.titles?.ru ?? "Пропорции",
          en: cfg.titles?.en ?? "Proportions",
          de: cfg.titles?.de ?? "Proportionen",
        },
        skills: proporciiSkills.map((skill) => ({
          id: skill.id,
          title: skill.title,
          summary: skill.summary,
          cardHref: proporciiSkillCards[skill.id]?.cardHref,
          trainerHref: proporciiSkillCards[skill.id]?.trainerHref,
          example: proporciiSkillCards[skill.id]?.example,
          algorithm: proporciiSkillCards[skill.id]?.algorithm,
          status: "ready" as const,
        })),
      });
      continue;
    }

    if (cfg.topicSlug === "uravneniya") {
      topics.push({
        topicId: "g5.uravneniya",
        title: {
          ru: cfg.titles?.ru ?? "Уравнения",
          en: cfg.titles?.en ?? "Equations",
          de: cfg.titles?.de ?? "Gleichungen",
        },
        skills: uravneniyaSkills,
      });
    }

    if (cfg.topicSlug === "g6.otricatelnye_chisla") {
      topics.push({
        topicId: "g6.otricatelnye_chisla",
        title: {
          ru: cfg.titles?.ru ?? "Отрицательные числа",
          en: cfg.titles?.en ?? "Negative Numbers",
          de: cfg.titles?.de ?? "Negative Zahlen",
        },
        skills: otricatelnyeChislaSkills,
      });
    }
  }
  return topics;
}

export async function getTeacherToolsTopicSkills(topicId: string) {
  const topic = listTeacherToolsTopics().find((item) => item.topicId === topicId);
  if (!topic) return null;

  const { tasks, errors } = await getTasksForTopic(topicId);
  if (errors.length > 0) {
    throw new Error(`Task bank errors: ${errors[0]}`);
  }

  const counts = new Map<string, number>();
  for (const task of tasks) {
    counts.set(task.skill_id, (counts.get(task.skill_id) ?? 0) + 1);
  }

  return {
    ...topic,
    skills: topic.skills.map((skill): TeacherToolsSkill => ({
      ...skill,
      availableCount: counts.get(skill.id) ?? 0,
    })),
  };
}
