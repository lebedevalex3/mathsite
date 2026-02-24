import assert from "node:assert/strict";
import test from "node:test";

import { clearTaskBankCache, loadTaskBank } from "@/lib/taskbank";

test("loadTaskBank memoizes parsed task bank by default", async () => {
  const prev = process.env.TASKBANK_NO_CACHE;
  delete process.env.TASKBANK_NO_CACHE;
  clearTaskBankCache();

  try {
    const a = await loadTaskBank();
    const b = await loadTaskBank();

    assert.strictEqual(a, b);
    assert.strictEqual(a.banks, b.banks);
    assert.strictEqual(a.errors, b.errors);
  } finally {
    clearTaskBankCache();
    if (prev === undefined) {
      delete process.env.TASKBANK_NO_CACHE;
    } else {
      process.env.TASKBANK_NO_CACHE = prev;
    }
  }
});

test("TASKBANK_NO_CACHE=1 bypasses in-memory cache", async () => {
  const prev = process.env.TASKBANK_NO_CACHE;
  process.env.TASKBANK_NO_CACHE = "1";
  clearTaskBankCache();

  try {
    const a = await loadTaskBank();
    const b = await loadTaskBank();

    assert.notStrictEqual(a, b);
  } finally {
    clearTaskBankCache();
    if (prev === undefined) {
      delete process.env.TASKBANK_NO_CACHE;
    } else {
      process.env.TASKBANK_NO_CACHE = prev;
    }
  }
});

