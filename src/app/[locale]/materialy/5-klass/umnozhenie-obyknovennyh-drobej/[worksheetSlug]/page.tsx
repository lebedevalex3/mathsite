import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ButtonLink } from "@/src/components/ui/ButtonLink";
import { SurfaceCard } from "@/src/components/ui/SurfaceCard";
import {
  getSeoTopicWithWorksheets,
  getSeoWorksheetBySlug,
  isSupportedSeoLocale,
} from "@/src/lib/seo-materials";
import { MarkdownMath } from "@/lib/ui/MarkdownMath";

type PageProps = {
  params: Promise<{ locale: string; worksheetSlug: string }>;
};

const GRADE_SLUG = "5-klass";
const TOPIC_SLUG = "umnozhenie-obyknovennyh-drobej";

const materialTypeLabel = {
  kartochki: "Карточки",
  samostoyatelnaya: "Самостоятельная",
} as const;

const formatTypeLabel = {
  pyatiminutka: "Пятиминутка",
  trenirovochnaya: "Тренировочная",
  variant: "Самостоятельная",
  domashnyaya: "Домашняя работа",
  kontrolnaya: "Контрольная",
} as const;

const difficultyLabel = {
  bazovyj: "Базовый",
  srednij: "Средний",
  slozhnyj: "Сложный",
  kontrolnyj: "Контрольный",
} as const;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, worksheetSlug } = await params;
  if (!isSupportedSeoLocale(locale)) {
    return {
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const topicData = await getSeoTopicWithWorksheets(locale, GRADE_SLUG, TOPIC_SLUG);
  if (!topicData) {
    return {};
  }

  const worksheet = await getSeoWorksheetBySlug(locale, topicData.topic.id, worksheetSlug);
  if (!worksheet) {
    return {};
  }

  return {
    title: worksheet.seoTitle,
    description: worksheet.seoDescription,
  };
}

export default async function WorksheetSeoPage({ params }: PageProps) {
  const { locale, worksheetSlug } = await params;
  if (!isSupportedSeoLocale(locale)) {
    notFound();
  }

  const topicData = await getSeoTopicWithWorksheets(locale, GRADE_SLUG, TOPIC_SLUG);
  if (!topicData) {
    notFound();
  }

  const { topic, worksheets } = topicData;
  const worksheet = await getSeoWorksheetBySlug(locale, topic.id, worksheetSlug);
  if (!worksheet) {
    notFound();
  }

  const related = worksheets.filter((item) => item.id !== worksheet.id).slice(0, 3);

  return (
    <main className="space-y-8">
      <nav aria-label="Breadcrumbs" className="text-sm text-[var(--text-muted)]">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href={`/${locale}`} className="hover:text-[var(--text-strong)]">
              Главная
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link
              href={`/${locale}/materialy/${GRADE_SLUG}/${TOPIC_SLUG}`}
              className="hover:text-[var(--text-strong)]"
            >
              {topic.title}
            </Link>
          </li>
          <li>/</li>
          <li className="font-medium text-[var(--text-strong)]">{worksheet.title}</li>
        </ol>
      </nav>

      <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] px-6 py-7 shadow-[0_24px_80px_-40px_rgba(11,60,138,0.42)] sm:px-8 sm:py-9">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-[var(--border)] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                {materialTypeLabel[worksheet.materialType]}
              </span>
              <span className="rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs font-medium text-[var(--text)]">
                {formatTypeLabel[worksheet.formatType]}
              </span>
              <span className="rounded-full border border-[var(--primary)]/20 bg-[var(--primary-soft)] px-3 py-1 text-xs font-semibold text-[var(--primary)]">
                {difficultyLabel[worksheet.difficultyProfile]}
              </span>
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--text-strong)] sm:text-4xl">
              {worksheet.h1}
            </h1>
            <p className="mt-4 text-base leading-7 text-[var(--text-muted)]">
              {worksheet.shortDescription}
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-sm text-[var(--text-muted)]">
              <span className="rounded-full border border-[var(--border)] bg-white px-3 py-1">
                5 класс
              </span>
              <span className="rounded-full border border-[var(--border)] bg-white px-3 py-1">
                {worksheet.tasksCount} заданий
              </span>
              {worksheet.durationMinutes ? (
                <span className="rounded-full border border-[var(--border)] bg-white px-3 py-1">
                  {worksheet.durationMinutes} минут
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex min-w-[18rem] flex-col gap-3 rounded-2xl border border-[var(--border)] bg-white p-4">
            {worksheet.pdfHref ? (
              <ButtonLink href={worksheet.pdfHref} variant="primary" className="min-h-11">
                Скачать PDF
              </ButtonLink>
            ) : (
              <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text-muted)]">
                PDF будет добавлен после публикации листа.
              </div>
            )}

            {worksheet.answersPdfHref ? (
              <ButtonLink href={worksheet.answersPdfHref} variant="secondary" className="min-h-11">
                Скачать ответы
              </ButtonLink>
            ) : (
              <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text-muted)]">
                Ответы появятся отдельной ссылкой после публикации PDF.
              </div>
            )}

            <ButtonLink href={topic.generatorHref} variant="secondary" className="min-h-11">
              Открыть варианты
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <SurfaceCard className="p-6">
          <h2 className="text-xl font-semibold text-[var(--text-strong)]">Превью листа</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
            На этой странице показан короткий фрагмент листа. Полный материал можно связать с PDF-файлом и отдельным листом ответов в JSON-реестре.
          </p>
          <div className="mt-5 rounded-2xl border border-[var(--border)] bg-white p-4">
            <ol className="space-y-3 text-sm text-[var(--text)]">
              {worksheet.previewItems.map((item, index) => (
                <li
                  key={`${worksheet.id}-${index + 1}`}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3"
                >
                  <div className="flex items-start gap-3">
                    <span className="pt-0.5 font-semibold text-[var(--text-strong)]">{index + 1}.</span>
                    <MarkdownMath className="prose prose-slate max-w-none text-sm text-[var(--text)]">
                      {item}
                    </MarkdownMath>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </SurfaceCard>

        <SurfaceCard className="p-6">
          <h2 className="text-xl font-semibold text-[var(--text-strong)]">Когда использовать</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{worksheet.teacherNote}</p>
          <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
            <p className="text-sm font-semibold text-[var(--text-strong)]">Связанный маршрут</p>
            <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
              Если нужен похожий лист с другим объемом или уровнем сложности, используйте страницу вариантов по теме умножения дробей.
            </p>
          </div>
        </SurfaceCard>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--text-strong)]">
              Похожие материалы
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Еще несколько готовых листов по той же теме, если нужен другой формат или темп урока.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {related.map((item) => (
            <SurfaceCard key={item.id} className="flex h-full flex-col p-5">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-[var(--border)] bg-white px-2.5 py-1 text-[11px] font-semibold text-[var(--text)]">
                  {formatTypeLabel[item.formatType]}
                </span>
                <span className="rounded-full border border-[var(--primary)]/20 bg-[var(--primary-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--primary)]">
                  {difficultyLabel[item.difficultyProfile]}
                </span>
              </div>
              <h3 className="mt-3 text-lg font-semibold tracking-tight text-[var(--text-strong)]">
                {item.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-[var(--text-muted)]">
                {item.shortDescription}
              </p>
              <div className="mt-4">
                <ButtonLink href={`/${locale}/materialy/${GRADE_SLUG}/${TOPIC_SLUG}/${item.slug}`}>
                  Открыть лист
                </ButtonLink>
              </div>
            </SurfaceCard>
          ))}
        </div>
      </section>
    </main>
  );
}
