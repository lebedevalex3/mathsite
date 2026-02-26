import { getTasksForTopic } from "@/lib/tasks/query";
import { proporciiSkills } from "@/src/app/[locale]/5-klass/proporcii/module-data";
import { listContentTopicConfigs } from "@/src/lib/content/topic-registry";

import type { TeacherToolsSkill, TeacherToolsTopicConfig } from "./types";

export function listTeacherToolsTopics(): TeacherToolsTopicConfig[] {
  const topics: TeacherToolsTopicConfig[] = [];
  for (const cfg of listContentTopicConfigs()) {
    if (cfg.topicSlug !== "proporcii") continue;
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
