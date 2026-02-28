import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/src/components/ui/Container";
import { HomeContinueSkillCard } from "@/src/components/ui/HomeContinueSkillCard";
import { HomeMotivationPanel } from "@/src/components/ui/HomeMotivationPanel";
import { HomeTopicCatalog } from "@/src/components/ui/HomeTopicCatalog";
import { SurfaceCard } from "@/src/components/ui/SurfaceCard";
import { TeacherQuickStartWidget } from "@/src/components/ui/TeacherQuickStartWidget";

type PageProps = {
  params: Promise<{ locale: "ru" | "en" | "de" }>;
};

const copy = {
  ru: {
    heroTitle: "Учебник, тренажёр и варианты по математике",
    heroSubtitle: "Выберите сценарий и начните за 1 минуту.",
    studentLabel: "Ученик",
    studentCta: "Я ученик",
    studentHint: "Открой тему и начни практику.",
    teacherLabel: "Учитель",
    teacherHeroCta: "Я учитель",
    teacherHint: "Собери вариант и перейди в кабинет.",
    browseTopics: "Смотреть темы",
    howTitle: "Как это работает",
    howSteps: [
      "Выберите тему для урока или самостоятельной практики.",
      "Соберите вариант для печати и откройте ответы.",
      "Тренируйтесь в тренажёре и отслеживайте прогресс по навыкам.",
    ],
    teacherTitle: "Учителю / репетитору",
    teacherBody:
      "Конструктор вариантов встроен в учебник: собирайте варианты по теме и быстро получайте печать и ответы.",
    teacherCta: "Перейти в конструктор вариантов",
    teacherBullets: [
      "Варианты по теме без повторов",
      "Ключ ответов",
      "Печать / PDF",
      "Сборка по навыкам темы",
    ],
    studentTitle: "Ученику",
    studentBody: "Откройте тренажёр или продолжите практику по теме «Пропорции».",
    studentProgressLink: "Открыть прогресс",
    sectionsTitle: "Навигация по материалам",
    sectionsBody: "Переходите от темы к навыку и обратно без потери контекста.",
    sectionsLink: "5 класс → Пропорции",
    practiceTitle: "Практика",
    practiceBody: "Формулы в заданиях поддерживают LaTeX, ответы проверяются как числа.",
    practiceLink: "Подробнее о теме и навыках",
  },
  en: {
    heroTitle: "Textbook, Trainer, and Worksheets for Math",
    heroSubtitle: "Choose your path and start in one minute.",
    studentLabel: "Student",
    studentCta: "I am a student",
    studentHint: "Open a topic and start practicing.",
    teacherLabel: "Teacher",
    teacherHeroCta: "I am a teacher",
    teacherHint: "Build a worksheet and open teacher tools.",
    browseTopics: "Browse topics",
    howTitle: "How it works",
    howSteps: [
      "Choose a topic for classwork or self-study.",
      "Assemble a printable variant and open the answer key.",
      "Practice in the trainer and track progress by skills.",
    ],
    teacherTitle: "For teachers / tutors",
    teacherBody:
      "The variant builder is part of the textbook workflow: assemble topic-based variants and get print + answers quickly.",
    teacherCta: "Open variant builder",
    teacherBullets: [
      "Topic-based variants without repeats",
      "Answer key",
      "Print / PDF",
      "Skill-based assembly",
    ],
    studentTitle: "For students",
    studentBody: "Open the trainer or continue practice in the Proportions topic.",
    studentProgressLink: "Open progress",
    sectionsTitle: "Content navigation",
    sectionsBody: "Move between topics and skills without losing context.",
    sectionsLink: "Grade 5 → Proportions",
    practiceTitle: "Practice",
    practiceBody: "Task statements support LaTeX formulas, answers are checked as numbers.",
    practiceLink: "More about topic and skills",
  },
  de: {
    heroTitle: "Lehrbuch, Trainer und Arbeitsblätter für Mathematik",
    heroSubtitle: "Wählen Sie Ihren Weg und starten Sie in einer Minute.",
    studentLabel: "Schüler/in",
    studentCta: "Ich bin Schüler/in",
    studentHint: "Thema öffnen und direkt üben.",
    teacherLabel: "Lehrkraft",
    teacherHeroCta: "Ich bin Lehrkraft",
    teacherHint: "Arbeitsblatt erstellen und Teacher-Tools öffnen.",
    browseTopics: "Themen ansehen",
    howTitle: "So funktioniert es",
    howSteps: [
      "Thema für Unterricht oder Selbstlernen auswählen.",
      "Druckbare Variante zusammenstellen und Lösungen öffnen.",
      "Im Trainer üben und Fortschritt nach Fähigkeiten verfolgen.",
    ],
    teacherTitle: "Für Lehrkräfte / Nachhilfe",
    teacherBody:
      "Der Varianten-Baukasten ist im Lehrbuch integriert: thematische Varianten mit Druck und Lösungen schnell zusammenstellen.",
    teacherCta: "Zum Varianten-Baukasten",
    teacherBullets: [
      "Varianten ohne Wiederholungen",
      "Lösungsschlüssel",
      "Druck / PDF",
      "Zusammenstellung nach Fähigkeiten",
    ],
    studentTitle: "Für Schüler:innen",
    studentBody: "Trainer öffnen oder die Praxis im Thema Proportionen fortsetzen.",
    studentProgressLink: "Fortschritt öffnen",
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
      <section className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_20px_45px_-30px_rgba(11,60,138,0.45)] sm:p-10">
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-r from-[var(--primary-soft)] via-[var(--surface-tint)] to-[var(--accent-soft)]" />
        <div className="relative">
          <p className="mb-3 inline-flex rounded-full border border-[var(--border)] bg-[var(--info)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--info-foreground)]">
            MVP • textbook + trainer + teacher tools
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-strong)] sm:text-5xl">
            {t.heroTitle}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--text-muted)] sm:text-lg">
            {t.heroSubtitle}
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/95 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                {t.studentLabel}
              </p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">{t.studentHint}</p>
              <div className="mt-3">
                <Link
                  href={`/${locale}#topics-catalog`}
                  className="inline-flex items-center justify-center rounded-lg border border-[var(--primary)] bg-[var(--primary)] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--primary-hover)]"
                >
                  {t.studentCta}
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-tint)] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                {t.teacherLabel}
              </p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">{t.teacherHint}</p>
              <div className="mt-3">
                <Link
                  href={`/${locale}/teacher/variants`}
                  className="inline-flex items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--primary)] transition-colors hover:bg-[var(--surface-soft)]"
                >
                  {t.teacherHeroCta}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <HomeContinueSkillCard locale={locale} />

      <TeacherQuickStartWidget locale={locale} />

      <SurfaceCard className="p-6">
        <h2 className="text-xl font-semibold tracking-tight text-[var(--text-strong)]">{t.howTitle}</h2>
        <ol className="mt-4 space-y-3">
          {t.howSteps.map((step, index) => (
            <li
              key={step}
              className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3"
            >
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-semibold text-white">
                {index + 1}
              </span>
              <span className="pt-0.5 text-sm leading-6 text-[var(--text)]">{step}</span>
            </li>
          ))}
        </ol>
      </SurfaceCard>

      <SurfaceCard className="p-6">
        <h2 className="text-xl font-semibold tracking-tight text-[var(--text-strong)]">{t.teacherTitle}</h2>
        <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">{t.teacherBody}</p>
        <ul className="mt-4 space-y-2 text-sm text-[var(--text)]">
          {t.teacherBullets.map((item) => (
            <li key={item} className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2">
              {item}
            </li>
          ))}
        </ul>
        <div className="mt-5">
          <Link
            href={`/${locale}/teacher-tools`}
            className="inline-flex items-center justify-center rounded-lg border border-[var(--primary)] bg-[var(--primary)] px-3 py-2 text-sm font-medium text-[var(--primary-foreground)] transition-colors hover:bg-[var(--primary-hover)]"
          >
            {t.teacherCta}
          </Link>
        </div>
      </SurfaceCard>

      <HomeTopicCatalog locale={locale} />

      <HomeMotivationPanel locale={locale} />

      <section>
        <Container className="px-0">
          <div className="grid gap-4 md:grid-cols-2">
            <SurfaceCard className="p-5">
              <p className="text-sm font-semibold text-[var(--text-strong)]">{t.sectionsTitle}</p>
              <p className="mt-2 text-sm text-[var(--text-muted)]">{t.sectionsBody}</p>
              <div className="mt-4">
                <Link
                  href={`/${locale}/topics/proporcii`}
                  className="text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-hover)]"
                >
                  {t.sectionsLink}
                </Link>
              </div>
            </SurfaceCard>
            <SurfaceCard className="p-5">
              <p className="text-sm font-semibold text-[var(--text-strong)]">{t.practiceTitle}</p>
              <p className="mt-2 text-sm text-[var(--text-muted)]">{t.practiceBody}</p>
              <div className="mt-4">
                <Link
                  href={`/${locale}/topics/proporcii`}
                  className="text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-hover)]"
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
