import { promises as fs } from "node:fs";
import path from "node:path";

import { z } from "zod";

const SEO_CONTENT_ROOT = path.join(process.cwd(), "content", "seo");

const faqItemSchema = z.object({
  question: z.string().trim().min(1),
  answer: z.string().trim().min(1),
});

const seoTopicSchema = z.object({
  id: z.string().trim().min(1),
  locale: z.literal("ru"),
  grade: z.number().int().positive(),
  gradeSlug: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  title: z.string().trim().min(1),
  seoTitle: z.string().trim().min(1),
  seoDescription: z.string().trim().min(1),
  h1: z.string().trim().min(1),
  intro: z.string().trim().min(1),
  generatorHref: z.string().trim().min(1),
  materialIds: z.array(z.string().trim().min(1)).min(1),
  faq: z.array(faqItemSchema).min(1),
});

const seoWorksheetSchema = z.object({
  id: z.string().trim().min(1),
  locale: z.literal("ru"),
  topicId: z.string().trim().min(1),
  grade: z.number().int().positive(),
  slug: z.string().trim().min(1),
  sortOrder: z.number().int().nonnegative(),
  materialType: z.enum(["kartochki", "samostoyatelnaya"]),
  formatType: z.enum(["pyatiminutka", "trenirovochnaya", "variant", "domashnyaya", "kontrolnaya"]),
  difficultyProfile: z.enum(["bazovyj", "srednij", "slozhnyj", "kontrolnyj"]),
  title: z.string().trim().min(1),
  seoTitle: z.string().trim().min(1),
  seoDescription: z.string().trim().min(1),
  h1: z.string().trim().min(1),
  shortDescription: z.string().trim().min(1),
  teacherNote: z.string().trim().min(1),
  tasksCount: z.number().int().positive(),
  durationMinutes: z.number().int().positive().optional(),
  previewItems: z.array(z.string().trim().min(1)).min(1),
  pdfHref: z.string().trim().min(1).optional(),
  answersPdfHref: z.string().trim().min(1).optional(),
  vkPostUrl: z.string().trim().url().optional(),
  published: z.boolean(),
});

export type SeoTopic = z.infer<typeof seoTopicSchema>;
export type SeoWorksheet = z.infer<typeof seoWorksheetSchema>;
export type SeoLocale = "ru";

async function readJsonFiles<T>(dirPath: string, schema: z.ZodSchema<T>) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => path.join(dirPath, entry.name))
    .sort();

  const records = await Promise.all(
    files.map(async (filePath) => {
      const raw = await fs.readFile(filePath, "utf8");
      const parsed = JSON.parse(raw) as unknown;
      return schema.parse(parsed);
    }),
  );

  return records;
}

async function loadTopics(locale: SeoLocale) {
  return readJsonFiles(
    path.join(SEO_CONTENT_ROOT, "topics", locale),
    seoTopicSchema,
  );
}

async function loadWorksheets(locale: SeoLocale) {
  return readJsonFiles(
    path.join(SEO_CONTENT_ROOT, "worksheets", locale),
    seoWorksheetSchema,
  );
}

export function isSupportedSeoLocale(locale: string): locale is SeoLocale {
  return locale === "ru";
}

export async function getSeoTopicBySlug(
  locale: SeoLocale,
  gradeSlug: string,
  topicSlug: string,
) {
  const topics = await loadTopics(locale);
  return topics.find((topic) => topic.gradeSlug === gradeSlug && topic.slug === topicSlug) ?? null;
}

export async function listSeoWorksheetsForTopic(locale: SeoLocale, topicId: string) {
  const worksheets = await loadWorksheets(locale);
  return worksheets
    .filter((worksheet) => worksheet.topicId === topicId && worksheet.published)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, "ru"));
}

export async function getSeoWorksheetBySlug(
  locale: SeoLocale,
  topicId: string,
  worksheetSlug: string,
) {
  const worksheets = await listSeoWorksheetsForTopic(locale, topicId);
  return worksheets.find((worksheet) => worksheet.slug === worksheetSlug) ?? null;
}

export async function getSeoTopicWithWorksheets(
  locale: SeoLocale,
  gradeSlug: string,
  topicSlug: string,
) {
  const topic = await getSeoTopicBySlug(locale, gradeSlug, topicSlug);
  if (!topic) return null;

  const worksheets = await listSeoWorksheetsForTopic(locale, topic.id);
  const worksheetById = new Map(worksheets.map((worksheet) => [worksheet.id, worksheet] as const));
  const orderedWorksheets = topic.materialIds
    .map((materialId) => worksheetById.get(materialId))
    .filter((worksheet): worksheet is SeoWorksheet => Boolean(worksheet));

  return {
    topic,
    worksheets: orderedWorksheets,
  };
}
