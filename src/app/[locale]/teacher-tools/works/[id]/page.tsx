import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { SurfaceCard } from "@/src/components/ui/SurfaceCard";
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

type StoredPrintFit = {
  recommendedLayout?: "single" | "two";
  allowTwoUp?: boolean;
  reasons?: string[];
};

function parseStoredFit(value: unknown): StoredPrintFit {
  if (!value || typeof value !== "object") return {};
  const fit = (value as { fit?: unknown }).fit;
  if (!fit || typeof fit !== "object") return {};
  const obj = fit as { recommendedLayout?: unknown; allowTwoUp?: unknown; reasons?: unknown };
  return {
    recommendedLayout: obj.recommendedLayout === "two" ? "two" : "single",
    allowTwoUp: typeof obj.allowTwoUp === "boolean" ? obj.allowTwoUp : undefined,
    reasons: Array.isArray(obj.reasons) ? obj.reasons.filter((r): r is string => typeof r === "string") : undefined,
  };
}

function parseWorkType(value: string) {
  return value as "lesson" | "quiz" | "homework" | "test";
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
    duplexHint: "Для двусторонней печати выберите переворот по короткой стороне.",
    modeHint: "Подсказка по режиму",
    hintSingle: "Портретная печать: варианты идут стопкой по страницам.",
    hintTwo: "Альбомная печать: два разных варианта по колонкам, экономия бумаги.",
    hintTwoDup: "Альбомная печать: один и тот же вариант в двух колонках (две копии на листе).",
    hintTwoCut: "Двусторонняя печать с разрезанием: чётные страницы зеркалятся, продолжения идут дальше.",
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
    duplexHint: "For duplex printing use short-edge flip.",
    modeHint: "Mode hint",
    hintSingle: "Portrait printing: variants go in a regular page stack.",
    hintTwo: "Landscape printing: two different variants in columns (paper-saving).",
    hintTwoDup: "Landscape printing: the same variant duplicated in both columns (two copies per sheet).",
    hintTwoCut: "Duplex cut-safe mode: even pages are mirrored, continuations go to next pages.",
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
    duplexHint: "Für Duplexdruck: Wendung an der kurzen Kante.",
    modeHint: "Hinweis zum Modus",
    hintSingle: "Hochformatdruck: Varianten laufen als normaler Seitenstapel.",
    hintTwo: "Querformatdruck: zwei verschiedene Varianten in Spalten (Papiersparen).",
    hintTwoDup: "Querformatdruck: dieselbe Variante in beiden Spalten (zwei Kopien pro Blatt).",
    hintTwoCut: "Duplex-Schneidemodus: gerade Seiten werden gespiegelt, Fortsetzungen laufen weiter.",
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
  const fit = parseStoredFit(workDetail.printProfileJson);
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
  const modeHintText =
    effectiveLayout === "two_cut"
      ? t.hintTwoCut
      : effectiveLayout === "two" || effectiveLayout === "two_dup"
          ? t.hintTwo
          : t.hintSingle;
  const recommendationLayoutLabel =
    fit.recommendedLayout === "two" ? t.two : t.single;
  const recommendationReasons =
    fit.reasons && fit.reasons.length > 0 ? fit.reasons.slice(0, 4) : [modeHintText];
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
                      ? "2 на страницу"
                      : locale === "en"
                        ? "2 per page"
                        : "2 pro Seite",
                  landscape:
                    locale === "ru"
                      ? "Альбом"
                      : locale === "en"
                        ? "Landscape"
                        : "Querformat",
                  cut:
                    locale === "ru"
                      ? "Разрезать"
                      : locale === "en"
                        ? "Cut"
                        : "Zum Schneiden",
                  saving: t.autosaveSaving,
                  saved: t.autosaveSaved,
                  error: t.autosaveError,
                  retry: t.autosaveRetry,
                  cutUnavailableTitle:
                    locale === "ru"
                      ? "Для режима разрезания нужно чётное количество вариантов."
                      : locale === "en"
                        ? "Cut mode is available only for an even number of variants."
                        : "Der Zuschnittmodus ist nur bei einer geraden Anzahl von Varianten verfügbar.",
                }}
              />
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="text-sm font-semibold text-slate-900">
                {locale === "ru"
                  ? `Рекомендация: ${recommendationLayoutLabel}`
                  : locale === "en"
                    ? `Recommendation: ${recommendationLayoutLabel}`
                    : `Empfehlung: ${recommendationLayoutLabel}`}
              </div>
              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                {recommendationReasons.map((reason) => (
                  <li key={reason} className="flex items-start gap-2">
                    <span aria-hidden="true" className="mt-[2px] text-slate-400">
                      •
                    </span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
              {effectiveLayout === "two_cut" ? (
                <div className="mt-2 text-sm text-slate-700">{t.duplexHint}</div>
              ) : null}
              {!canUseTwoCut ? (
                <div className="mt-2 text-sm text-slate-700">
                  {locale === "ru"
                    ? "Режим для разрезания доступен только при чётном количестве вариантов."
                    : locale === "en"
                      ? "Cut mode is available only for an even number of variants."
                      : "Der Zuschnittmodus ist nur bei einer geraden Anzahl von Varianten verfügbar."}
                </div>
              ) : null}
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
                  <a href={`/api/teacher/demo/variants/${variant.id}/pdf?${new URLSearchParams({ locale, layout: effectiveLayout, orientation: effectiveOrientation }).toString()}`} className="rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700">
                    {t.pdf}
                  </a>
                  <a href={`/api/teacher/demo/variants/${variant.id}/answers-pdf?locale=${encodeURIComponent(locale)}`} className="rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700">
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
