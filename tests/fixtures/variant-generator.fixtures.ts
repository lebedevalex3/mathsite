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
    topic_id: "math.proportion",
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

  addSeries("math.proportion.find_unknown_term", 12, [1, 2, 3]);
  addSeries("math.proportion.solve_hidden_linear_fraction", 12, [1, 2, 3]);
  addSeries("math.proportion.apply_proportion_property", 12, [1, 2, 3, 4]);
  addSeries("math.proportion.check_proportion", 12, [1, 2, 3, 4]);
  addSeries("math.proportion.part_of_whole_as_ratio", 12, [1, 2, 3]);
  addSeries("math.proportion.compare_ratio_multiples", 12, [1, 2, 3]);

  return tasks;
}

export function createTemplateFixture(): VariantTemplate {
  return {
    id: "math.proportion.test.10",
    title: "Test template 10",
    topicId: "math.proportion",
    sections: [
      {
        label: "Основное свойство",
        skillIds: [
          "math.proportion.find_unknown_term",
          "math.proportion.solve_hidden_linear_fraction",
        ],
        count: 6,
        difficulty: [1, 3],
      },
      {
        label: "Отношения",
        skillIds: [
          "math.proportion.part_of_whole_as_ratio",
          "math.proportion.compare_ratio_multiples",
        ],
        count: 4,
        difficulty: [1, 3],
      },
    ],
    header: {
      gradeLabel: "5 класс",
      topicLabel: "Пропорции",
    },
  };
}
