"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { ButtonLink } from "@/src/components/ui/ButtonLink";
import { TeacherErrorState, type TeacherApiError } from "@/src/components/ui/TeacherErrorState";
import { SurfaceCard } from "@/src/components/ui/SurfaceCard";
import { formatDateTime, formatNumber } from "@/src/lib/i18n/format";

type TemplateSummary = {
  id: string;
  title: string;
  header: { gradeLabel: string; topicLabel: string };
  sections: Array<{
    label: string;
    count: number;
    difficulty: [number, number];
    skillsCount: number;
  }>;
};

type VariantSummary = {
  id: string;
  topicId: string;
  templateId: string;
  title: string;
  seed: string;
  createdAt: string;
  tasksCount: number;
};

type TeacherVariantsPageClientProps = {
  locale: string;
  initialRole: "student" | "teacher" | "admin";
};

type WorkTypeFilter = "all" | "training" | "quiz" | "control";
type DifficultyFilter = "all" | "base" | "mixed" | "advanced";

const copy = {
  ru: {
    eyebrow: "Готовые листы + генератор",
    title: "Откройте варианты для урока",
    subtitle:
      "Сначала выберите готовый лист по теме, а если нужно, перейдите к конструктору и соберите свой вариант по навыкам.",
    openReady: "Готовые варианты",
    openBuilder: "Собрать свой",
    heroBullets: [
      "Готовые листы по теме",
      "Печать, PDF и ответы",
      "Конструктор как кастомный режим",
    ],
    authTitle: "Доступ только для учителя",
    authBody: "Для MVP можно выдать роль учителя локально кнопкой ниже.",
    becomeTeacher: "Стать учителем (dev)",
    teachersPage: "Страница для учителей",
    filtersTitle: "Быстрые фильтры",
    filtersSubtitle: "Сначала подберите подходящий готовый лист, потом уже решайте, нужен ли кастомный вариант.",
    topicLabel: "Тема",
    topicValue: "Пропорции",
    typeLabel: "Тип работы",
    difficultyLabel: "Уровень",
    typeAll: "Все",
    typeTraining: "Тренировка",
    typeQuiz: "Самостоятельная",
    typeControl: "Контрольная",
    difficultyAll: "Все уровни",
    difficultyBase: "Базовый",
    difficultyMixed: "Смешанный",
    difficultyAdvanced: "Продвинутый",
    recommendedTitle: "Рекомендованные готовые варианты",
    recommendedSubtitle: "Быстрый выбор без лишней настройки.",
    allTitle: "Все готовые варианты",
    allSubtitle: "Полный каталог шаблонов по теме.",
    emptyTemplates: "Подходящие готовые варианты пока не найдены.",
    buildOwnTitle: "Не нашли подходящий?",
    buildOwnSubtitle:
      "Откройте конструктор и соберите свой вариант по навыкам, подтемам и параметрам печати.",
    buildOwnCta: "Перейти к настройке",
    recentTitle: "Недавние варианты",
    recentSubtitle: "Быстрый доступ к последним собранным листам.",
    loading: "Загрузка...",
    refresh: "Обновить",
    generating: "Генерация...",
    generate: "Создать по шаблону",
    customize: "Изменить под себя",
    open: "Открыть",
    print: "Печать",
    pdf: "PDF",
    answersPdf: "Ответы PDF",
    clearList: "Очистить список",
    clearing: "Очистка...",
    noVariantsTitle: "Пока нет собранных вариантов",
    noVariantsBody: "Выберите готовый шаблон выше или откройте конструктор, чтобы создать первый лист.",
    noticeGenerated: "Вариант сгенерирован.",
    noticeTeacherGranted: "Роль учителя выдана.",
    noticeDeleted: (count: number) => (count > 0 ? `Удалено вариантов: ${count}.` : "Список вариантов уже был пуст."),
    networkLoadError: "Ошибка сети при загрузке teacher-инструментов.",
    networkGenerateError: "Ошибка сети при генерации варианта.",
    networkClearError: "Ошибка сети при очистке списка вариантов.",
    networkTeacherError: "Ошибка сети при выдаче роли учителя.",
    csrfError: "Не удалось получить CSRF-токен.",
    templatesLoadError: "Не удалось загрузить шаблоны.",
    variantsLoadError: "Не удалось загрузить варианты.",
    generateError: "Не удалось сгенерировать вариант.",
    clearError: "Не удалось очистить список вариантов.",
    teacherError: "Не удалось выдать роль учителя.",
    sectionsLabel: "Структура",
    skillsLabel: "Навыков",
    tasksLabel: "Задач",
    recentCountLabel: "элементов",
  },
  en: {
    eyebrow: "Ready worksheets + builder",
    title: "Open lesson variants",
    subtitle:
      "Pick a ready worksheet first, and if needed, switch to the builder to assemble a custom variant by skills.",
    openReady: "Ready variants",
    openBuilder: "Build your own",
    heroBullets: [
      "Ready worksheets by topic",
      "Print, PDF, and answer keys",
      "Builder as a custom mode",
    ],
    authTitle: "Teacher access only",
    authBody: "For MVP you can grant teacher role locally using the button below.",
    becomeTeacher: "Become teacher (dev)",
    teachersPage: "Teachers page",
    filtersTitle: "Quick filters",
    filtersSubtitle: "Find a ready worksheet first, then decide whether you need a custom build.",
    topicLabel: "Topic",
    topicValue: "Proportion",
    typeLabel: "Work type",
    difficultyLabel: "Level",
    typeAll: "All",
    typeTraining: "Training",
    typeQuiz: "Quiz",
    typeControl: "Control",
    difficultyAll: "All levels",
    difficultyBase: "Base",
    difficultyMixed: "Mixed",
    difficultyAdvanced: "Advanced",
    recommendedTitle: "Recommended ready variants",
    recommendedSubtitle: "Fastest path without extra setup.",
    allTitle: "All ready variants",
    allSubtitle: "Complete template catalog for this topic.",
    emptyTemplates: "No ready variants match current filters.",
    buildOwnTitle: "Did not find the right one?",
    buildOwnSubtitle: "Open the builder and assemble a custom variant by skills, subtopics, and print settings.",
    buildOwnCta: "Open builder",
    recentTitle: "Recent variants",
    recentSubtitle: "Fast access to the latest generated worksheets.",
    loading: "Loading...",
    refresh: "Refresh",
    generating: "Generating...",
    generate: "Create from template",
    customize: "Customize",
    open: "Open",
    print: "Print",
    pdf: "PDF",
    answersPdf: "Answers PDF",
    clearList: "Clear list",
    clearing: "Clearing...",
    noVariantsTitle: "No generated variants yet",
    noVariantsBody: "Pick a ready template above or open the builder to create the first worksheet.",
    noticeGenerated: "Variant generated.",
    noticeTeacherGranted: "Teacher role granted.",
    noticeDeleted: (count: number) => (count > 0 ? `Deleted variants: ${count}.` : "The list was already empty."),
    networkLoadError: "Network error while loading teacher tools.",
    networkGenerateError: "Network error while generating variant.",
    networkClearError: "Network error while clearing variants list.",
    networkTeacherError: "Network error while granting teacher role.",
    csrfError: "Failed to get CSRF token.",
    templatesLoadError: "Failed to load templates.",
    variantsLoadError: "Failed to load variants.",
    generateError: "Failed to generate variant.",
    clearError: "Failed to clear variants list.",
    teacherError: "Failed to grant teacher role.",
    sectionsLabel: "Structure",
    skillsLabel: "Skills",
    tasksLabel: "Tasks",
    recentCountLabel: "items",
  },
  de: {
    eyebrow: "Fertige Blaetter + Generator",
    title: "Varianten fuer den Unterricht",
    subtitle:
      "Waehlen Sie zuerst ein fertiges Blatt und wechseln Sie nur bei Bedarf in den Generator fuer eine eigene Variante.",
    openReady: "Fertige Varianten",
    openBuilder: "Eigene bauen",
    heroBullets: [
      "Fertige Blaetter nach Thema",
      "Druck, PDF und Loesungen",
      "Generator als Sondermodus",
    ],
    authTitle: "Nur fuer Lehrkraefte",
    authBody: "Fuer das MVP kann die Lehrerrolle lokal ueber die Schaltflaeche unten vergeben werden.",
    becomeTeacher: "Lehrer werden (dev)",
    teachersPage: "Lehrkraefte-Seite",
    filtersTitle: "Schnellfilter",
    filtersSubtitle: "Zuerst ein passendes fertiges Blatt finden, dann erst ueber eine eigene Variante entscheiden.",
    topicLabel: "Thema",
    topicValue: "Proportionen",
    typeLabel: "Arbeitsart",
    difficultyLabel: "Niveau",
    typeAll: "Alle",
    typeTraining: "Training",
    typeQuiz: "Selbstarbeit",
    typeControl: "Kontrolle",
    difficultyAll: "Alle Niveaus",
    difficultyBase: "Basis",
    difficultyMixed: "Gemischt",
    difficultyAdvanced: "Fortgeschritten",
    recommendedTitle: "Empfohlene fertige Varianten",
    recommendedSubtitle: "Der schnellste Weg ohne zusaetzliche Einstellungen.",
    allTitle: "Alle fertigen Varianten",
    allSubtitle: "Vollstaendiger Vorlagenkatalog fuer dieses Thema.",
    emptyTemplates: "Keine fertigen Varianten passen zu den aktuellen Filtern.",
    buildOwnTitle: "Nichts Passendes gefunden?",
    buildOwnSubtitle: "Oeffnen Sie den Generator und bauen Sie eine eigene Variante nach Skills, Unterthemen und Druckprofil.",
    buildOwnCta: "Generator oeffnen",
    recentTitle: "Letzte Varianten",
    recentSubtitle: "Schneller Zugriff auf die zuletzt erzeugten Arbeitsblaetter.",
    loading: "Laden...",
    refresh: "Aktualisieren",
    generating: "Generierung...",
    generate: "Aus Vorlage erstellen",
    customize: "Anpassen",
    open: "Oeffnen",
    print: "Drucken",
    pdf: "PDF",
    answersPdf: "Loesungen PDF",
    clearList: "Liste leeren",
    clearing: "Leeren...",
    noVariantsTitle: "Noch keine erzeugten Varianten",
    noVariantsBody: "Waehlen Sie oben eine fertige Vorlage oder oeffnen Sie den Generator fuer das erste Blatt.",
    noticeGenerated: "Variante erzeugt.",
    noticeTeacherGranted: "Lehrerrolle vergeben.",
    noticeDeleted: (count: number) => (count > 0 ? `Varianten geloescht: ${count}.` : "Die Liste war bereits leer."),
    networkLoadError: "Netzwerkfehler beim Laden der Teacher-Tools.",
    networkGenerateError: "Netzwerkfehler beim Erzeugen der Variante.",
    networkClearError: "Netzwerkfehler beim Leeren der Variantenliste.",
    networkTeacherError: "Netzwerkfehler beim Vergeben der Lehrerrolle.",
    csrfError: "CSRF-Token konnte nicht geladen werden.",
    templatesLoadError: "Vorlagen konnten nicht geladen werden.",
    variantsLoadError: "Varianten konnten nicht geladen werden.",
    generateError: "Variante konnte nicht erzeugt werden.",
    clearError: "Variantenliste konnte nicht geleert werden.",
    teacherError: "Lehrerrolle konnte nicht vergeben werden.",
    sectionsLabel: "Struktur",
    skillsLabel: "Skills",
    tasksLabel: "Aufgaben",
    recentCountLabel: "Elemente",
  },
} as const;

