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
  skills: {
    nodes: TopicMapNode[];
    edges: TopicMapEdge[];
  };
};

export const topicMaps: Record<string, TopicMapData> = {
  "g5.proporcii": {
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
    skills: {
      nodes: [
        {
          id: "recognize",
          title: "Распознать пропорцию",
          status: "soon",
          skillId: "g5.proporcii.raspoznat_proporciyu",
        },
        {
          id: "check",
          title: "Проверить пропорцию",
          status: "ready",
          skillId: "g5.proporcii.proverit_proporciyu",
        },
        {
          id: "find_outer",
          title: "Найти неизвестный крайний",
          status: "ready",
          skillId: "g5.proporcii.naiti_neizvestnyi_krainei",
        },
        {
          id: "find_middle",
          title: "Найти неизвестный средний",
          status: "ready",
          skillId: "g5.proporcii.naiti_neizvestnyi_srednii",
        },
        {
          id: "word_problems",
          title: "Решать задачи на пропорции",
          status: "ready",
          skillId: "g5.proporcii.reshit_zadachu_na_masshtab",
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
