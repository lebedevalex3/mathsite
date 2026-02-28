import { listTeacherToolsTopics } from "@/src/lib/teacher-tools/catalog";

export function getMasteryMinAttemptsBySkill(topicId: string): Record<string, number> {
  const topic = listTeacherToolsTopics().find((item) => item.topicId === topicId);
  if (!topic) return {};

  const thresholds: Record<string, number> = {};
  for (const skill of topic.skills) {
    if (
      Number.isFinite(skill.defaultTrainingCount) &&
      skill.defaultTrainingCount != null &&
      skill.defaultTrainingCount > 0
    ) {
      thresholds[skill.id] = Math.trunc(skill.defaultTrainingCount);
    }
  }
  return thresholds;
}
