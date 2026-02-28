import assert from "node:assert/strict";
import test from "node:test";

import { resolveHtmlLang } from "@/src/lib/i18n/html-lang";

test("resolveHtmlLang maps supported locales", () => {
  assert.equal(resolveHtmlLang("ru"), "ru");
  assert.equal(resolveHtmlLang("en"), "en");
  assert.equal(resolveHtmlLang("de"), "de");
});

test("resolveHtmlLang falls back to ru for unsupported or missing values", () => {
  assert.equal(resolveHtmlLang(null), "ru");
  assert.equal(resolveHtmlLang(""), "ru");
  assert.equal(resolveHtmlLang("fr"), "ru");
});
