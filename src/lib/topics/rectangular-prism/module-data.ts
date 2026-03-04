import type { SkillKind } from "@/src/lib/skills/kind";

export type RectangularPrismSkill = {
  key: string;
  id: string;
  title: string;
  stage: "S1";
  kind: SkillKind;
  summary: string;
};

const TOPIC_ID = "math.rectangular_prism";

function makeSkillId(key: string) {
  return `${TOPIC_ID}.${key.replace(/\./g, "_")}`;
}

export const rectangularPrismSkills: RectangularPrismSkill[] = [
  {
    key: "s.volume_relations",
    id: makeSkillId("s.volume_relations"),
    title: "Объем параллелепипеда по связям между измерениями",
    stage: "S1",
    kind: "geometry_compute",
    summary: "Нахождение объема через зависимости длины, ширины и высоты.",
  },
];

export const rectangularPrismSkillIdByKey = new Map(
  rectangularPrismSkills.map((skill) => [skill.key, skill.id] as const),
);
