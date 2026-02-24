import Link from "next/link";
import { notFound } from "next/navigation";

import { ButtonLink } from "@/src/components/ui/ButtonLink";
import { Container } from "@/src/components/ui/Container";
import { HomeProgressCta } from "@/src/components/ui/HomeProgressCta";
import { SurfaceCard } from "@/src/components/ui/SurfaceCard";

type PageProps = {
  params: Promise<{ locale: "ru" | "en" | "de" }>;
};

const copy = {
  ru: {
    heroTitle: "Электронный учебник по математике",
    heroSubtitle:
      "Короткие объяснения, микро-умения и тренировки по 10 задач подряд для устойчивой практики.",
    gradeTitle: "5 класс",
    featured: "Пропорции",
    howTitle: "Как это работает",
    howSteps: [
      "Открой тему и прочитай короткий конспект.",
      "Выбери микро-умение для тренировки.",
      "Реши 10 задач подряд и посмотри результат.",
    ],
    teachersTitle: "Для учителей",
    teachersBody:
      "Ранний доступ к материалам для класса: контрольные, PDF-печать и банк задач по темам.",
  },
  en: {
    heroTitle: "Electronic Math Textbook",
    heroSubtitle:
      "Short explanations, micro-skills, and 10-in-a-row practice sessions for steady learning.",
    gradeTitle: "Grade 5",
    featured: "Proportions",
    howTitle: "How it works",
    howSteps: [
      "Open a topic and read a short note.",
      "Choose a micro-skill to practice.",
      "Solve 10 tasks in a row and review the result.",
    ],
    teachersTitle: "For teachers",
    teachersBody:
      "Early access to classroom materials: worksheets, printable PDFs, and a Grade 5 task bank.",
  },
  de: {
    heroTitle: "Elektronisches Mathematik-Lehrbuch",
    heroSubtitle:
      "Kurze Erklärungen, Mikro-Fähigkeiten und Training mit 10 Aufgaben am Stück.",
    gradeTitle: "Klasse 5",
    featured: "Proportionen",
    howTitle: "So funktioniert es",
    howSteps: [
      "Thema öffnen und Kurzüberblick lesen.",
      "Mikro-Fähigkeit zum Üben wählen.",
      "10 Aufgaben lösen und Ergebnis ansehen.",
    ],
    teachersTitle: "Für Lehrkräfte",
    teachersBody:
      "Früher Zugang zu Materialien: Vorlagen, PDF-Druck und Aufgabenbank für Klasse 5.",
  },
} as const;

export default async function LocaleHomePage({ params }: PageProps) {
  const { locale } = await params;
  if (!(locale in copy)) {
    notFound();
  }
  const t = copy[locale];

  return (
    <main className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-blue-100 via-cyan-50 to-emerald-100" />
        <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="mb-3 inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
              MVP • docs + trainer
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-5xl">
              {t.heroTitle}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              {t.heroSubtitle}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <HomeProgressCta locale={locale} />
              <ButtonLink href={`/${locale}/5-klass/proporcii`} variant="secondary">
                Открыть тему «Пропорции»
              </ButtonLink>
            </div>
          </div>

          <SurfaceCard className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t.gradeTitle}
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
              {t.featured}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Микро-умения, формулы и тренировки по навыкам с локальным сохранением попыток.
            </p>
            <div className="mt-4">
              <Link
                href={`/${locale}/5-klass/proporcii`}
                className="text-sm font-medium text-blue-700 hover:text-blue-900"
              >
                Читать тему
              </Link>
            </div>
          </SurfaceCard>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <SurfaceCard className="p-6">
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">
            {t.howTitle}
          </h2>
          <ol className="mt-4 space-y-3">
            {t.howSteps.map((step, index) => (
              <li
                key={step}
                className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3"
              >
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <span className="pt-0.5 text-sm leading-6 text-slate-700">{step}</span>
              </li>
            ))}
          </ol>
        </SurfaceCard>

        <SurfaceCard className="p-6">
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">
            {t.teachersTitle}
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">{t.teachersBody}</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            <li className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              Шаблоны контрольных по микро-умениям
            </li>
            <li className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              Печать PDF + ключ ответов
            </li>
            <li className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              Банк задач по темам 5 класса
            </li>
          </ul>
          <div className="mt-5">
            <ButtonLink href={`/${locale}/teachers`} variant="primary">
              Получить ранний доступ
            </ButtonLink>
          </div>
        </SurfaceCard>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            Темы 5 класса
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Доступные темы для чтения и тренировки. Новые темы будут добавляться постепенно.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SurfaceCard className="flex h-full flex-col p-5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-slate-950">Пропорции</h3>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                Готово
              </span>
            </div>
            <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
              Конспект, микро-умения и тренажёр «10 задач подряд» по ключевым операциям.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <ButtonLink href={`/${locale}/5-klass/proporcii`} variant="secondary">
                Читать
              </ButtonLink>
              <Link
                href={`/${locale}/5-klass/proporcii/trainer`}
                className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium text-blue-700 hover:bg-slate-100 hover:text-blue-900"
              >
                Тренировать
              </Link>
            </div>
          </SurfaceCard>

          {[
            {
              title: "Дроби",
              description: "Сравнение, сокращение и действия с дробями.",
            },
            {
              title: "Уравнения",
              description: "Простейшие линейные уравнения и проверка решения.",
            },
            {
              title: "Проценты",
              description: "Нахождение процента от числа и обратные задачи.",
            },
          ].map((topic) => (
            <SurfaceCard
              key={topic.title}
              className="flex h-full flex-col border-dashed border-slate-300 bg-slate-50 p-5"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-slate-900">{topic.title}</h3>
                <span className="rounded-full border border-slate-300 bg-white px-2 py-0.5 text-xs font-semibold text-slate-500">
                  Скоро
                </span>
              </div>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
                {topic.description}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex cursor-not-allowed items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-400">
                  Читать
                </span>
                <span className="inline-flex cursor-not-allowed items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-400">
                  Тренировать
                </span>
              </div>
            </SurfaceCard>
          ))}
        </div>
      </section>

      <section>
        <Container className="px-0">
          <div className="grid gap-4 md:grid-cols-2">
            <SurfaceCard className="p-5">
              <p className="text-sm font-semibold text-slate-900">Разделы</p>
              <p className="mt-2 text-sm text-slate-600">
                Переходите от темы к навыку и обратно без потери контекста.
              </p>
              <div className="mt-4">
                <Link
                  href={`/${locale}/5-klass/proporcii`}
                  className="text-sm font-medium text-blue-700 hover:text-blue-900"
                >
                  5 класс → Пропорции
                </Link>
              </div>
            </SurfaceCard>
            <SurfaceCard className="p-5">
              <p className="text-sm font-semibold text-slate-900">Практика</p>
              <p className="mt-2 text-sm text-slate-600">
                Формулы в заданиях поддерживают LaTeX, ответы проверяются как числа.
              </p>
              <div className="mt-4">
                <Link
                  href={`/${locale}/5-klass/proporcii`}
                  className="text-sm font-medium text-blue-700 hover:text-blue-900"
                >
                  Подробнее о теме и навыках
                </Link>
              </div>
            </SurfaceCard>
          </div>
        </Container>
      </section>
    </main>
  );
}
