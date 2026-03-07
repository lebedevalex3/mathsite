import assert from "node:assert/strict";
import test from "node:test";

import { loadTaskBank } from "@/lib/taskbank";
import {
  TaskBankValidationError,
  assertValidTaskBankState,
  validateTaskBankState,
} from "@/src/lib/admin/task-bank-validation";

test("validateTaskBankState reports invalid skill ids against taxonomy", async () => {
  const loaded = await loadTaskBank();
  const target = loaded.banks.find((item) => item.bank.topic_id === "math.proportion");
  assert.ok(target);

  const nextBanks = loaded.banks.map((item) => {
    if (item.filePath !== target?.filePath) return item;

    return {
      ...item,
      bank: {
        ...item.bank,
        tasks: item.bank.tasks.map((task, index) =>
          index === 0
            ? {
                ...task,
                skill_id: "math.equations.check_root",
              }
            : task,
        ),
      },
    };
  });

  const result = await validateTaskBankState({
    banks: nextBanks,
    loadErrors: loaded.errors,
  });

  assert.ok(
    result.errors.some((message) => message.includes('skill_id not in') && message.includes("math.equations.check_root")),
  );
});

test("assertValidTaskBankState throws TaskBankValidationError with details", async () => {
  const loaded = await loadTaskBank();
  const target = loaded.banks.find((item) => item.bank.topic_id === "math.proportion");
  assert.ok(target);

  const nextBanks = loaded.banks.map((item) => {
    if (item.filePath !== target?.filePath) return item;

    return {
      ...item,
      bank: {
        ...item.bank,
        tasks: item.bank.tasks.map((task, index) =>
          index === 0
            ? {
                ...task,
                topic_id: "math.equations",
              }
            : task,
        ),
      },
    };
  });

  await assert.rejects(
    () =>
      assertValidTaskBankState({
        banks: nextBanks,
        loadErrors: loaded.errors,
      }),
    (error) =>
      error instanceof TaskBankValidationError &&
      error.details.errors.some((message) => message.includes('task.topic_id "math.equations" must match bank.topic_id "math.proportion"')),
  );
});