function totalTasksCount(template: TemplateSummary) {
  return template.sections.reduce((sum, section) => sum + section.count, 0);
}

function totalSkillsCount(template: TemplateSummary) {
  return template.sections.reduce((sum, section) => sum + section.skillsCount, 0);
}

function inferTemplateWorkType(template: TemplateSummary): WorkTypeFilter {
  const source = `${template.id} ${template.title}`.toLowerCase();
  if (/control|контрол/i.test(source)) return "control";
  if (/quiz|самостоятель/i.test(source)) return "quiz";
  return "training";
}

function inferTemplateDifficulty(template: TemplateSummary): DifficultyFilter {
  const maxDifficulty = Math.max(...template.sections.map((section) => section.difficulty[1]));
  if (maxDifficulty <= 2) return "base";
  if (maxDifficulty >= 4) return "advanced";
  return "mixed";
}

function templateRecommendationScore(template: TemplateSummary) {
  const type = inferTemplateWorkType(template);
  if (type === "training") return 3;
  if (type === "quiz") return 2;
  return 1;
}

export function TeacherVariantsPageClient({
  locale,
  initialRole,
}: TeacherVariantsPageClientProps) {
  const t = copy[(locale as "ru" | "en" | "de")] ?? copy.en;
  const readySectionRef = useRef<HTMLElement | null>(null);
  const buildSectionRef = useRef<HTMLElement | null>(null);

  const [role, setRole] = useState(initialRole);
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [variants, setVariants] = useState<VariantSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyTemplateId, setBusyTemplateId] = useState<string | null>(null);
  const [clearingVariants, setClearingVariants] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<TeacherApiError | null>(null);
  const [csrfToken, setCsrfToken] = useState("");
  const [workTypeFilter, setWorkTypeFilter] = useState<WorkTypeFilter>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("all");

  const isTeacher = role === "teacher" || role === "admin";
  const builderHref = `/${locale}/teacher-tools?topicId=math.proportion`;

  function parseApiError(payload: unknown, fallbackMessage: string): TeacherApiError {
    if (payload && typeof payload === "object") {
      const data = payload as {
        code?: unknown;
        message?: unknown;
        error?: unknown;
        details?: unknown;
      };
      return {
        code: typeof data.code === "string" ? data.code : undefined,
        message:
          typeof data.message === "string"
            ? data.message
            : typeof data.error === "string"
              ? data.error
              : fallbackMessage,
        details: data.details,
      };
    }
    return { message: fallbackMessage };
  }

  async function loadData() {
    if (!isTeacher) return;
    setLoading(true);
    setError(null);
    try {
      const [templatesResponse, variantsResponse] = await Promise.all([
        fetch("/api/teacher/templates?topicId=math.proportion", { credentials: "same-origin" }),
        fetch("/api/teacher/variants", { credentials: "same-origin" }),
      ]);

      const templatesPayload = (await templatesResponse.json()) as {
        ok?: boolean;
        error?: string;
        message?: string;
        templates?: TemplateSummary[];
      };
      const variantsPayload = (await variantsResponse.json()) as {
        ok?: boolean;
        code?: string;
        error?: string;
        message?: string;
        details?: unknown;
        variants?: VariantSummary[];
      };

      if (!templatesResponse.ok || !templatesPayload.ok) {
        setError(parseApiError(templatesPayload, t.templatesLoadError));
        setTemplates([]);
      } else {
        setTemplates(templatesPayload.templates ?? []);
      }

      if (!variantsResponse.ok || !variantsPayload.ok) {
        setError((prev) => prev ?? parseApiError(variantsPayload, t.variantsLoadError));
        setVariants([]);
      } else {
        setVariants(variantsPayload.variants ?? []);
      }
    } catch {
      setError({ message: t.networkLoadError });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/auth/session", { credentials: "same-origin" });
        const payload = (await response.json()) as { csrfToken?: unknown };
        if (typeof payload.csrfToken === "string" && payload.csrfToken) {
          setCsrfToken(payload.csrfToken);
        }
      } catch {
        // auth page can recover on next action
      }
    })();
  }, []);

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTeacher]);

  async function handleBecomeTeacher() {
    if (!csrfToken) {
      setError({ message: t.csrfError });
      return;
    }
    setNotice(null);
    setError(null);
    try {
      const response = await fetch("/api/teacher/become", {
        method: "POST",
        headers: { "x-csrf-token": csrfToken },
        credentials: "same-origin",
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        user?: { role?: typeof role };
        code?: string;
        error?: string;
        message?: string;
      };
      const nextRole = payload.user?.role;
      if (!response.ok || !payload.ok || !nextRole) {
        setError(parseApiError(payload, t.teacherError));
        return;
      }
      setRole(nextRole);
      setNotice(t.noticeTeacherGranted);
    } catch {
      setError({ message: t.networkTeacherError });
    }
  }

  async function handleGenerate(templateId: string) {
    if (!csrfToken) {
      setError({ message: t.csrfError });
      return;
    }
    setBusyTemplateId(templateId);
    setNotice(null);
    setError(null);
    try {
      const response = await fetch("/api/teacher/variants", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
        credentials: "same-origin",
        body: JSON.stringify({ topicId: "math.proportion", templateId }),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        variantId?: string;
        code?: string;
        error?: string;
        message?: string;
        details?: unknown;
      };
      if (!response.ok || !payload.ok || !payload.variantId) {
        setError(parseApiError(payload, t.generateError));
        return;
      }
      await loadData();
      setNotice(t.noticeGenerated);
    } catch {
      setError({ message: t.networkGenerateError });
    } finally {
      setBusyTemplateId(null);
    }
  }

  async function handleClearVariants() {
    if (!csrfToken) {
      setError({ message: t.csrfError });
      return;
    }
    if (variants.length === 0 || clearingVariants) return;
    const confirmed = window.confirm(
      locale === "ru"
        ? `Удалить все сгенерированные варианты (${variants.length})? Это действие нельзя отменить.`
        : locale === "de"
          ? `Alle erzeugten Varianten (${variants.length}) loeschen? Diese Aktion kann nicht rueckgaengig gemacht werden.`
          : `Delete all generated variants (${variants.length})? This action cannot be undone.`,
    );
    if (!confirmed) return;

    setClearingVariants(true);
    setNotice(null);
    setError(null);
    try {
      const response = await fetch("/api/teacher/variants", {
        method: "DELETE",
        headers: { "x-csrf-token": csrfToken },
        credentials: "same-origin",
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        deletedCount?: number;
        code?: string;
        message?: string;
        error?: string;
        details?: unknown;
      };

      if (!response.ok || !payload.ok) {
        setError(parseApiError(payload, t.clearError));
        return;
      }

      const deletedCount = typeof payload.deletedCount === "number" ? payload.deletedCount : 0;
      setVariants([]);
      setNotice(t.noticeDeleted(deletedCount));
    } catch {
      setError({ message: t.networkClearError });
    } finally {
      setClearingVariants(false);
    }
  }

  const showInitialLoading = loading && templates.length === 0 && variants.length === 0;

  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const type = inferTemplateWorkType(template);
      const difficulty = inferTemplateDifficulty(template);
      if (workTypeFilter !== "all" && type !== workTypeFilter) return false;
      if (difficultyFilter !== "all" && difficulty !== difficultyFilter) return false;
      return true;
    });
  }, [difficultyFilter, templates, workTypeFilter]);

  const recommendedTemplates = useMemo(() => {
    return [...filteredTemplates]
      .sort((a, b) => templateRecommendationScore(b) - templateRecommendationScore(a))
      .slice(0, 3);
  }, [filteredTemplates]);

  function scrollToReady() {
    readySectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function scrollToBuild() {
    buildSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderTemplateCard(template: TemplateSummary, compact = false) {
    const tasksCount = totalTasksCount(template);
    const skillsCount = totalSkillsCount(template);
    const workType = inferTemplateWorkType(template);
    const difficulty = inferTemplateDifficulty(template);

    const workTypeLabel =
      workType === "training" ? t.typeTraining : workType === "quiz" ? t.typeQuiz : t.typeControl;
    const difficultyLabel =
      difficulty === "base"
        ? t.difficultyBase
        : difficulty === "mixed"
          ? t.difficultyMixed
          : t.difficultyAdvanced;

    return (
      <SurfaceCard key={template.id} className={compact ? "p-4" : "p-5"}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-slate-300 bg-slate-50 px-2 py-1">
                {template.header.gradeLabel}
              </span>
              <span className="rounded-full border border-slate-300 bg-slate-50 px-2 py-1">
                {template.header.topicLabel}
              </span>
              <span className="rounded-full border border-slate-300 bg-slate-50 px-2 py-1">{workTypeLabel}</span>
              <span className="rounded-full border border-slate-300 bg-slate-50 px-2 py-1">{difficultyLabel}</span>
            </div>
            <h3 className="mt-3 text-lg font-semibold text-slate-950">{template.title}</h3>
            <p className="mt-1 text-xs text-slate-500">{template.id}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-700">
              <span className="rounded-full border border-slate-300 bg-white px-2 py-1">
                {formatNumber(locale, tasksCount)} {t.tasksLabel.toLowerCase()}
              </span>
              <span className="rounded-full border border-slate-300 bg-white px-2 py-1">
                {formatNumber(locale, skillsCount)} {t.skillsLabel.toLowerCase()}
              </span>
            </div>
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t.sectionsLabel}</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                {template.sections.map((section) => (
                  <li key={`${template.id}:${section.label}`}>
                    {section.label}: {section.count}, {section.difficulty[0]}-{section.difficulty[1]}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2 lg:w-52 lg:flex-col">
            <button
              type="button"
              disabled={busyTemplateId === template.id || loading}
              onClick={() => void handleGenerate(template.id)}
              className="inline-flex items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busyTemplateId === template.id ? t.generating : t.generate}
            </button>
            <ButtonLink href={`${builderHref}&templateId=${encodeURIComponent(template.id)}`} variant="secondary">
              {t.customize}
            </ButtonLink>
          </div>
        </div>
      </SurfaceCard>
    );
  }

  return (
    <main className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(148,163,184,0.2),_transparent_45%),linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)] p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">{t.eyebrow}</p>
        <div className="mt-3 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div>
            <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
              {t.title}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">{t.subtitle}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={scrollToReady}
                className="inline-flex items-center justify-center rounded-xl border border-[var(--primary)] bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white hover:bg-[var(--primary-hover)]"
              >
                {t.openReady}
              </button>
              <button
                type="button"
                onClick={scrollToBuild}
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100"
              >
                {t.openBuilder}
              </button>
            </div>
            <ul className="mt-6 space-y-2 text-sm text-slate-700">
              {t.heroBullets.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="inline-flex size-5 items-center justify-center rounded-full border border-[var(--primary)] text-[11px] text-[var(--primary)]">
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <SurfaceCard className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{t.filtersTitle}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{t.filtersSubtitle}</p>
            <div className="mt-4 grid gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t.topicLabel}</p>
                <p className="mt-1 text-sm font-medium text-slate-900">{t.topicValue}</p>
              </div>
              <label className="grid gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t.typeLabel}</span>
                <select
                  value={workTypeFilter}
                  onChange={(event) => setWorkTypeFilter(event.target.value as WorkTypeFilter)}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                >
                  <option value="all">{t.typeAll}</option>
                  <option value="training">{t.typeTraining}</option>
                  <option value="quiz">{t.typeQuiz}</option>
                  <option value="control">{t.typeControl}</option>
                </select>
              </label>
              <label className="grid gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t.difficultyLabel}</span>
                <select
                  value={difficultyFilter}
                  onChange={(event) => setDifficultyFilter(event.target.value as DifficultyFilter)}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                >
                  <option value="all">{t.difficultyAll}</option>
                  <option value="base">{t.difficultyBase}</option>
                  <option value="mixed">{t.difficultyMixed}</option>
                  <option value="advanced">{t.difficultyAdvanced}</option>
                </select>
              </label>
            </div>
          </SurfaceCard>
        </div>
      </section>

      {!isTeacher ? (
        <SurfaceCard className="p-6">
          <h2 className="text-lg font-semibold text-slate-950">{t.authTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{t.authBody}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleBecomeTeacher}
              className="inline-flex items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              {t.becomeTeacher}
            </button>
            <ButtonLink href={`/${locale}/teachers`} variant="secondary">
              {t.teachersPage}
            </ButtonLink>
          </div>
          {notice ? <p className="mt-3 text-sm text-slate-700">{notice}</p> : null}
          {error ? <TeacherErrorState error={error} locale={locale} className="mt-4 p-4" /> : null}
        </SurfaceCard>
      ) : (
        <>
          {notice ? (
            <SurfaceCard className="p-4">
              <p className="text-sm text-slate-700">{notice}</p>
            </SurfaceCard>
          ) : null}
          {error ? <TeacherErrorState error={error} locale={locale} /> : null}

          {showInitialLoading ? (
            <>
              <section className="space-y-3">
                <div className="h-8 w-64 animate-pulse rounded bg-slate-200" />
                <div className="grid gap-3 lg:grid-cols-2">
                  {[0, 1].map((index) => (
                    <SurfaceCard key={`tpl-skeleton-${index}`} className="p-5">
                      <div className="space-y-3">
                        <div className="h-5 w-64 animate-pulse rounded bg-slate-200" />
                        <div className="h-4 w-40 animate-pulse rounded bg-slate-100" />
                        <div className="h-20 w-full animate-pulse rounded bg-slate-100" />
                      </div>
                    </SurfaceCard>
                  ))}
                </div>
              </section>
              <section className="space-y-3">
                <div className="h-8 w-52 animate-pulse rounded bg-slate-200" />
                <SurfaceCard className="p-4">
                  <div className="space-y-3">
                    <div className="h-5 w-72 animate-pulse rounded bg-slate-200" />
                    <div className="h-4 w-48 animate-pulse rounded bg-slate-100" />
                  </div>
                </SurfaceCard>
              </section>
            </>
          ) : null}

          <section ref={readySectionRef} className={`space-y-6 ${showInitialLoading ? "hidden" : ""}`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{t.recommendedTitle}</h2>
                <p className="mt-1 text-sm text-slate-600">{t.recommendedSubtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => void loadData()}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
              >
                {loading ? t.loading : t.refresh}
              </button>
            </div>

            {recommendedTemplates.length === 0 ? (
              <SurfaceCard className="p-5">
                <p className="text-sm text-slate-600">{t.emptyTemplates}</p>
              </SurfaceCard>
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {recommendedTemplates.map((template) => renderTemplateCard(template, true))}
              </div>
            )}
          </section>

          <section className={`space-y-4 ${showInitialLoading ? "hidden" : ""}`}>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{t.allTitle}</h2>
              <p className="mt-1 text-sm text-slate-600">{t.allSubtitle}</p>
            </div>
            {filteredTemplates.length === 0 ? (
              <SurfaceCard className="p-5">
                <p className="text-sm text-slate-600">{t.emptyTemplates}</p>
              </SurfaceCard>
            ) : (
              <div className="space-y-4">{filteredTemplates.map((template) => renderTemplateCard(template))}</div>
            )}
          </section>

          <section ref={buildSectionRef} className={`grid gap-4 lg:grid-cols-[1.1fr_0.9fr] ${showInitialLoading ? "hidden" : ""}`}>
            <SurfaceCard className="p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">{t.buildOwnTitle}</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{t.openBuilder}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">{t.buildOwnSubtitle}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <ButtonLink href={builderHref} variant="primary">
                  {t.buildOwnCta}
                </ButtonLink>
                <ButtonLink href={`${builderHref}&mode=multi`} variant="secondary">
                  {locale === "ru" ? "Смешанная работа" : locale === "de" ? "Gemischte Arbeit" : "Mixed worksheet"}
                </ButtonLink>
              </div>
            </SurfaceCard>

            <SurfaceCard className="p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{t.recentTitle}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{t.recentSubtitle}</p>
              <div className="mt-4 flex items-center justify-between gap-3 text-xs text-slate-500">
                <span>
                  {variants.length} {t.recentCountLabel}
                </span>
                <button
                  type="button"
                  onClick={() => void handleClearVariants()}
                  disabled={variants.length === 0 || clearingVariants || loading}
                  className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {clearingVariants ? t.clearing : t.clearList}
                </button>
              </div>
            </SurfaceCard>
          </section>

          <section className={`space-y-4 ${showInitialLoading ? "hidden" : ""}`}>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{t.recentTitle}</h2>
              <p className="mt-1 text-sm text-slate-600">{t.recentSubtitle}</p>
            </div>
            {variants.length === 0 ? (
              <SurfaceCard className="p-5">
                <h3 className="text-sm font-semibold text-slate-900">{t.noVariantsTitle}</h3>
                <p className="mt-2 text-sm text-slate-600">{t.noVariantsBody}</p>
              </SurfaceCard>
            ) : (
              <div className="space-y-3">
                {variants.map((variant) => (
                  <SurfaceCard key={variant.id} className="p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold text-slate-950">{variant.title}</h3>
                        <p className="mt-1 text-sm text-slate-600">
                          {formatDateTime(locale, variant.createdAt)} • {formatNumber(locale, variant.tasksCount)}{" "}
                          {t.tasksLabel.toLowerCase()}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <ButtonLink href={`/${locale}/teacher/variants/${variant.id}`} variant="secondary">
                          {t.open}
                        </ButtonLink>
                        <ButtonLink href={`/${locale}/teacher/variants/${variant.id}/print`} variant="ghost">
                          {t.print}
                        </ButtonLink>
                        <Link
                          href={`/api/teacher/variants/${variant.id}/pdf?locale=${encodeURIComponent(locale)}`}
                          className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium text-[var(--primary)] hover:bg-slate-100 hover:text-[var(--primary-hover)]"
                        >
                          {t.pdf}
                        </Link>
                        <Link
                          href={`/api/teacher/variants/${variant.id}/answers-pdf?locale=${encodeURIComponent(locale)}`}
                          className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium text-[var(--primary)] hover:bg-slate-100 hover:text-[var(--primary-hover)]"
                        >
                          {t.answersPdf}
                        </Link>
                      </div>
                    </div>
                  </SurfaceCard>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
