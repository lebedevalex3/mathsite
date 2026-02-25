export type TopicMapNode = {
  id: string;
  title: string;
};

export type TopicMapEdge = {
  id: string;
  source: string;
  target: string;
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
        { id: "recognize", title: "Распознать пропорцию" },
        { id: "check", title: "Проверить пропорцию" },
        { id: "find_outer", title: "Найти неизвестный крайний" },
        { id: "find_middle", title: "Найти неизвестный средний" },
        { id: "word_problems", title: "Решать задачи на пропорции" },
      ],
      edges: [
        { id: "e1", source: "recognize", target: "check" },
        { id: "e2", source: "check", target: "find_outer" },
        { id: "e3", source: "check", target: "find_middle" },
        { id: "e4", source: "find_outer", target: "word_problems" },
        { id: "e5", source: "find_middle", target: "word_problems" },
      ],
    },
  },
};

