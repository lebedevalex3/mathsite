import test from "node:test";
import assert from "node:assert/strict";

import { toPrintableTask, toPrintableTasks } from "@/src/lib/variants/printable-task";

test("toPrintableTask classifies short plain-text task as short with inline answer space", () => {
  const item = toPrintableTask({
    taskId: "math.proportion.test.000001",
    orderIndex: 0,
    task: {
      statement_md: "Найди x: 2x = 10.",
      answer: { type: "number", value: 5 },
      skill_id: "math.proportion.find_unknown_term",
    },
  });

  assert.equal(item.print.complexity, "short");
  assert.equal(item.print.answerSpaceHint, "inline");
  assert.equal(item.answerText, "5");
  assert.equal(item.print.hasKatex, false);
});

test("toPrintableTask detects display math and upgrades complexity", () => {
  const item = toPrintableTask({
    taskId: "math.proportion.test.000002",
    orderIndex: 1,
    task: {
      statement_md: "Реши:\n\n$$\\frac{3}{5} = \\frac{x}{15}$$",
    },
  });

  assert.equal(item.print.hasDisplayMath, true);
  assert.equal(item.print.hasKatex, true);
  assert.ok(item.print.estimatedLines >= 3);
  assert.notEqual(item.print.complexity, "short");
});

test("toPrintableTask classifies long word problem as long", () => {
  const item = toPrintableTask({
    taskId: "math.proportion.test.000003",
    orderIndex: 2,
    task: {
      statement_md:
        "Две бригады выполняют заказ. Первая делает 12 деталей за 3 часа, вторая делает 20 деталей за 4 часа. Сколько деталей сделает каждая бригада за 7 часов при той же производительности? Объясни рассуждение и запиши пропорцию.",
      answer: { type: "number", value: 56 },
    },
  });

  assert.equal(item.print.complexity, "long");
  assert.ok(item.print.textChars >= 220);
  assert.equal(item.print.answerSpaceHint, "medium");
});

test("toPrintableTask prefers answer_md over numeric answer", () => {
  const item = toPrintableTask({
    taskId: "math.proportion.test.000004",
    orderIndex: 3,
    task: {
      statement_md: "Представь ответ в виде отношения.",
      answer: { type: "number", value: 2 },
      answer_md: "4:2",
    },
  });

  assert.equal(item.answerText, "4:2");
});

test("toPrintableTasks sorts by orderIndex", () => {
  const items = toPrintableTasks([
    {
      taskId: "b",
      orderIndex: 2,
      task: { statement_md: "B" },
    },
    {
      taskId: "a",
      orderIndex: 0,
      task: { statement_md: "A" },
    },
  ]);

  assert.deepEqual(items.map((x) => x.taskId), ["a", "b"]);
});

