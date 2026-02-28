export type TopicMasteryLevel = {
  id: string;
  title: string;
  hint?: string;
  skillIds: string[];
};

export type TopicMasteryData = {
  masteryLevels: TopicMasteryLevel[];
};

export const topicMastery: Record<string, TopicMasteryData> = {
  "math.proportion": {
    masteryLevels: [
      {
        id: "base",
        title: "База",
        hint: "Понимание и проверка записи пропорции.",
        skillIds: [
          "math.proportion.recognize_proportion",
          "math.proportion.check_proportion",
          "math.proportion.apply_proportion_property",
        ],
      },
      {
        id: "calculation",
        title: "Вычисление",
        hint: "Находим неизвестный член и собираем пропорцию.",
        skillIds: [
          "math.proportion.find_unknown_extreme",
          "math.proportion.find_unknown_middle",
          "math.proportion.build_proportion_from_text",
        ],
      },
      {
        id: "application",
        title: "Применение",
        hint: "Решаем типовые задачи на пропорции.",
        skillIds: [
          "math.proportion.solve_scale_word_problem",
          "math.proportion.solve_price_word_problem",
          "math.proportion.solve_productivity_word_problem",
        ],
      },
    ],
  },
};

