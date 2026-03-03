export const SKILL_KINDS = [
  "compute",
  "apply",
  "expression",
  "algebra",
  "equation",
  "word",
  "geometry_compute",
] as const;

export type SkillKind = (typeof SKILL_KINDS)[number];

export const DEFAULT_SKILL_KIND: SkillKind = "compute";

export function isSkillKind(value: unknown): value is SkillKind {
  return typeof value === "string" && (SKILL_KINDS as readonly string[]).includes(value);
}

export function getSkillKind(skill: { kind?: unknown }): SkillKind {
  if (isSkillKind(skill.kind)) return skill.kind;
  return DEFAULT_SKILL_KIND;
}
