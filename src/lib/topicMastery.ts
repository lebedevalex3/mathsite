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
  "g5.proporcii": {
    masteryLevels: [
      {
        id: "base",
        title: "База",
        hint: "Понимание и проверка записи пропорции.",
        skillIds: [
          "g5.proporcii.raspoznat_proporciyu",
          "g5.proporcii.proverit_proporciyu",
          "g5.proporcii.primenit_svoistvo_proporcii",
        ],
      },
      {
        id: "calculation",
        title: "Вычисление",
        hint: "Находим неизвестный член и собираем пропорцию.",
        skillIds: [
          "g5.proporcii.naiti_neizvestnyi_krainei",
          "g5.proporcii.naiti_neizvestnyi_srednii",
          "g5.proporcii.sostavit_proporciyu_po_usloviyu",
        ],
      },
      {
        id: "application",
        title: "Применение",
        hint: "Решаем типовые задачи на пропорции.",
        skillIds: [
          "g5.proporcii.reshit_zadachu_na_masshtab",
          "g5.proporcii.reshit_zadachu_na_cenu",
          "g5.proporcii.reshit_zadachu_na_proizvoditelnost",
        ],
      },
    ],
  },
};

