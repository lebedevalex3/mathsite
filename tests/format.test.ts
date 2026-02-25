import assert from "node:assert/strict";
import test from "node:test";

import {
  formatDate,
  formatDateTime,
  formatNumber,
  formatPercent,
  normalizeLocale,
} from "@/src/lib/i18n/format";

test("normalizeLocale supports ru/en/de and falls back to en", () => {
  assert.equal(normalizeLocale("ru"), "ru");
  assert.equal(normalizeLocale("de-DE"), "de");
  assert.equal(normalizeLocale("en-US"), "en");
  assert.equal(normalizeLocale("fr"), "en");
  assert.equal(normalizeLocale(undefined), "en");
});

test("format helpers return fallback for invalid values", () => {
  assert.equal(formatDate("ru", undefined), "—");
  assert.equal(formatDateTime("ru", "not-a-date"), "—");
  assert.equal(formatNumber("ru", Number.NaN), "—");
  assert.equal(formatPercent("ru", null), "—");
});

test("formatPercent supports ratio and percent inputs", () => {
  const ratioRu = formatPercent("ru", 0.625);
  const ratioEn = formatPercent("en", 0.625);
  const percentileDe = formatPercent("de", 87, { valueKind: "percent" });

  assert.match(ratioRu, /%/);
  assert.match(ratioEn, /%/);
  assert.match(percentileDe, /%/);
  assert.notEqual(ratioRu, "—");
  assert.notEqual(percentileDe, "—");
});

test("formatNumber and formatDate produce non-empty strings", () => {
  assert.ok(formatNumber("de", 12345).length > 0);
  assert.ok(formatDate("en", "2026-02-25T10:30:00.000Z").length > 0);
});

