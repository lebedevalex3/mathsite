export type TopicMapNode = {
  id: string;
  title: string;
  subtitle?: string;
  status?: "ready" | "soon";
  skillId?: string;
};

export type TopicMapEdge = {
  from: string;
  to: string;
};

export type TopicMapData = {
  essence: string[];
  algorithm: string[];
  pitfalls: string[];
  path: TopicSkillPath;
  skills: {
    nodes: TopicMapNode[];
    edges: TopicMapEdge[];
  };
};

export type TopicSkillStepRef =
  | { type: "skill"; id: string }
  | {
      type: "branch";
      id: string;
      options: Array<{
        key: string;
        label: string;
        steps: TopicSkillStepRef[];
      }>;
      convergeTo?: string;
    };

export type TopicSkillPath = {
  steps: TopicSkillStepRef[];
};

export const topicMaps: Record<string, TopicMapData> = {
  "math.proportion": {
    essence: [
      "Пропорция — равенство двух отношений.",
      "Основное свойство: a/b = c/d ⇔ ad = bc.",
      "Неизвестный член находят через произведения крайних и средних.",
    ],
    algorithm: [
      "Запиши пропорцию (a/b = c/d).",
      "Перемножь крест-накрест: ad = bc.",
      "Вырази неизвестное и вычисли.",
      "Проверь ответ подстановкой.",
    ],
    pitfalls: [
      "Путают крайние и средние члены пропорции.",
      "Делят не ту пару чисел и нарушают правило крест-накрест.",
    ],
    path: {
      steps: [
        { type: "skill", id: "recognize" },
        { type: "skill", id: "check" },
        {
          type: "branch",
          id: "solve-unknown",
          options: [
            {
              key: "extreme",
              label: "Крайний",
              steps: [{ type: "skill", id: "find_outer" }],
            },
            {
              key: "mean",
              label: "Средний",
              steps: [{ type: "skill", id: "find_middle" }],
            },
          ],
          convergeTo: "word_problems",
        },
      ],
    },
    skills: {
      nodes: [
        {
          id: "recognize",
          title: "Распознать пропорцию",
          status: "soon",
          skillId: "math.proportion.recognize_proportion",
        },
        {
          id: "check",
          title: "Проверить пропорцию",
          status: "ready",
          skillId: "math.proportion.check_proportion",
        },
        {
          id: "find_outer",
          title: "Найти неизвестный крайний",
          status: "ready",
          skillId: "math.proportion.find_unknown_extreme",
        },
        {
          id: "find_middle",
          title: "Найти неизвестный средний",
          status: "ready",
          skillId: "math.proportion.find_unknown_middle",
        },
        {
          id: "word_problems",
          title: "Решать задачи на пропорции",
          status: "ready",
          skillId: "math.proportion.solve_scale_word_problem",
        },
      ],
      edges: [
        { from: "recognize", to: "check" },
        { from: "check", to: "find_outer" },
        { from: "check", to: "find_middle" },
        { from: "find_outer", to: "word_problems" },
        { from: "find_middle", to: "word_problems" },
      ],
    },
  },
};
