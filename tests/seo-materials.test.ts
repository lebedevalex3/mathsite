import assert from "node:assert/strict";
import test from "node:test";

import {
  getSeoTopicWithWorksheets,
  getSeoWorksheetBySlug,
  isSupportedSeoLocale,
} from "@/src/lib/seo-materials";

test("SEO materials locale support is limited to ru for now", () => {
  assert.equal(isSupportedSeoLocale("ru"), true);
  assert.equal(isSupportedSeoLocale("en"), false);
});

test("SEO topic for common fractions multiplication loads with ordered worksheets", async () => {
  const data = await getSeoTopicWithWorksheets("ru", "5-klass", "umnozhenie-obyknovennyh-drobej");
  assert.ok(data);
  assert.equal(data.topic.title, "Умножение обыкновенных дробей");
  assert.equal(data.worksheets.length, 6);
  assert.deepEqual(
    data.worksheets.map((worksheet) => worksheet.slug),
    [
      "pyatiminutka-1",
      "kartochki-bazovyj-1",
      "kartochki-srednij-1",
      "samostoyatelnaya-bazovaya-1",
      "domashnyaya-rabota-1",
      "kontrolnaya-1",
    ],
  );
});

test("SEO worksheet lookup resolves worksheet by slug inside topic", async () => {
  const data = await getSeoTopicWithWorksheets("ru", "5-klass", "umnozhenie-obyknovennyh-drobej");
  assert.ok(data);

  const worksheet = await getSeoWorksheetBySlug("ru", data.topic.id, "kontrolnaya-1");
  assert.ok(worksheet);
  assert.equal(worksheet.materialType, "samostoyatelnaya");
  assert.equal(worksheet.formatType, "kontrolnaya");
  assert.equal(worksheet.tasksCount, 6);
});
