import Link from "next/link";

import { SurfaceCard } from "@/src/components/ui/SurfaceCard";

type PageProps = {
  params: Promise<{ locale: "ru" | "en" | "de" }>;
};

const copy = {
  ru: {
    title: "Учительский кабинет (ранний доступ)",
    subtitle:
      "Ранний доступ к teacher-инструментам: шаблоны вариантов, печать и PDF по теме «Пропорции».",
    featuresTitle: "Что доступно сейчас",
    features: [
      "Шаблоны вариантов (training10 / control20 / control30)",
      "Генерация вариантов из банка задач с сохранением в Postgres",
      "Печатные страницы и экспорт PDF (или fallback print-to-PDF)",
    ],
    openCabinet: "Открыть кабинет",
    openWaitlist: "Страница для учителей",
    note: "Если у вас нет роли teacher/admin, будет показан текущий экран доступа (MVP gating).",
  },
  en: {
    title: "Teacher Workspace (Early Access)",
    subtitle:
      "Early access to teacher tools: variant templates, print pages, and PDF for the Proportions topic.",
    featuresTitle: "Available now",
    features: [
      "Variant templates (training10 / control20 / control30)",
      "Generation from the task bank with Postgres persistence",
      "Printable pages and PDF export (or print-to-PDF fallback)",
    ],
    openCabinet: "Open workspace",
    openWaitlist: "Teachers page",
    note: "If you do not have teacher/admin role, the current MVP access screen will be shown.",
  },
  de: {
    title: "Lehrkräfte-Bereich (Früher Zugang)",
    subtitle:
      "Früher Zugang zu Teacher-Tools: Variantenvorlagen, Druckseiten und PDF zum Thema Proportionen.",
    featuresTitle: "Aktuell verfügbar",
    features: [
      "Variantenvorlagen (training10 / control20 / control30)",
      "Generierung aus der Aufgabenbank mit Speicherung in Postgres",
      "Druckseiten und PDF-Export (oder Print-to-PDF Fallback)",
    ],
    openCabinet: "Bereich öffnen",
    openWaitlist: "Lehrkräfte-Seite",
    note: "Ohne teacher/admin-Rolle sehen Sie den aktuellen MVP-Zugriffsbildschirm.",
  },
} as const;

export default async function TeacherLandingPage({ params }: PageProps) {
  const { locale } = await params;
  const t = copy[locale] ?? copy.en;

  return (
    <main className="space-y-6">
      <nav aria-label="Breadcrumbs" className="text-sm text-slate-600">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href={`/${locale}`} className="hover:text-slate-950">
              {locale === "ru" ? "Главная" : locale === "de" ? "Start" : "Home"}
            </Link>
          </li>
          <li>/</li>
          <li className="font-medium text-slate-950">{t.title}</li>
        </ol>
      </nav>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">
          Early access
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{t.title}</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">{t.subtitle}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href={`/${locale}/teacher/cabinet`}
            className="inline-flex items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            {t.openCabinet}
          </Link>
          <Link
            href={`/${locale}/teachers`}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
          >
            {t.openWaitlist}
          </Link>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <SurfaceCard className="p-6">
          <h2 className="text-lg font-semibold text-slate-950">{t.featuresTitle}</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
            {t.features.map((item) => (
              <li key={item} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                {item}
              </li>
            ))}
          </ul>
        </SurfaceCard>

        <SurfaceCard className="p-6">
          <h2 className="text-lg font-semibold text-slate-950">
            {locale === "ru" ? "Важно" : locale === "de" ? "Hinweis" : "Note"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{t.note}</p>
          <div className="mt-4">
            <Link
              href={`/${locale}/teacher/cabinet`}
              className="text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-hover)]"
            >
              /{locale}/teacher/cabinet
            </Link>
          </div>
        </SurfaceCard>
      </section>
    </main>
  );
}
