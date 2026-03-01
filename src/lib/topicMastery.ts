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
        hint: "Базовые операции с отношениями и долями.",
        skillIds: [
          "math.proportion.understand_ratio_as_quotient",
          "math.proportion.transform_ratio",
          "math.proportion.compare_ratio_multiples",
          "math.proportion.part_of_whole_as_ratio",
        ],
      },
      {
        id: "calculation",
        title: "Пропорция",
        hint: "Распознаем пропорции, проверяем запись и находим неизвестный член.",
        skillIds: [
          "math.proportion.recognize_proportion",
          "math.proportion.check_proportion",
          "math.proportion.apply_proportion_property",
          "math.proportion.find_unknown_term",
        ],
      },
      {
        id: "application",
        title: "Применение",
        hint: "Решаем пропорции в скрытой форме линейных дробей.",
        skillIds: [
          "math.proportion.solve_hidden_linear_fraction",
        ],
      },
    ],
  },
};
