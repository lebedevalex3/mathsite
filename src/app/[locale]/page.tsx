import Link from "next/link";
import { notFound } from "next/navigation";

import { HomeTopicCatalog } from "@/src/components/ui/HomeTopicCatalog";
import { TeacherQuickStartWidget } from "@/src/components/ui/TeacherQuickStartWidget";

type PageProps = {
  params: Promise<{ locale: "ru" | "en" | "de" }>;
};

const copy = {
  ru: {
    heroEyebrow: "MathSite • Учителю математики",
    heroTitle: "Соберите вариант к уроку за несколько минут",
    heroSubtitle:
      "Выберите тему, получите структурированный лист заданий, проверьте ответы и отправьте в печать или PDF.",
    heroProofPoint: "Рабочий лист + ответы + PDF за 1-2 минуты",
    heroPrimaryCta: "Собрать вариант",
    heroSecondaryCta: "Открыть темы",
    heroPoints: ["По темам и навыкам", "С ответами", "Готово к печати и PDF"],
    previewLabel: "Пример листа",
    previewTitle: "Вариант по теме «Пропорции»",
    previewMeta: "5 класс • Пропорции",
    previewStatus: "Готов к печати",
    previewChips: ["8 заданий", "Ответы включены", "PDF", "A4"],
    previewReady: "Ответы и печатная версия готовы",
  },
  en: {
    heroEyebrow: "MathSite • For math teachers",
    heroTitle: "Prepare a lesson worksheet in minutes",
    heroSubtitle:
      "Pick a topic, get a structured task sheet, review answers, and export to print or PDF.",
    heroProofPoint: "Worksheet + answer key + PDF in 1-2 minutes",
    heroPrimaryCta: "Build worksheet",
    heroSecondaryCta: "Browse topics",
    heroPoints: ["By topics and skills", "With answers", "Ready for print and PDF"],
    previewLabel: "Worksheet preview",
    previewTitle: "Proportions worksheet",
    previewMeta: "Grade 5 • Proportions",
    previewStatus: "Ready to print",
    previewChips: ["8 tasks", "Answers included", "PDF", "A4"],
    previewReady: "Answer key and printable version are ready",
  },
  de: {
    heroEyebrow: "MathSite • Fuer Mathelehrkraefte",
    heroTitle: "Arbeitsblatt fuer den Unterricht in wenigen Minuten",
    heroSubtitle:
      "Thema waehlen, strukturiertes Aufgabenblatt erhalten, Loesungen pruefen und als Druck/PDF ausgeben.",
    heroProofPoint: "Arbeitsblatt + Loesungen + PDF in 1-2 Minuten",
    heroPrimaryCta: "Arbeitsblatt erstellen",
    heroSecondaryCta: "Themen ansehen",
    heroPoints: ["Nach Themen und Faehigkeiten", "Mit Loesungen", "Fertig fuer Druck und PDF"],
    previewLabel: "Blattvorschau",
    previewTitle: "Arbeitsblatt: Proportionen",
    previewMeta: "Klasse 5 • Proportionen",
    previewStatus: "Druckbereit",
    previewChips: ["8 Aufgaben", "Mit Loesungen", "PDF", "A4"],
    previewReady: "Loesungsschluessel und Druckversion sind bereit",
  },
} as const;

export default async function LocaleHomePage({ params }: PageProps) {
  const { locale } = await params;
  if (!(locale in copy)) {
    notFound();
  }
  const t = copy[locale];

  return (
    <main className="space-y-7 sm:space-y-9">
      <section className="relative isolate overflow-hidden rounded-[2rem] border border-[var(--border)] bg-white px-6 py-7 shadow-[0_38px_100px_-44px_rgba(11,60,138,0.46)] sm:px-10 sm:py-11">
        <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-r from-[var(--primary-soft)]/90 via-[var(--surface-tint)] to-[var(--accent-soft)]/90" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_300px_at_16%_0%,rgba(29,78,216,0.07),transparent_65%)]" />
        <div className="absolute -right-16 top-10 h-44 w-44 rounded-full bg-[var(--surface)]/80 blur-3xl" />
        <div className="relative grid gap-9 lg:grid-cols-[minmax(0,1.03fr)_minmax(0,0.97fr)] lg:items-center">
          <div>
            <p className="mb-4 inline-flex rounded-full border border-[var(--border)] bg-[var(--surface)]/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
              {t.heroEyebrow}
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold leading-[1.04] tracking-tight text-[var(--text-strong)] sm:text-5xl">
              {t.heroTitle}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--text-muted)] sm:text-lg">
              {t.heroSubtitle}
            </p>
            <p className="mt-4 inline-flex rounded-lg border border-[var(--primary)]/25 bg-[var(--primary-soft)]/70 px-3 py-1.5 text-sm font-semibold text-[var(--primary)]">
              {t.heroProofPoint}
            </p>

            <ul className="mt-6 space-y-2.5">
              {t.heroPoints.map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm font-medium text-[var(--text)]">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[var(--primary)]/35 bg-[var(--primary-soft)] text-[11px] text-[var(--primary)]">
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href={`/${locale}/teacher/variants`}
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--primary)] bg-[var(--primary)] px-6 py-3.5 text-base font-semibold text-white shadow-[0_24px_42px_-22px_rgba(11,60,138,0.62)] transition-all hover:-translate-y-0.5 hover:bg-[var(--primary-hover)]"
              >
                {t.heroPrimaryCta}
              </Link>
              <Link
                href={`/${locale}#topics-catalog`}
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-3 text-sm font-medium text-[var(--text)] transition-colors hover:bg-[var(--surface-soft)] hover:text-[var(--text-strong)]"
              >
                {t.heroSecondaryCta}
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[27rem]">
            <div className="absolute inset-0 rounded-[1.65rem] border border-[var(--border)]/75 bg-[var(--surface-soft)] [background-size:28px_28px] [background-image:linear-gradient(to_right,rgba(100,116,139,0.24)_1px,transparent_1px),linear-gradient(to_bottom,rgba(100,116,139,0.24)_1px,transparent_1px)] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]" />
            <div className="relative m-4 rounded-2xl border border-[var(--border)] bg-white p-4 shadow-[0_26px_56px_-28px_rgba(11,60,138,0.42)] sm:m-6 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                  {t.previewLabel}
                </span>
                <span className="inline-flex items-center rounded-full border border-[var(--primary)]/30 bg-[var(--primary-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--primary)]">
                  {t.previewStatus}
                </span>
              </div>
              <h3 className="mt-2 text-base font-semibold text-[var(--text-strong)]">{t.previewTitle}</h3>
              <p className="mt-1 text-xs text-[var(--text-muted)]">{t.previewMeta}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {t.previewChips.map((chip) => (
                  <span key={chip} className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-[11px] font-medium text-[var(--text)]">
                    {chip}
                  </span>
                ))}
              </div>
              <div className="mt-4 space-y-2.5 rounded-xl border border-[var(--border)]/70 bg-[var(--surface)] px-3 py-3">
                <p className="text-xs text-[var(--text)]">1) 6 : 9 = 2 : x</p>
                <p className="text-xs text-[var(--text)]">2) 14 / y = 7 / 9</p>
                <p className="text-xs text-[var(--text)]">3) 3x = 5x - 8</p>
              </div>
              <p className="mt-3 text-xs font-medium text-[var(--text-muted)]">{t.previewReady}</p>
            </div>
          </div>
        </div>
      </section>

      <TeacherQuickStartWidget locale={locale} />

      <HomeTopicCatalog locale={locale} />
    </main>
  );
}
