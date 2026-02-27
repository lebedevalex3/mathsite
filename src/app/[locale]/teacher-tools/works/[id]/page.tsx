import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { SurfaceCard } from "@/src/components/ui/SurfaceCard";
import { WorkBuildSettingsControls } from "@/src/components/ui/WorkBuildSettingsControls";
import { WorkTypeAutosaveField } from "@/src/components/ui/WorkTypeAutosaveField";
import { WorkPlacementAutosaveControls } from "@/src/components/ui/WorkPlacementAutosaveControls";
import { WorkStatusBadge } from "@/src/components/ui/WorkStatusBadge";
import { selectWorkPdfEngine } from "@/src/lib/pdf-engines/select-engine";
import { formatDateTime, formatNumber } from "@/src/lib/i18n/format";
import { getOrCreateVisitorUser } from "@/src/lib/session/visitor";
import { isTwoUpLayout, parsePrintLayout } from "@/src/lib/variants/print-layout";
import {
  defaultOrientationForLayout,
  normalizePrintProfile,
  type PrintOrientation,
} from "@/src/lib/variants/print-profile";
import { getWorkDetailForOwner } from "@/src/lib/variants/repository";

type PageProps = {
  params: Promise<{ locale: "ru" | "en" | "de"; id: string }>;
  searchParams: Promise<{ layout?: string; orientation?: string; force?: string; doc?: string }>;
};

function parseWorkType(value: string) {
  return value as "lesson" | "quiz" | "homework" | "test";
}

function parseGenerationSettings(value: unknown) {
  if (!value || typeof value !== "object") {
    return { variantsCount: null as number | null, shuffleOrder: null as boolean | null };
  }
  const raw = (value as { generation?: unknown }).generation;
  if (!raw || typeof raw !== "object") {
    return { variantsCount: null as number | null, shuffleOrder: null as boolean | null };
  }
  const generation = raw as { variantsCount?: unknown; shuffleOrder?: unknown };
  return {
    variantsCount:
      typeof generation.variantsCount === "number" && Number.isFinite(generation.variantsCount)
        ? Math.max(1, Math.trunc(generation.variantsCount))
        : null,
    shuffleOrder:
      typeof generation.shuffleOrder === "boolean" ? generation.shuffleOrder : null,
  };
}

