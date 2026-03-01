import { getTasksForTopic } from "@/lib/tasks/query";
import { proportionSkills } from "@/src/lib/topics/proportion/module-data";
import { listContentTopicConfigs } from "@/src/lib/content/topic-registry";

import type { TeacherToolsSkill, TeacherToolsTopicConfig } from "./types";

const proportionSkillCards: Record<
  string,
  Pick<TeacherToolsSkill, "cardHref" | "trainerHref" | "example" | "algorithm">
> = {
  "math.proportion.understand_ratio_as_quotient": {
    cardHref: "/teacher-tools/skills/math.proportion.understand_ratio_as_quotient",
    trainerHref: "/topics/proportion/train?skill=math.proportion.understand_ratio_as_quotient",
    example: "Запиши отношение 12:3 как частное и вычисли.",
    algorithm: [
      "Прочитай запись a:b как a/b.",
      "Вычисли частное и сократи дробь при необходимости.",
      "Проверь, что смысл отношения сохранен.",
    ],
  },
  "math.proportion.transform_ratio": {
    cardHref: "/teacher-tools/skills/math.proportion.transform_ratio",
    trainerHref: "/topics/proportion/train?skill=math.proportion.transform_ratio",
    example: "Преобразуй отношение 12:18 к простому виду.",
    algorithm: [
      "Найди общий делитель чисел в отношении.",
      "Раздели обе части отношения на один и тот же делитель.",
      "Убедись, что отношение стало проще.",
    ],
  },
  "math.proportion.compare_ratio_multiples": {
    cardHref: "/teacher-tools/skills/math.proportion.compare_ratio_multiples",
    trainerHref: "/topics/proportion/train?skill=math.proportion.compare_ratio_multiples",
    example: "Во сколько раз 24 больше 6?",
    algorithm: [
      "Определи, какую величину сравнивают с какой (больше/меньше).",
      "Раздели большую величину на меньшую.",
      "Запиши результат с формулировкой «в ... раз».",
    ],
  },
  "math.proportion.part_of_whole_as_ratio": {
    cardHref: "/teacher-tools/skills/math.proportion.part_of_whole_as_ratio",
    trainerHref: "/topics/proportion/train?skill=math.proportion.part_of_whole_as_ratio",
    example: "В классе 20 учеников, 5 из них дежурные. Какую часть составляют дежурные?",
    algorithm: [
      "Определи часть и целое.",
      "Запиши отношение часть/целое в виде дроби.",
      "Сократи дробь и при необходимости переведи в проценты.",
    ],
  },
  "math.proportion.recognize_proportion": {
    cardHref: "/teacher-tools/skills/math.proportion.recognize_proportion",
    trainerHref: "/topics/proportion/train?skill=math.proportion.recognize_proportion",
    example: "Является ли равенство 2:3 = 4:6 пропорцией?",
    algorithm: [
      "Проверь, что записаны два отношения.",
      "Сравни их значения или приведи к общему виду.",
      "Если отношения равны, это пропорция.",
    ],
  },
  "math.proportion.check_proportion": {
    cardHref: "/teacher-tools/skills/math.proportion.check_proportion",
    trainerHref: "/topics/proportion/train?skill=math.proportion.check_proportion",
    example: "Проверь пропорцию: 3/5 = 9/15.",
    algorithm: [
      "Перемножь крайние и средние члены.",
      "Сравни полученные произведения.",
      "Если они равны, пропорция верна.",
    ],
  },
  "math.proportion.apply_proportion_property": {
    cardHref: "/teacher-tools/skills/math.proportion.apply_proportion_property",
    trainerHref: "/topics/proportion/train?skill=math.proportion.apply_proportion_property",
    example: "Используй ad = bc для 4/7 = x/21.",
    algorithm: [
      "Перепиши пропорцию в виде произведений ad = bc.",
      "Подставь известные значения.",
      "Найди неизвестное и проверь.",
    ],
  },
  "math.proportion.find_unknown_term": {
    cardHref: "/teacher-tools/skills/math.proportion.find_unknown_term",
    trainerHref: "/topics/proportion/train?skill=math.proportion.find_unknown_term",
    example: "Реши пропорцию: 3:5 = x:20.",
    algorithm: [
      "Применяй равенство произведений ad = bc.",
      "Вырази неизвестный член через известные.",
      "Посчитай и проверь ответ.",
    ],
  },
  "math.proportion.solve_hidden_linear_fraction": {
    cardHref: "/teacher-tools/skills/math.proportion.solve_hidden_linear_fraction",
    trainerHref: "/topics/proportion/train?skill=math.proportion.solve_hidden_linear_fraction",
    example: "Реши: (x + 2) / 6 = 5 / 3.",
    algorithm: [
      "Приведи выражение к пропорции и запиши пары членов.",
      "Применяй свойство ad = bc.",
      "Реши уравнение и проверь подстановкой.",
    ],
  },
};

