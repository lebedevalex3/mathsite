import { proporciiSkills, proporciiSubtopics } from "@/src/app/[locale]/5-klass/proporcii/module-data";

export function getProporciiSkillMap() {
  return new Map(proporciiSkills.map((skill) => [skill.id, skill]));
}

export function getProporciiSubtopicMap() {
  return new Map(proporciiSubtopics.map((subtopic) => [subtopic.id, subtopic]));
}