const copy = {
  ru: {
    eyebrow: "Работа",
    back: "← К конструктору",
    titleSuffix: "Собранная работа",
    workSubtitleVariantsUnit: "вариантов",
    workSubtitleTasksUnit: "задач",
    variantLabel: "Вариант",
    variantTasksUnit: "задач",
    workType: "Тип работы",
    buildSettings: "Параметры сборки",
    buildVariants: "Количество вариантов",
    buildShuffle: "Перемешать порядок задач",
    yes: "Да",
    no: "Нет",
    layout: "Оформление",
    placement: "Размещение",
    printMode: "Что печатать",
    printModeStudent: "Задания",
    printModeAnswers: "Ответы",
    single: "1 вариант/стр",
    two: "2 варианта/стр (альбомная)",
    twoDup: "Вариант 1 | Вариант 1",
    twoCut: "2 варианта/стр (для разрезания)",
    autosaveSaving: "Сохраняю...",
    autosaveSaved: "Сохранено",
    autosaveError: "Ошибка сохранения",
    autosaveRetry: "Повторить",
    forceTwo: "Всё равно попробовать (force)",
    variants: "Варианты",
    open: "Открыть",
    print: "Печать",
    answers: "Ответы",
    pdf: "PDF",
    answersPdf: "Ответы PDF",
    pdfEngine: "PDF движок",
    pdfAllLabel: "Варианты",
    pdfAnswersLabel: "Ответы",
    engineChromium: "Chromium",
    engineLatex: "LaTeX",
    batchPrint: "Печать всех",
    batchPdf: "PDF всех",
    workTypes: {
      lesson: "Работа на уроке",
      quiz: "Самостоятельная",
      homework: "Домашняя работа",
      test: "Контрольная",
    } as const,
  },
  en: {
    eyebrow: "Work",
    back: "← Back to builder",
    titleSuffix: "Generated work",
    workSubtitleVariantsUnit: "variants",
    workSubtitleTasksUnit: "tasks",
    variantLabel: "Variant",
    variantTasksUnit: "tasks",
    workType: "Work type",
    buildSettings: "Build settings",
    buildVariants: "Variants count",
    buildShuffle: "Shuffle task order",
    yes: "Yes",
    no: "No",
    layout: "Layout",
    placement: "Placement",
    printMode: "Print mode",
    printModeStudent: "Variants",
    printModeAnswers: "Answers",
    single: "1 variant/page",
    two: "2 variants/page (landscape)",
    twoDup: "Variant 1 | Variant 1",
    twoCut: "2 variants/page (cut-safe)",
    autosaveSaving: "Saving...",
    autosaveSaved: "Saved",
    autosaveError: "Save error",
    autosaveRetry: "Retry",
    forceTwo: "Try anyway (force)",
    variants: "Variants",
    open: "Open",
    print: "Print",
    answers: "Answers",
    pdf: "PDF",
    answersPdf: "Answers PDF",
    pdfEngine: "PDF engine",
    pdfAllLabel: "Variants",
    pdfAnswersLabel: "Answers",
    engineChromium: "Chromium",
    engineLatex: "LaTeX",
    batchPrint: "Print all",
    batchPdf: "PDF all",
    workTypes: {
      lesson: "Lesson work",
      quiz: "Quiz",
      homework: "Homework",
      test: "Test",
    } as const,
  },
  de: {
    eyebrow: "Arbeit",
    back: "← Zurück zum Baukasten",
    titleSuffix: "Erstellte Arbeit",
    workSubtitleVariantsUnit: "Varianten",
    workSubtitleTasksUnit: "Aufgaben",
    variantLabel: "Variante",
    variantTasksUnit: "Aufgaben",
    workType: "Art der Arbeit",
    buildSettings: "Erzeugungsparameter",
    buildVariants: "Anzahl Varianten",
    buildShuffle: "Aufgaben mischen",
    yes: "Ja",
    no: "Nein",
    layout: "Layout",
    placement: "Anordnung",
    printMode: "Druckmodus",
    printModeStudent: "Aufgaben",
    printModeAnswers: "Lösungen",
    single: "1 Variante/Seite",
    two: "2 Varianten/Seite (Querformat)",
    twoDup: "Variante 1 | Variante 1",
    twoCut: "2 Varianten/Seite (zum Schneiden)",
    autosaveSaving: "Speichere...",
    autosaveSaved: "Gespeichert",
    autosaveError: "Speicherfehler",
    autosaveRetry: "Erneut",
    forceTwo: "Trotzdem versuchen (force)",
    variants: "Varianten",
    open: "Öffnen",
    print: "Drucken",
    answers: "Lösungen",
    pdf: "PDF",
    answersPdf: "Lösungen PDF",
    pdfEngine: "PDF-Engine",
    pdfAllLabel: "Varianten",
    pdfAnswersLabel: "Lösungen",
    engineChromium: "Chromium",
    engineLatex: "LaTeX",
    batchPrint: "Alle drucken",
    batchPdf: "Alle als PDF",
    workTypes: {
      lesson: "Unterricht",
      quiz: "Kurztest",
      homework: "Hausaufgabe",
      test: "Klassenarbeit",
    } as const,
  },
} as const;

