export type TeacherToolsSkill = {
  id: string;
  title: string;
  summary?: string;
  example?: string;
  cardHref?: string;
  algorithm?: string[];
  trainerHref?: string;
  availableCount?: number;
  defaultTrainingCount?: number;
  status?: "ready" | "soon";
};

export type TeacherToolsTopicConfig = {
  topicId: string;
  title: Record<"ru" | "en" | "de", string>;
  skills: TeacherToolsSkill[];
};

export type DemoPlanItem = {
  topicId?: string;
  skillId: string;
  count: number;
};
