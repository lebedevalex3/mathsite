import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/src/components/ui/Container";
import { HomeProgressCta } from "@/src/components/ui/HomeProgressCta";
import { HomeTopicCatalog } from "@/src/components/ui/HomeTopicCatalog";
import { SurfaceCard } from "@/src/components/ui/SurfaceCard";

type PageProps = {
  params: Promise<{ locale: "ru" | "en" | "de" }>;
};

const copy = {
  ru: {
    heroTitle: "Электронный учебник по математике",
    heroSubtitle:
      "Короткие объяснения, микро-умения и тренировки по 10 задач подряд для устойчивой практики.",
    browseTopics: "Смотреть темы",
    howTitle: "Как это работает",
    howSteps: [
      "Найдите тему в каталоге по домену, уровню и статусу.",
      "Откройте конспект и выберите микро-умение.",
      "Тренируйтесь и возвращайтесь к прогрессу и слабым навыкам.",
    ],
    teacherTitle: "Учительский кабинет (ранний доступ)",
    teacherBody:
      "Шаблоны вариантов, печать, PDF и ранние teacher-инструменты для работы с классом.",
    teacherCta: "Перейти в кабинет",
    sectionsTitle: "Навигация по материалам",
    sectionsBody: "Переходите от темы к навыку и обратно без потери контекста.",
    sectionsLink: "5 класс → Пропорции",
    practiceTitle: "Практика",
    practiceBody: "Формулы в заданиях поддерживают LaTeX, ответы проверяются как числа.",
    practiceLink: "Подробнее о теме и навыках",
  },
  en: {
    heroTitle: "Electronic Math Textbook",
    heroSubtitle:
      "Short explanations, micro-skills, and 10-in-a-row practice sessions for steady learning.",
    browseTopics: "Browse topics",
    howTitle: "How it works",
    howSteps: [
      "Find a topic in the catalog by domain, level, and status.",
      "Open the topic note and choose a micro-skill.",
      "Practice and return to progress and weak skills.",
    ],
    teacherTitle: "Teacher Workspace (Early Access)",
    teacherBody:
      "Variant templates, print/PDF export, and early teacher tools for classroom work.",
    teacherCta: "Open workspace",
    sectionsTitle: "Content navigation",
    sectionsBody: "Move between topics and skills without losing context.",
    sectionsLink: "Grade 5 → Proportions",
    practiceTitle: "Practice",
    practiceBody: "Task statements support LaTeX formulas, answers are checked as numbers.",
    practiceLink: "More about topic and skills",
  },
  de: {
    heroTitle: "Elektronisches Mathematik-Lehrbuch",
    heroSubtitle:
      "Kurze Erklärungen, Mikro-Fähigkeiten und Training mit 10 Aufgaben am Stück.",
    browseTopics: "Themen ansehen",
    howTitle: "So funktioniert es",
    howSteps: [
      "Thema im Katalog nach Bereich, Level und Status finden.",
      "Kurzkonzept öffnen und Mikro-Fähigkeit auswählen.",
      "Trainieren und zum Fortschritt zurückkehren.",
    ],
    teacherTitle: "Lehrkräfte-Bereich (Früher Zugang)",
    teacherBody:
      "Variantenvorlagen, Druck/PDF und frühe Teacher-Tools für den Unterricht.",
    teacherCta: "Bereich öffnen",
    sectionsTitle: "Navigation",
    sectionsBody: "Zwischen Themen und Fähigkeiten wechseln ohne Kontextverlust.",
    sectionsLink: "Klasse 5 → Proportionen",
    practiceTitle: "Training",
    practiceBody: "Aufgaben unterstützen LaTeX-Formeln, Antworten werden als Zahlen geprüft.",
    practiceLink: "Mehr zum Thema und zu Fähigkeiten",
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
        <div className="relative">
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
            <Link
              href="#topics-catalog"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-100"
            >
              {t.browseTopics}
            </Link>
          </div>
        </div>
      </section>

      <SurfaceCard className="p-6">
        <h2 className="text-xl font-semibold tracking-tight text-slate-950">{t.howTitle}</h2>
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

      <HomeTopicCatalog locale={locale} />

      <SurfaceCard className="p-6">
        <h2 className="text-xl font-semibold tracking-tight text-slate-950">{t.teacherTitle}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">{t.teacherBody}</p>
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
          <Link
            href={`/${locale}/teacher`}
            className="inline-flex items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700"
          >
            {t.teacherCta}
          </Link>
        </div>
      </SurfaceCard>

      <section>
        <Container className="px-0">
          <div className="grid gap-4 md:grid-cols-2">
            <SurfaceCard className="p-5">
              <p className="text-sm font-semibold text-slate-900">{t.sectionsTitle}</p>
              <p className="mt-2 text-sm text-slate-600">{t.sectionsBody}</p>
              <div className="mt-4">
                <Link
                  href={`/${locale}/5-klass/proporcii`}
                  className="text-sm font-medium text-blue-700 hover:text-blue-900"
                >
                  {t.sectionsLink}
                </Link>
              </div>
            </SurfaceCard>
            <SurfaceCard className="p-5">
              <p className="text-sm font-semibold text-slate-900">{t.practiceTitle}</p>
              <p className="mt-2 text-sm text-slate-600">{t.practiceBody}</p>
              <div className="mt-4">
                <Link
                  href={`/${locale}/5-klass/proporcii`}
                  className="text-sm font-medium text-blue-700 hover:text-blue-900"
                >
                  {t.practiceLink}
                </Link>
              </div>
            </SurfaceCard>
          </div>
        </Container>
      </section>
    </main>
  );
}

