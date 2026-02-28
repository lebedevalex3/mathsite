import test from "node:test";
import assert from "node:assert/strict";

import { buildPrintableWorkDocument, parseStoredWorkPrintFit } from "@/src/lib/variants/printable-work";
import type { VariantDetail } from "@/src/lib/variants/types";

test("buildPrintableWorkDocument normalizes print profile and assembles printable variants", () => {
  const work = {
    id: "work-1",
    topicId: "math.proportion",
    title: "Работа • demo",
    workType: "quiz",
    printProfileJson: {
      version: 1,
      layout: "two",
      fit: {
        recommendedLayout: "two",
        allowTwoUp: true,
        reasons: ["Варианты короткие"],
        metrics: {
          variantsCount: 2,
          maxTasksCount: 10,
          maxTaskChars: 80,
          maxTotalTextChars: 700,
          anyKatex: false,
          anyLongWordProblem: false,
        },
      },
    },
    createdAt: new Date("2026-02-26T10:00:00.000Z"),
    variants: [
      {
        id: "v-1",
        orderIndex: 0,
        title: "Вариант 1",
        createdAt: new Date("2026-02-26T10:00:01.000Z"),
        tasksCount: 1,
      },
      {
        id: "v-2",
        orderIndex: 1,
        title: "Вариант 2",
        createdAt: new Date("2026-02-26T10:00:02.000Z"),
        tasksCount: 1,
      },
    ],
  };

  const makeVariant = (id: string, text: string): VariantDetail => ({
    id,
    ownerUserId: "u1",
    topicId: "math.proportion",
    templateId: "demo",
    title: `Variant ${id}`,
    seed: "seed",
    createdAt: new Date("2026-02-26T10:00:00.000Z"),
    tasks: [
      {
        id: `${id}-t1`,
        taskId: `${id}.task.1`,
        sectionLabel: "Section",
        orderIndex: 0,
        task: {
          id: `${id}.task.1`,
          topic_id: "math.proportion",
          skill_id: "math.proportion.find_unknown_term",
          statement_md: text,
          answer: { type: "number", value: 5 },
          difficulty: 2,
        },
      },
    ],
  });

  const doc = buildPrintableWorkDocument({
    locale: "ru",
    work,
    variantDetailsById: new Map([
      ["v-1", makeVariant("v-1", "Найди x: 2x = 10.")],
      ["v-2", makeVariant("v-2", "Реши: $$\\\\frac{1}{2}=\\\\frac{x}{6}$$")],
    ]),
  });

  assert.equal(doc.profile.layout, "two");
  assert.equal(doc.profile.orientation, "landscape");
  assert.equal(doc.workType, "quiz");
  assert.equal(doc.variants.length, 2);
  assert.equal(doc.variants[0].variantNo, 1);
  assert.equal(doc.variants[1].variantNo, 2);
  assert.equal(doc.variants[1].tasks[0]?.print.hasKatex, true);
  assert.deepEqual(doc.fit?.reasons, ["Варианты короткие"]);
});

test("parseStoredWorkPrintFit returns undefined for malformed payload", () => {
  assert.equal(parseStoredWorkPrintFit(null), undefined);
  assert.equal(parseStoredWorkPrintFit({ fit: {} }), undefined);
});
