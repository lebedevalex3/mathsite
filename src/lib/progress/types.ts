export type SkillProgressStatus = "not_started" | "in_progress" | "mastered";

export type SkillProgressEntry = {
  total: number;
  correct: number;
  accuracy: number;
  status: SkillProgressStatus;
};

export type SkillProgressMap = Record<string, SkillProgressEntry>;