export default async function TeacherToolsWorkPage({ params, searchParams }: PageProps) {
  const { locale, id } = await params;
  const query = await searchParams;
  const t = copy[locale];
  const showLatexBetaPdfButton =
    process.env.NODE_ENV !== "production" && process.env.LATEX_PDF_ENABLED === "1";

  const cookieStore = await cookies();
  const { userId } = await getOrCreateVisitorUser(cookieStore);
  const work = await getWorkDetailForOwner(id, userId);
  if (!work) notFound();
  const workDetail = work;

  const storedProfile = normalizePrintProfile(workDetail.printProfileJson);
  const generationSettings = parseGenerationSettings(workDetail.printProfileJson);
  const workType = parseWorkType(workDetail.workType);
  const forceTwoUp = false;
  const canUseTwoCut = workDetail.variants.length % 2 === 0;
  const docMode = query.doc === "answers" ? "answers" : "student";
  const requestedLayout = query.layout ? parsePrintLayout(query.layout) : null;
  const requestedOrientation = query.orientation === "landscape" ? "landscape" : query.orientation === "portrait" ? "portrait" : null;
  const effectiveLayout = requestedLayout ?? storedProfile.layout;
  const effectiveOrientation: PrintOrientation =
    isTwoUpLayout(effectiveLayout)
      ? "landscape"
      : requestedOrientation ?? (requestedLayout ? defaultOrientationForLayout(requestedLayout) : storedProfile.orientation);
  const predictedStudentPdfEngine = selectWorkPdfEngine({
    requestedEngine: null,
    layout: effectiveLayout,
  });
  const predictedAnswersPdfEngine = selectWorkPdfEngine({
    requestedEngine: null,
    layout: storedProfile.layout,
  });
  const subtitleTasksCount = workDetail.variants[0]?.tasksCount ?? 0;

  const engineNameLabel = (engine: "chromium" | "latex") =>
    engine === "latex" ? t.engineLatex : t.engineChromium;

  function workDocModeHref(nextDocMode: "student" | "answers") {
    const params = new URLSearchParams();
    params.set("layout", effectiveLayout);
    params.set("orientation", effectiveOrientation);
    if (nextDocMode === "answers") {
      params.set("doc", "answers");
    }
    return `/${locale}/teacher-tools/works/${workDetail.id}?${params.toString()}`;
  }

  const batchPrintHref = `/${locale}/teacher-tools/works/${workDetail.id}/print?${new URLSearchParams({
    layout: effectiveLayout,
    orientation: effectiveOrientation,
  }).toString()}`;
  const batchPdfHref = `/api/teacher/demo/works/${workDetail.id}/pdf?${new URLSearchParams({
    locale,
    layout: effectiveLayout,
    orientation: effectiveOrientation,
  }).toString()}`;
  const batchPdfLatexHref = `/api/teacher/demo/works/${workDetail.id}/pdf?${new URLSearchParams({
    locale,
    layout: effectiveLayout,
    orientation: effectiveOrientation,
    engine: "latex",
  }).toString()}`;
  const batchAnswersPrintHref = `/${locale}/teacher-tools/works/${workDetail.id}/answers/print`;
  const batchAnswersPdfHref = `/api/teacher/demo/works/${workDetail.id}/answers-pdf?locale=${encodeURIComponent(locale)}`;
  const batchAnswersPdfLatexHref = `/api/teacher/demo/works/${workDetail.id}/answers-pdf?${new URLSearchParams({
    locale,
    engine: "latex",
  }).toString()}`;
  const activeBatchPrintHref = docMode === "answers" ? batchAnswersPrintHref : batchPrintHref;
  const activeBatchPdfHref = docMode === "answers" ? batchAnswersPdfHref : batchPdfHref;
  const activeBatchPdfLatexHref = docMode === "answers" ? batchAnswersPdfLatexHref : batchPdfLatexHref;
  const preferredBatchPdfHref = showLatexBetaPdfButton ? activeBatchPdfLatexHref : activeBatchPdfHref;

  return (
    <main className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">{t.eyebrow}</p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/${locale}/teacher-tools`}
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
          >
            {t.back}
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
              <Link
                href={workDocModeHref("student")}
                className={[
                  "rounded-md px-3 py-1.5 text-sm font-medium",
                  docMode === "student"
                    ? "bg-slate-900 text-white"
                    : "text-slate-700 hover:bg-slate-100",
                ].join(" ")}
              >
                {t.printModeStudent}
              </Link>
              <Link
                href={workDocModeHref("answers")}
                className={[
                  "rounded-md px-3 py-1.5 text-sm font-medium",
                  docMode === "answers"
                    ? "bg-slate-900 text-white"
                    : "text-slate-700 hover:bg-slate-100",
                ].join(" ")}
              >
                {t.printModeAnswers}
              </Link>
            </div>
            <Link
              href={activeBatchPrintHref}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
            >
              {t.print}
            </Link>
            <a
              href={preferredBatchPdfHref}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              {t.pdf}
            </a>
          </div>
        </div>
        {showLatexBetaPdfButton ? (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <span className="font-medium text-slate-700">{t.pdfEngine}:</span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">
              {t.pdfAllLabel}: {engineNameLabel(predictedStudentPdfEngine.engine)}
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">
              {t.pdfAnswersLabel}: {engineNameLabel(predictedAnswersPdfEngine.engine)}
            </span>
          </div>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            {t.workTypes[workType]}
          </h1>
          <WorkStatusBadge
            locale={locale}
            workId={workDetail.id}
            variantsCount={workDetail.variants.length}
          />
        </div>
        <p className="mt-2 text-sm text-slate-600">
          {formatDateTime(locale, workDetail.createdAt)} • {formatNumber(locale, workDetail.variants.length)}{" "}
          {t.workSubtitleVariantsUnit} • {formatNumber(locale, subtitleTasksCount)}{" "}
          {t.workSubtitleTasksUnit}
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <WorkTypeAutosaveField
            key={`${workDetail.id}:${workType}:${effectiveLayout}:${effectiveOrientation}`}
            locale={locale}
            workId={workDetail.id}
            initialWorkType={workType}
            layout={effectiveLayout}
            orientation={effectiveOrientation}
            forceTwoUp={forceTwoUp}
            label={t.workType}
            options={t.workTypes}
          />
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t.layout}</div>
            <div className="mt-1 text-sm font-medium text-slate-900">
              {effectiveLayout === "two"
                ? t.two
                : effectiveLayout === "two_cut"
                  ? t.twoCut
                  : effectiveLayout === "two_dup"
                    ? t.two
                    : t.single}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t.variants}</div>
            <div className="mt-1 text-sm font-medium text-slate-900">
              {formatNumber(locale, workDetail.variants.length)}
            </div>
          </div>
        </div>
        <div className="mt-3">
          <WorkBuildSettingsControls
            locale={locale}
            workId={workDetail.id}
            initialVariantsCount={generationSettings.variantsCount ?? workDetail.variants.length}
            initialShuffleOrder={generationSettings.shuffleOrder ?? false}
            labels={{
              title: t.buildSettings,
              variants: t.buildVariants,
              shuffle: t.buildShuffle,
              rebuild:
                locale === "ru"
                  ? "Пересобрать варианты"
                  : locale === "en"
                    ? "Rebuild variants"
                    : "Varianten neu aufbauen",
              saving: t.autosaveSaving,
              error:
                locale === "ru"
                  ? "Не удалось пересобрать варианты."
                  : locale === "en"
                    ? "Failed to rebuild variants."
                    : "Varianten konnten nicht neu aufgebaut werden.",
              yes: t.yes,
              no: t.no,
            }}
          />
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="space-y-3">
            <div>
              <WorkPlacementAutosaveControls
                locale={locale}
                workId={workDetail.id}
                workType={workType}
                layout={effectiveLayout}
                forceTwoUp={forceTwoUp}
                canUseTwoCut={canUseTwoCut}
                labels={{
                  placement: t.placement,
                  onePerPage: t.single,
                  twoPerPage:
                    locale === "ru"
                      ? "2 варианта/стр"
                      : locale === "en"
                        ? "2 variants/page"
                        : "2 Varianten/Seite",
                  printMethod:
                    locale === "ru"
                      ? "Способ печати"
                      : locale === "en"
                        ? "Print method"
                        : "Druckmodus",
                  oneSided:
                    locale === "ru"
                      ? "Односторонняя (альбом)"
                      : locale === "en"
                        ? "Single-sided (landscape)"
                        : "Einseitig (Querformat)",
                  duplexCut:
                    locale === "ru"
                      ? "Двусторонняя (под разрезание)"
                      : locale === "en"
                        ? "Double-sided (cut)"
                        : "Beidseitig (zum Schneiden)",
                  singleHint:
                    locale === "ru"
                      ? "Один вариант на листе — крупнее и удобнее для решения."
                      : locale === "en"
                        ? "One variant per sheet: larger and easier to solve."
                        : "Eine Variante pro Blatt: größer und leichter zu bearbeiten.",
                  twoOneSidedHint:
                    locale === "ru"
                      ? "Два варианта рядом на одной стороне листа."
                      : locale === "en"
                        ? "Two variants side by side on one side of the sheet."
                        : "Zwei Varianten nebeneinander auf einer Blattseite.",
                  twoDuplexHint:
                    locale === "ru"
                      ? "В принтере: двусторонняя печать → переворот по короткому краю. На обороте колонки переставляются автоматически, чтобы варианты не перепутались после разрезания."
                      : locale === "en"
                        ? "In printer settings: duplex printing with short-edge flip. Back-side columns are swapped automatically for safe cutting."
                        : "Im Drucker: Duplexdruck mit Wendung an der kurzen Kante. Auf der Rückseite werden die Spalten automatisch getauscht.",
                  previewFront:
                    locale === "ru"
                      ? "Лицевая"
                      : locale === "en"
                        ? "Front"
                        : "Vorderseite",
                  previewBack:
                    locale === "ru"
                      ? "Оборот"
                      : locale === "en"
                        ? "Back"
                        : "Rückseite",
                  autoSwapNote:
                    locale === "ru"
                      ? "автоматически"
                      : locale === "en"
                        ? "automatic"
                        : "automatisch",
                  saving: t.autosaveSaving,
                  saved: t.autosaveSaved,
                  error: t.autosaveError,
                  retry: t.autosaveRetry,
                  cutUnavailableHint:
                    locale === "ru"
                      ? "Для режима разрезания нужно чётное количество вариантов."
                      : locale === "en"
                        ? "Cut mode is available only for an even number of variants."
                        : "Der Zuschnittmodus ist nur bei einer geraden Anzahl von Varianten verfügbar.",
                }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">{t.variants}</h2>
        <div className="space-y-3">
          {workDetail.variants.map((variant) => (
            <SurfaceCard key={variant.id} className="p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-950">
                    {t.variantLabel} {variant.orderIndex + 1}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {formatDateTime(locale, variant.createdAt)} • {formatNumber(locale, variant.tasksCount)}{" "}
                    {t.variantTasksUnit}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/${locale}/teacher-tools/variants/${variant.id}`} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100">
                    {t.open}
                  </Link>
                  <Link href={`/${locale}/teacher-tools/variants/${variant.id}/print?${new URLSearchParams({ layout: effectiveLayout, orientation: effectiveOrientation }).toString()}`} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100">
                    {t.print}
                  </Link>
                  <Link href={`/${locale}/teacher-tools/variants/${variant.id}/answers/print`} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100">
                    {t.answers}
                  </Link>
                  <a href={`/api/teacher/demo/variants/${variant.id}/pdf?${new URLSearchParams({ locale, layout: effectiveLayout, orientation: effectiveOrientation }).toString()}`} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700">
                    {t.pdf}
                  </a>
                  <a href={`/api/teacher/demo/variants/${variant.id}/answers-pdf?locale=${encodeURIComponent(locale)}`} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700">
                    {t.answersPdf}
                  </a>
                </div>
              </div>
            </SurfaceCard>
          ))}
        </div>
      </section>
    </main>
  );
}
