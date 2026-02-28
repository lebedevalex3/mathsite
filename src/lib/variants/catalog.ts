import { proportionSkills, proportionSubtopics } from "@/src/lib/topics/proportion/module-data";

export function getProportionSkillMap() {
  return new Map(proportionSkills.map((skill) => [skill.id, skill]));
}

export function getProportionSubtopicMap() {
  return new Map(proportionSubtopics.map((subtopic) => [subtopic.id, subtopic]));
}
