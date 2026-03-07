import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ButtonLink } from "@/src/components/ui/ButtonLink";
import { SurfaceCard } from "@/src/components/ui/SurfaceCard";
import {
  getSeoTopicWithWorksheets,
  isSupportedSeoLocale,
  type SeoWorksheet,
} from "@/src/lib/seo-materials";

type PageProps = {
  params: Promise<{ locale: string }>;
};

const GRADE_SLUG = "5-klass";
const TOPIC_SLUG = "umnozhenie-obyknovennyh-drobej";

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

function groupWorksheets(worksheets: SeoWorksheet[]) {
  return {
    kartochki: worksheets.filter((worksheet) => worksheet.materialType === "kartochki"),
    samostoyatelnaya: worksheets.filter((worksheet) => worksheet.materialType === "samostoyatelnaya"),
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedSeoLocale(locale)) {
    return {
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const data = await getSeoTopicWithWorksheets(locale, GRADE_SLUG, TOPIC_SLUG);
  if (!data) {
    return {};
  }

  return {
    title: data.topic.seoTitle,
    description: data.topic.seoDescription,
  };
}

export default async function FractionsMultiplicationMaterialsPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isSupportedSeoLocale(locale)) {
    notFound();
  }

  const data = await getSeoTopicWithWorksheets(locale, GRADE_SLUG, TOPIC_SLUG);
  if (!data) {
    notFound();
  }

  const { topic, worksheets } = data;
  const grouped = groupWorksheets(worksheets);

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
          <li className="text-[var(--text)]">Материалы</li>
          <li>/</li>
          <li className="text-[var(--text)]">5 класс</li>
          <li>/</li>
          <li className="font-medium text-[var(--text-strong)]">{topic.title}</li>
        </ol>
      </nav>

      <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] px-6 py-7 shadow-[0_28px_90px_-42px_rgba(11,60,138,0.44)] sm:px-8 sm:py-9">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[var(--border)] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                Готовые материалы
              </span>
              <span className="rounded-full border border-[var(--primary)]/20 bg-[var(--primary-soft)] px-3 py-1 text-xs font-semibold text-[var(--primary)]">
                5 класс
              </span>
              <span className="rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs font-medium text-[var(--text)]">
                {worksheets.length} авторских листов
              </span>
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--text-strong)] sm:text-4xl">
              {topic.h1}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--text-muted)]">
              {topic.intro}
            </p>
          </div>

          <div className="flex min-w-[18rem] flex-col gap-3 rounded-2xl border border-[var(--border)] bg-white p-4">
            <p className="text-sm font-semibold text-[var(--text-strong)]">Что доступно сейчас</p>
            <ul className="space-y-2 text-sm text-[var(--text-muted)]">
              <li>Пятиминутки и карточки для тренировки</li>
              <li>Самостоятельные и контрольный лист</li>
              <li>Переход к отдельному генератору вариантов</li>
            </ul>
            <ButtonLink href={topic.generatorHref} variant="primary" className="min-h-11">
              Открыть варианты
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--text-strong)]">
              Карточки и пятиминутки
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Быстрые листы для старта урока, тренировки алгоритма и короткой проверки темпа.
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {grouped.kartochki.map((worksheet) => (
            <SurfaceCard key={worksheet.id} className="flex h-full flex-col p-5">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text)]">
                  {formatTypeLabel[worksheet.formatType]}
                </span>
                <span className="rounded-full border border-[var(--primary)]/20 bg-[var(--primary-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--primary)]">
                  {difficultyLabel[worksheet.difficultyProfile]}
                </span>
              </div>
              <h3 className="mt-3 text-lg font-semibold tracking-tight text-[var(--text-strong)]">
                {worksheet.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-[var(--text-muted)]">
                {worksheet.shortDescription}
              </p>
              <p className="mt-4 text-xs font-medium uppercase tracking-[0.08em] text-[var(--text-muted)]">
                {worksheet.tasksCount} заданий
                {worksheet.durationMinutes ? ` • ${worksheet.durationMinutes} минут` : ""}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <ButtonLink href={`/${locale}/materialy/${GRADE_SLUG}/${TOPIC_SLUG}/${worksheet.slug}`}>
                  Открыть лист
                </ButtonLink>
              </div>
            </SurfaceCard>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--text-strong)]">
            Самостоятельные и контрольные
          </h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Готовые проверочные листы, которые можно взять как есть или использовать как основу для своей версии.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {grouped.samostoyatelnaya.map((worksheet) => (
            <SurfaceCard key={worksheet.id} className="flex h-full flex-col p-5">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text)]">
                  {formatTypeLabel[worksheet.formatType]}
                </span>
                <span className="rounded-full border border-[var(--primary)]/20 bg-[var(--primary-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--primary)]">
                  {difficultyLabel[worksheet.difficultyProfile]}
                </span>
              </div>
              <h3 className="mt-3 text-lg font-semibold tracking-tight text-[var(--text-strong)]">
                {worksheet.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-[var(--text-muted)]">
                {worksheet.shortDescription}
              </p>
              <p className="mt-4 text-xs font-medium uppercase tracking-[0.08em] text-[var(--text-muted)]">
                {worksheet.tasksCount} заданий
                {worksheet.durationMinutes ? ` • ${worksheet.durationMinutes} минут` : ""}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <ButtonLink href={`/${locale}/materialy/${GRADE_SLUG}/${TOPIC_SLUG}/${worksheet.slug}`}>
                  Открыть лист
                </ButtonLink>
              </div>
            </SurfaceCard>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <SurfaceCard className="p-6">
          <h2 className="text-xl font-semibold text-[var(--text-strong)]">Нужен свой вариант?</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
            Готовые листы здесь работают как витрина по теме. Если нужен другой объем, иной баланс задач или новая комбинация навыков, откройте страницу вариантов и соберите собственный лист.
          </p>
          <div className="mt-4">
            <ButtonLink href={topic.generatorHref} variant="primary">
              Перейти к генератору
            </ButtonLink>
          </div>
        </SurfaceCard>

        <SurfaceCard className="p-6">
          <h2 className="text-xl font-semibold text-[var(--text-strong)]">Частые вопросы</h2>
          <div className="mt-4 space-y-4">
            {topic.faq.map((item) => (
              <div key={item.question}>
                <h3 className="text-sm font-semibold text-[var(--text-strong)]">{item.question}</h3>
                <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">{item.answer}</p>
              </div>
            ))}
          </div>
        </SurfaceCard>
      </section>
    </main>
  );
}
