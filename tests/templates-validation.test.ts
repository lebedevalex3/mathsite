import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";
import test from "node:test";

import { buildVariantPlan, InsufficientTasksError } from "@/src/lib/variants/plan";
import { TemplateSchema, validateTemplate } from "@/src/lib/variants/templateSchema";
import type { VariantTemplate } from "@/src/lib/variants/types";

import { createTaskBankFixture } from "./fixtures/variant-generator.fixtures";

const TEMPLATE_DIR = path.join(process.cwd(), "templates", "variants", "math", "proportion");

async function loadTemplateFile(fileName: string): Promise<VariantTemplate> {
  const filePath = path.join(TEMPLATE_DIR, fileName);
  const raw = JSON.parse(await fs.readFile(filePath, "utf8")) as unknown;
  return TemplateSchema.parse(raw);
}

test("real teacher templates are valid against TemplateSchema", async () => {
  const files = ["training10.v1.json", "control20.v1.json", "control30.v1.json"];

  for (const file of files) {
    const template = await loadTemplateFile(file);
    assert.ok(template.id.startsWith("math.proportion."));
    assert.equal(template.topicId, "math.proportion");
    assert.ok(template.sections.length > 0);
  }
});

test("fixture task bank can satisfy real templates via variant planner", async () => {
  const tasks = createTaskBankFixture();
  const files = ["training10.v1.json", "control20.v1.json", "control30.v1.json"];

  for (const [index, file] of files.entries()) {
    const template = await loadTemplateFile(file);
    const plan = buildVariantPlan({ tasks, template, seed: `fixture-seed-${index}` });

    const expectedCount = template.sections.reduce((sum, section) => sum + section.count, 0);
    assert.equal(plan.length, expectedCount, `plan length mismatch for ${file}`);
    assert.equal(new Set(plan.map((item) => item.task.id)).size, plan.length, `duplicates in ${file}`);
  }
});

test("validateTemplate throws InvalidTemplateError for malformed template JSON", () => {
  const badTemplate = {
    id: "math.proportion.bad.v1",
    title: "Bad",
    topicId: "math.proportion",
    sections: [
      {
        label: "Broken",
        skillIds: [],
        count: 0,
        difficulty: [4, 1],
      },
    ],
    header: {
      gradeLabel: "5 класс",
      topicLabel: "Пропорции",
    },
  };

  assert.throws(
    () => validateTemplate(badTemplate),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.equal((error as { code?: string }).code, "INVALID_TEMPLATE");
      assert.equal((error as { status?: number }).status, 422);
      return true;
    },
  );
});

test("realistic impossible template fails with INSUFFICIENT_TASKS on fixture task bank", async () => {
  const tasks = createTaskBankFixture();
  const template = await loadTemplateFile("control30.v1.json");
  const impossibleTemplate: VariantTemplate = {
    ...template,
    id: "math.proportion.control30-impossible.v1",
    sections: [
      ...template.sections.slice(0, 1),
      {
        ...template.sections[1],
        label: "Слишком много задач на цену/масштаб",
        count: 40,
      },
    ],
  };

  assert.throws(
    () => buildVariantPlan({ tasks, template: impossibleTemplate, seed: "impossible" }),
    (error: unknown) => {
      assert.ok(error instanceof InsufficientTasksError);
      assert.equal(error.code, "INSUFFICIENT_TASKS");
      assert.equal(error.details.sectionLabel, "Слишком много задач на цену/масштаб");
      return true;
    },
  );
});
