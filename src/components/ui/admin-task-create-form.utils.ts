type SkillOptionItem = {
  topicId: string;
  skillId: string;
  title: string;
};

function normalizeQuery(raw: string) {
  return raw.trim().toLowerCase();
}

export function filterTaskSkillsByTopic(
  skillItems: SkillOptionItem[],
  topicId: string,
  query: string,
): SkillOptionItem[] {
  if (!topicId || topicId === "all") return [];

  const q = normalizeQuery(query);
  return skillItems
    .filter((item) => item.topicId === topicId)
    .filter((item) => {
      if (!q) return true;
      return [item.skillId, item.title].join(" ").toLowerCase().includes(q);
    })
    .sort((left, right) => left.skillId.localeCompare(right.skillId));
}

export function validateTaskSkillSelection(params: {
  skillIdRaw: string;
  topicId: string;
  topicSkillSet: Set<string>;
  requiredMessage: string;
  invalidMessage: string;
}) {
  const skillId = params.skillIdRaw.trim();
  if (!skillId) return params.requiredMessage;
  if (!params.topicId || params.topicId === "all") return null;
  if (params.topicSkillSet.size > 0 && !params.topicSkillSet.has(skillId)) {
    return params.invalidMessage;
  }
  return null;
}

