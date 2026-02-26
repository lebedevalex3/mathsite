export type TeacherToolsSkill = {
  id: string;
  title: string;
  summary?: string;
  availableCount?: number;
  status?: "ready" | "soon";
};

export type TeacherToolsTopicConfig = {
  topicId: string;
  title: Record<"ru" | "en" | "de", string>;
  skills: TeacherToolsSkill[];
};

export type DemoPlanItem = {
  skillId: string;
  count: number;
};
