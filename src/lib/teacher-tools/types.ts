import type { DifficultyBand } from "@/lib/tasks/difficulty-band";
import type { SkillKind } from "@/src/lib/skills/kind";
import type { NormalizedSkillPrereqEdge } from "./prereqs";

export type TeacherToolsSkill = {
  id: string;
  title: string;
  branchId?: string;
  summary?: string;
  example?: string;
  cardHref?: string;
  algorithm?: string[];
  trainerHref?: string;
  availableCount?: number;
  availableByDifficulty?: {
    1: number;
    2: number;
    3: number;
  };
  availableByBand?: Record<DifficultyBand, number>;
  defaultTrainingCount?: number;
  status?: "ready" | "soon";
  kind?: SkillKind;
};

export type TeacherToolsRouteStep = {
  step_id: string;
  skill_id: string;
  allowed_bands: DifficultyBand[];
  order: number;
  allowed_archetypes?: string[];
};

export type TeacherToolsRoute = {
  routeId: string;
  title: string;
  steps: TeacherToolsRouteStep[];
  warnings?: string[];
};

export type TeacherToolsTopicConfig = {
  topicId: string;
  sectionId?: string;
  moduleId?: string;
  gradeTags?: number[];
  title: Record<"ru" | "en" | "de", string>;
  skills: TeacherToolsSkill[];
  routes?: TeacherToolsRoute[];
  skillEdges?: NormalizedSkillPrereqEdge[];
};

export type DemoPlanItem = {
  topicId?: string;
  skillId: string;
  count: number;
  difficulty?: 1 | 2 | 3;
  routeId?: string | null;
  route_id?: string | null;
  allowedBands?: DifficultyBand[];
};