const uravneniyaSkills: TeacherToolsSkill[] = [
  {
    id: "math.equations.understand_equation_and_root",
    title: "Понимать, что такое уравнение и корень",
    summary: "Различать уравнение и находить число, которое делает равенство верным.",
    example: "Какое число является корнем уравнения x + 4 = 9?",
    cardHref: "/teacher-tools/skills/math.equations.understand_equation_and_root",
    trainerHref: "/topics/equations/train?skill=math.equations.understand_equation_and_root",
    algorithm: [
      "Прочитай уравнение и найди, где стоит x.",
      "Подбери число или выполни обратное действие.",
      "Подставь найденное число в уравнение.",
      "Проверь, что левая и правая части равны.",
    ],
    defaultTrainingCount: 10,
    status: "ready",
  },
  {
    id: "math.equations.check_root",
    title: "Проверять, является ли число корнем уравнения",
    summary: "Подставлять число и определять, верно ли равенство.",
    example: "Проверь: число 3 является корнем уравнения x + 5 = 8?",
    cardHref: "/teacher-tools/skills/math.equations.check_root",
    trainerHref: "/topics/equations/train?skill=math.equations.check_root",
    algorithm: [
      "Подставь данное число вместо x.",
      "Вычисли левую часть уравнения.",
      "Сравни результат с правой частью.",
      "Если равны — это корень, если нет — не корень.",
    ],
    defaultTrainingCount: 10,
    status: "ready",
  },
  {
    id: "math.equations.solve_x_plus_minus_a_equals_b",
    title: "Решать x + a = b и x - a = b",
    summary: "Находить неизвестное при сложении и вычитании, когда x стоит слева.",
    example: "Реши уравнение: x + 9 = 17",
    cardHref: "/teacher-tools/skills/math.equations.solve_x_plus_minus_a_equals_b",
    trainerHref: "/topics/equations/train?skill=math.equations.solve_x_plus_minus_a_equals_b",
    algorithm: [
      "Определи вид уравнения: x + a = b или x - a = b.",
      "Для x + a = b: вычисли x = b - a.",
      "Для x - a = b: вычисли x = b + a.",
      "Подставь ответ и проверь равенство.",
    ],
    defaultTrainingCount: 10,
    status: "ready",
  },
  {
    id: "math.equations.solve_a_plus_minus_x_equals_b",
    title: "Решать a + x = b и a - x = b",
    summary: "Решать уравнения, где неизвестное стоит после числа.",
    example: "Реши уравнение: 25 - x = 7",
    cardHref: "/teacher-tools/skills/math.equations.solve_a_plus_minus_x_equals_b",
    trainerHref: "/topics/equations/train?skill=math.equations.solve_a_plus_minus_x_equals_b",
    algorithm: [
      "Определи вид уравнения: a + x = b или a - x = b.",
      "Для a + x = b: вычисли x = b - a.",
      "Для a - x = b: вычисли x = a - b.",
      "Подставь найденное значение и проверь.",
    ],
    defaultTrainingCount: 10,
    status: "ready",
  },
  {
    id: "math.equations.solve_multiplication_and_division_equations",
    title: "Решать a·x = b и x : a = b",
    summary: "Решать уравнения на умножение и деление с целыми ответами.",
    example: "Реши уравнение: 6 · x = 42",
    cardHref: "/teacher-tools/skills/math.equations.solve_multiplication_and_division_equations",
    trainerHref: "/topics/equations/train?skill=math.equations.solve_multiplication_and_division_equations",
    algorithm: [
      "Определи вид уравнения: a · x = b или x : a = b.",
      "Для a · x = b: вычисли x = b : a.",
      "Для x : a = b: вычисли x = b · a.",
      "Проверь ответ обратной подстановкой.",
    ],
    defaultTrainingCount: 10,
    status: "ready",
  },
  {
    id: "math.equations.solve_basic_word_equations",
    title: "Составлять и решать простые уравнения по условию",
    summary: "Короткие текстовые задачи в 1 шаг на составление уравнения.",
    example: "У Маши было x карандашей. После покупки ещё 6 стало 15. Найди x.",
    cardHref: "/teacher-tools/skills/math.equations.solve_basic_word_equations",
    trainerHref: "/topics/equations/train?skill=math.equations.solve_basic_word_equations",
    algorithm: [
      "Выдели неизвестное и обозначь его x.",
      "Переведи условие в уравнение.",
      "Реши уравнение обратным действием.",
      "Проверь ответ по тексту задачи.",
    ],
    defaultTrainingCount: 10,
    status: "ready",
  },
];

