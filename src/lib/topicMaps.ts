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
      "Отношение показывает, во сколько раз одна величина больше или меньше другой.",
      "Пропорция — равенство двух отношений.",
      "Основное свойство пропорции: a/b = c/d ⇔ ad = bc.",
    ],
    algorithm: [
      "Упрощай и сравнивай отношения в одинаковой форме.",
      "Распознай пропорцию и проверь ее по определению или по свойству ad = bc.",
      "При неизвестном члене вырази его из ad = bc и вычисли.",
      "Для скрытых дробных форм приведи выражение к пропорции и проверь подстановкой.",
    ],
    pitfalls: [
      "Путают отношение часть/целое и целое/часть.",
      "Смешивают разные единицы измерения в одном отношении.",
      "Ошибаются в произведениях крайних и средних членов при проверке пропорции.",
    ],
    path: {
      steps: [
        { type: "skill", id: "ratio_quotient" },
        { type: "skill", id: "transform_ratio" },
        { type: "skill", id: "compare_ratio" },
        { type: "skill", id: "part_of_whole" },
        { type: "skill", id: "recognize" },
        { type: "skill", id: "check" },
        { type: "skill", id: "apply_property" },
        { type: "skill", id: "find_unknown" },
        { type: "skill", id: "hidden_linear" },
      ],
    },
    skills: {
      nodes: [
        {
          id: "ratio_quotient",
          title: "Понимать отношение как частное",
          status: "ready",
          skillId: "math.proportion.understand_ratio_as_quotient",
        },
        {
          id: "transform_ratio",
          title: "Упрощать отношение",
          status: "ready",
          skillId: "math.proportion.transform_ratio",
        },
        {
          id: "compare_ratio",
          title: "Сравнивать по кратности",
          status: "ready",
          skillId: "math.proportion.compare_ratio_multiples",
        },
        {
          id: "part_of_whole",
          title: "Находить долю от целого",
          status: "ready",
          skillId: "math.proportion.part_of_whole_as_ratio",
        },
        {
          id: "recognize",
          title: "Распознать пропорцию",
          status: "ready",
          skillId: "math.proportion.recognize_proportion",
        },
        {
          id: "check",
          title: "Проверить пропорцию",
          status: "ready",
          skillId: "math.proportion.check_proportion",
        },
        {
          id: "apply_property",
          title: "Применить основное свойство",
          status: "ready",
          skillId: "math.proportion.apply_proportion_property",
        },
        {
          id: "find_unknown",
          title: "Найти неизвестный член",
          status: "ready",
          skillId: "math.proportion.find_unknown_term",
        },
        {
          id: "hidden_linear",
          title: "Решать скрытые дробные пропорции",
          status: "ready",
          skillId: "math.proportion.solve_hidden_linear_fraction",
        },
      ],
      edges: [
        { from: "ratio_quotient", to: "transform_ratio" },
        { from: "transform_ratio", to: "compare_ratio" },
        { from: "compare_ratio", to: "part_of_whole" },
        { from: "part_of_whole", to: "recognize" },
        { from: "recognize", to: "check" },
        { from: "check", to: "apply_property" },
        { from: "apply_property", to: "find_unknown" },
        { from: "find_unknown", to: "hidden_linear" },
      ],
    },
  },
};
