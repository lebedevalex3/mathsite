import type { Task } from "@/lib/tasks/schema";
import type { VariantTemplate } from "@/src/lib/variants/types";

function makeTask(params: {
  skillId: string;
  index: number;
  difficulty: number;
}): Task {
  const { skillId, index, difficulty } = params;
  const suffix = String(index).padStart(6, "0");
  return {
    id: `${skillId}.${suffix}`,
    topic_id: "g5.proporcii",
    skill_id: skillId,
    difficulty,
    statement_md: `Задача ${skillId} #${index}`,
    answer: { type: "number", value: index },
  };
}

export function createTaskBankFixture(): Task[] {
  const tasks: Task[] = [];

  const addSeries = (skillId: string, count: number, difficulties: number[]) => {
    for (let i = 0; i < count; i += 1) {
      tasks.push(
        makeTask({
          skillId,
          index: i + 1,
          difficulty: difficulties[i % difficulties.length] ?? 1,
        }),
      );
    }
  };

  addSeries("g5.proporcii.naiti_neizvestnyi_krainei", 12, [1, 2, 3, 4]);
  addSeries("g5.proporcii.naiti_neizvestnyi_srednii", 12, [1, 2, 3, 4]);
  addSeries("g5.proporcii.primenit_svoistvo_proporcii", 12, [1, 2, 3, 4]);
  addSeries("g5.proporcii.proverit_proporciyu", 12, [1, 2, 3, 4]);
  addSeries("g5.proporcii.reshit_zadachu_na_cenu", 12, [1, 2, 3, 4]);
  addSeries("g5.proporcii.reshit_zadachu_na_masshtab", 12, [2, 3, 4]);

  return tasks;
}

export function createTemplateFixture(): VariantTemplate {
  return {
    id: "g5.proporcii.test.10",
    title: "Test template 10",
    topicId: "g5.proporcii",
    sections: [
      {
        label: "Основное свойство",
        skillIds: [
          "g5.proporcii.naiti_neizvestnyi_krainei",
          "g5.proporcii.naiti_neizvestnyi_srednii",
        ],
        count: 6,
        difficulty: [1, 3],
      },
      {
        label: "Задачи",
        skillIds: [
          "g5.proporcii.reshit_zadachu_na_cenu",
          "g5.proporcii.reshit_zadachu_na_masshtab",
        ],
        count: 4,
        difficulty: [2, 4],
      },
    ],
    header: {
      gradeLabel: "5 класс",
      topicLabel: "Пропорции",
    },
  };
}