const otricatelnyeChislaSkills: TeacherToolsSkill[] = [
  {
    id: "math.negative_numbers.compare_integers",
    title: "Сравнивать целые числа",
    summary: "Сравнивать положительные и отрицательные числа по координатной прямой.",
    example: "Какое число больше: -3 или -8?",
    status: "ready",
  },
  {
    id: "math.negative_numbers.find_absolute_value",
    title: "Находить модуль числа",
    summary: "Определять модуль положительных и отрицательных чисел.",
    example: "Найди модуль числа -12.",
    status: "ready",
  },
  {
    id: "math.negative_numbers.add_subtract_integers",
    title: "Складывать и вычитать целые числа",
    summary: "Выполнять действия с числами разных знаков без скобок.",
    example: "Вычисли: -7 + 10.",
    status: "ready",
  },
  {
    id: "math.negative_numbers.multiply_divide_integers",
    title: "Умножать и делить целые числа",
    summary: "Применять правила знаков при умножении и делении.",
    example: "Вычисли: -6 · 4.",
    status: "ready",
  },
];

export function listTeacherToolsTopics(): TeacherToolsTopicConfig[] {
  const topics: TeacherToolsTopicConfig[] = [];
  for (const cfg of listContentTopicConfigs()) {
    if (cfg.topicSlug === "proportion") {
      topics.push({
        topicId: "math.proportion",
        title: {
          ru: cfg.titles?.ru ?? "Пропорции",
          en: cfg.titles?.en ?? "Proportions",
          de: cfg.titles?.de ?? "Proportionen",
        },
        skills: proportionSkills.map((skill) => ({
          id: skill.id,
          title: skill.title,
          summary: skill.summary,
          cardHref: proportionSkillCards[skill.id]?.cardHref,
          trainerHref: proportionSkillCards[skill.id]?.trainerHref,
          example: proportionSkillCards[skill.id]?.example,
          algorithm: proportionSkillCards[skill.id]?.algorithm,
          defaultTrainingCount: skill.defaultTrainingCount,
          status: "ready" as const,
        })),
      });
      continue;
    }

    if (cfg.topicSlug === "equations") {
      topics.push({
        topicId: "math.equations",
        title: {
          ru: cfg.titles?.ru ?? "Уравнения",
          en: cfg.titles?.en ?? "Equations",
          de: cfg.titles?.de ?? "Gleichungen",
        },
        skills: uravneniyaSkills,
      });
    }

    if (cfg.topicSlug === "negative-numbers") {
      topics.push({
        topicId: "math.negative_numbers",
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
  const countsByDifficulty = new Map<
    string,
    {
      1: number;
      2: number;
      3: number;
    }
  >();
  for (const task of tasks) {
    counts.set(task.skill_id, (counts.get(task.skill_id) ?? 0) + 1);
    if (task.difficulty >= 1 && task.difficulty <= 3) {
      const next = countsByDifficulty.get(task.skill_id) ?? { 1: 0, 2: 0, 3: 0 };
      next[task.difficulty as 1 | 2 | 3] += 1;
      countsByDifficulty.set(task.skill_id, next);
    }
  }

  return {
    ...topic,
    skills: topic.skills.map((skill): TeacherToolsSkill => ({
      ...skill,
      availableCount: counts.get(skill.id) ?? 0,
      availableByDifficulty: countsByDifficulty.get(skill.id) ?? { 1: 0, 2: 0, 3: 0 },
    })),
  };
}
