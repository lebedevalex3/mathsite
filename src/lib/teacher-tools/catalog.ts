import { getTasksForTopic } from "@/lib/tasks/query";
import { proporciiSkills } from "@/src/app/[locale]/5-klass/proporcii/module-data";
import { listContentTopicConfigs } from "@/src/lib/content/topic-registry";

import type { TeacherToolsSkill, TeacherToolsTopicConfig } from "./types";

const uravneniyaSkills: TeacherToolsSkill[] = [
  {
    id: "g5.uravneniya.ponyat_uravnenie_i_koren",
    title: "Понимать, что такое уравнение и корень",
    summary: "Различать уравнение и находить число, которое делает равенство верным.",
    status: "ready",
  },
  {
    id: "g5.uravneniya.proverit_koren",
    title: "Проверять, является ли число корнем уравнения",
    summary: "Подставлять число и определять, верно ли равенство.",
    status: "ready",
  },
  {
    id: "g5.uravneniya.reshat_x_plus_minus_a_ravno_b",
    title: "Решать x + a = b и x - a = b",
    summary: "Находить неизвестное при сложении и вычитании, когда x стоит слева.",
    status: "ready",
  },
  {
    id: "g5.uravneniya.reshat_a_plus_minus_x_ravno_b",
    title: "Решать a + x = b и a - x = b",
    summary: "Решать уравнения, где неизвестное стоит после числа.",
    status: "ready",
  },
  {
    id: "g5.uravneniya.reshat_mnozhenie_i_delenie",
    title: "Решать a·x = b и x : a = b",
    summary: "Решать уравнения на умножение и деление с целыми ответами.",
    status: "ready",
  },
  {
    id: "g5.uravneniya.reshat_prostye_tekstovye_uravneniya",
    title: "Составлять и решать простые уравнения по условию",
    summary: "Короткие текстовые задачи в 1 шаг на составление уравнения.",
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
