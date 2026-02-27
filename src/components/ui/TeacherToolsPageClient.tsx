"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";

import { SurfaceCard } from "@/src/components/ui/SurfaceCard";
import { TeacherErrorState, type TeacherApiError } from "@/src/components/ui/TeacherErrorState";
import { listContentTopicConfigs } from "@/src/lib/content/topic-registry";
import { formatDateTime, formatNumber } from "@/src/lib/i18n/format";
import { topicCatalogEntries, type TopicDomain } from "@/src/lib/topicMeta";
import type { PrintLayoutMode } from "@/src/lib/variants/print-layout";
import {
  recommendPrintLayout,
  type PrintRecommendationReasonCode,
  type WorkType,
} from "@/src/lib/variants/print-recommendation";

type Locale = "ru" | "en" | "de";

type TopicSkill = {
  id: string;
  title: string;
  summary?: string;
  example?: string;
  cardHref?: string;
  availableCount?: number;
  status?: "ready" | "soon";
};

type TopicPayload = {
  topicId: string;
  title: Record<Locale, string>;
  skills: TopicSkill[];
};

type GeneratedVariant = {
  id: string;
  title: string;
  createdAt: string;
  tasksCount: number;
};

type RecentWork = {
  id: string;
  topicId: string;
  title: string;
  workType: WorkType | string;
  createdAt: string;
  variantsCount: number;
  printProfileJson?: unknown;
};

type GenerateResponse = {
  ok?: boolean;
  workId?: string;
  variants?: GeneratedVariant[];
  code?: string;
  message?: string;
  details?: unknown;
};

type Props = { locale: Locale };

const copy = {
  ru: {
    title: "Конструктор вариантов по навыкам",
    subtitle:
      "Выберите тему, задайте состав по навыкам, соберите несколько вариантов. Печать и ответы доступны сразу.",
    topic: "Тема",
    grade: "Класс",
    section: "Раздел",
    selectedTopics: "Выбрано тем",
    composition: "Состав варианта",
    quantity: "Количество задач",
    available: "Доступно задач",
    example: "Пример",
    skillCard: "Карточка навыка",
    clearAll: "Очистить всё",
    keepCurrentTopic: "Оставить только текущую тему",
    variantsCount: "Сколько вариантов",
    workTypeHint: "Используется для названия и истории. На состав задач не влияет.",
    shuffle: "Перемешать порядок задач",
    build: "Собрать варианты",
    total: "Всего задач в варианте",
    bySkills: "Распределение по навыкам",
    note: "Можно попробовать без регистрации. Войти нужно только для сохранения истории в teacher-кабинете.",
    resultTitle: "Собранные варианты",
    resultNextStep: "Следующий шаг: откройте страницу работы, чтобы выбрать оформление, печать и PDF.",
    recentWorksTitle: "Последние работы",
    noRecentWorks: "Пока нет сохранённых работ.",
    openWork: "Открыть работу",
    workType: "Тип работы",
    printLayout: "Оформление",
    printLayoutSingle: "1 вариант/стр",
    printLayoutTwo: "2 варианта/стр (альбомная)",
    recommendation: "Рекомендация",
    recommendationPrefix: "Рекомендуем",
    recommendationNone: "Соберите варианты, чтобы получить рекомендацию по оформлению.",
    recommendationReasons: {
      LONG_VARIANT: "есть длинные варианты",
      HEAVY_VARIANT: "много задач в варианте",
      TEST_DEFAULT: "для контрольной обычно удобнее 1 вариант на страницу",
      HOMEWORK_DEFAULT: "для ДЗ обычно удобнее 1 вариант на страницу",
      LIGHT_VARIANTS: "варианты короткие и обычно хорошо помещаются",
    } satisfies Record<PrintRecommendationReasonCode, string>,
    workTypes: {
      lesson: "Работа на уроке",
      quiz: "Самостоятельная",
      homework: "Домашняя работа",
      test: "Контрольная",
    } satisfies Record<WorkType, string>,
    domains: {
      arithmetic: "Арифметика",
      algebra: "Алгебра",
      geometry: "Геометрия",
      data: "Данные",
    } satisfies Record<TopicDomain, string>,
    printAll: "Печать всех",
    pdfAll: "PDF всех",
    open: "Открыть",
    print: "Печать",
    answers: "Ответы",
    pdf: "PDF",
    answersPdf: "Ответы PDF",
    noSkills: "Для выбранной темы пока нет настроенных навыков конструктора.",
    loadingSkills: "Загружаем навыки темы...",
    loginHint: "Войти, чтобы сохранять варианты и историю",
  },
  en: {
    title: "Skill-based Variant Builder",
    subtitle:
      "Choose a topic, set the composition by skills, and assemble multiple variants. Print and answers are available immediately.",
    topic: "Topic",
    grade: "Grade",
    section: "Section",
    selectedTopics: "Selected topics",
    composition: "Variant composition",
    quantity: "Task count",
    available: "Available tasks",
    example: "Example",
    skillCard: "Skill card",
    clearAll: "Clear all",
    keepCurrentTopic: "Keep current topic only",
    variantsCount: "Number of variants",
    workTypeHint: "Used for naming and history. Does not affect task composition.",
    shuffle: "Shuffle task order",
    build: "Assemble variants",
    total: "Total tasks per variant",
    bySkills: "Distribution by skills",
    note: "You can try it without registration. Sign-in is only needed to save history in the teacher workspace.",
    resultTitle: "Generated variants",
    resultNextStep: "Next step: open the work page to choose layout, print and PDF.",
    recentWorksTitle: "Recent works",
    noRecentWorks: "No saved works yet.",
    openWork: "Open work",
    workType: "Work type",
    printLayout: "Print layout",
    printLayoutSingle: "1 variant/page",
    printLayoutTwo: "2 variants/page (landscape)",
    recommendation: "Recommendation",
    recommendationPrefix: "Recommended",
    recommendationNone: "Generate variants to get a layout recommendation.",
    recommendationReasons: {
      LONG_VARIANT: "variants are long",
      HEAVY_VARIANT: "many tasks per variant",
      TEST_DEFAULT: "tests are usually easier to print as 1 variant per page",
      HOMEWORK_DEFAULT: "homework is usually easier to print as 1 variant per page",
      LIGHT_VARIANTS: "variants are short and usually fit well",
    } satisfies Record<PrintRecommendationReasonCode, string>,
    workTypes: {
      lesson: "Lesson work",
      quiz: "Quiz",
      homework: "Homework",
      test: "Test",
    } satisfies Record<WorkType, string>,
    domains: {
      arithmetic: "Arithmetic",
      algebra: "Algebra",
      geometry: "Geometry",
      data: "Data",
    } satisfies Record<TopicDomain, string>,
    printAll: "Print all",
    pdfAll: "PDF all",
    open: "Open",
    print: "Print",
    answers: "Answers",
    pdf: "PDF",
    answersPdf: "Answers PDF",
    noSkills: "No constructor skills configured for this topic yet.",
    loadingSkills: "Loading topic skills...",
    loginHint: "Sign in to save variants and history",
  },
  de: {
    title: "Varianten-Baukasten nach Fähigkeiten",
    subtitle:
      "Thema wählen, Zusammensetzung nach Fähigkeiten festlegen und mehrere Varianten zusammenstellen. Druck und Lösungen sind sofort verfügbar.",
    topic: "Thema",
    grade: "Klasse",
    section: "Bereich",
    selectedTopics: "Ausgewählte Themen",
    composition: "Zusammensetzung",
    quantity: "Anzahl Aufgaben",
    available: "Verfügbare Aufgaben",
    example: "Beispiel",
    skillCard: "Skill-Karte",
    clearAll: "Alles löschen",
    keepCurrentTopic: "Nur aktuelles Thema behalten",
    variantsCount: "Anzahl Varianten",
    workTypeHint: "Nur für Titel und Verlauf. Beeinflusst die Aufgabenzusammensetzung nicht.",
    shuffle: "Reihenfolge mischen",
    build: "Varianten zusammenstellen",
    total: "Gesamtaufgaben pro Variante",
    bySkills: "Verteilung nach Fähigkeiten",
    note: "Ohne Registrierung testbar. Anmeldung ist nur zum Speichern im Lehrkräfte-Bereich nötig.",
    resultTitle: "Erstellte Varianten",
    resultNextStep: "Nächster Schritt: Öffnen Sie die Arbeitsseite für Layout, Druck und PDF.",
    recentWorksTitle: "Letzte Arbeiten",
    noRecentWorks: "Noch keine gespeicherten Arbeiten.",
    openWork: "Arbeit öffnen",
    workType: "Art der Arbeit",
    printLayout: "Layout",
    printLayoutSingle: "1 Variante/Seite",
    printLayoutTwo: "2 Varianten/Seite (Querformat)",
    recommendation: "Empfehlung",
    recommendationPrefix: "Empfohlen",
    recommendationNone: "Erstellen Sie Varianten, um eine Layout-Empfehlung zu erhalten.",
    recommendationReasons: {
      LONG_VARIANT: "Varianten sind lang",
      HEAVY_VARIANT: "viele Aufgaben pro Variante",
      TEST_DEFAULT: "Für Klassenarbeiten ist meist 1 Variante pro Seite besser",
      HOMEWORK_DEFAULT: "Für Hausaufgaben ist meist 1 Variante pro Seite besser",
      LIGHT_VARIANTS: "Varianten sind kurz und passen meist gut",
    } satisfies Record<PrintRecommendationReasonCode, string>,
    workTypes: {
      lesson: "Unterricht",
      quiz: "Kurztest",
      homework: "Hausaufgabe",
      test: "Klassenarbeit",
    } satisfies Record<WorkType, string>,
    domains: {
      arithmetic: "Arithmetik",
      algebra: "Algebra",
      geometry: "Geometrie",
      data: "Daten",
    } satisfies Record<TopicDomain, string>,
    printAll: "Alle drucken",
    pdfAll: "Alle als PDF",
    open: "Öffnen",
    print: "Drucken",
    answers: "Lösungen",
    pdf: "PDF",
    answersPdf: "Lösungen PDF",
    noSkills: "Für dieses Thema sind noch keine Baukasten-Fähigkeiten konfiguriert.",
    loadingSkills: "Themenfähigkeiten werden geladen...",
    loginHint: "Anmelden, um Varianten und Verlauf zu speichern",
  },
} as const;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function parseTeacherError(payload: unknown, fallback: string): TeacherApiError {
  if (!payload || typeof payload !== "object") return { message: fallback };
  const data = payload as { code?: unknown; message?: unknown; details?: unknown };
  return {
    code: typeof data.code === "string" ? data.code : undefined,
    message: typeof data.message === "string" ? data.message : fallback,
    details: data.details,
  };
}

function parseCountsFromQuery(values: string[]) {
  const parsed: Record<string, number> = {};
  for (const item of values) {
    const sepIndex = item.lastIndexOf(":");
    if (sepIndex <= 0) continue;
    const skillId = item.slice(0, sepIndex);
    const rawCount = item.slice(sepIndex + 1);
    const count = Number(rawCount);
    if (!Number.isFinite(count)) continue;
    parsed[skillId] = clamp(Math.trunc(count), 0, 30);
  }
  return parsed;
}

function buildTeacherToolsStateQuery(params: {
  topicId: string;
  selectedTopicIds: string[];
  totalTasks: number;
  variantsCount: number;
  workType: WorkType;
  shuffleOrder: boolean;
  selectedGrade: number;
  selectedDomain: TopicDomain;
  counts: Record<string, number>;
}) {
  const query = new URLSearchParams();
  query.set("topicId", params.topicId);
  if (params.selectedTopicIds.length > 0) {
    query.set("topics", params.selectedTopicIds.join(","));
  }
  query.set("tasks", String(params.totalTasks));
  query.set("variants", String(params.variantsCount));
  query.set("workType", params.workType);
  query.set("shuffle", params.shuffleOrder ? "1" : "0");
  query.set("grade", String(params.selectedGrade));
  query.set("domain", params.selectedDomain);
  for (const [skillId, count] of Object.entries(params.counts)) {
    if (!Number.isFinite(count) || count <= 0) continue;
    query.append("c", `${skillId}:${Math.trunc(count)}`);
  }
  return query;
}

export function TeacherToolsPageClient({ locale }: Props) {
  const t = copy[locale];
  const params = useSearchParams();
  const router = useRouter();
  const topicConfigs = useMemo(() => listContentTopicConfigs(), []);

  const allTopics = useMemo(
    () =>
      topicConfigs.map((cfg) => ({
        topicId: cfg.topicSlug.includes(".") ? cfg.topicSlug : `g5.${cfg.topicSlug}`,
        title: cfg.titles?.[locale] ?? cfg.titles?.ru ?? cfg.topicSlug,
        meta: topicCatalogEntries.find((entry) =>
          entry.id === (cfg.topicSlug.includes(".") ? cfg.topicSlug : `g5.${cfg.topicSlug}`),
        ) ?? null,
      })),
    [locale, topicConfigs],
  );

  const initialTopicId = params.get("topicId") ?? allTopics[0]?.topicId ?? "g5.proporcii";
  const initialTopicsParam = params.get("topics");
  const initialSelectedTopicIds = Array.from(
    new Set(
      (initialTopicsParam ? initialTopicsParam.split(",") : [initialTopicId])
        .map((item) => item.trim())
        .filter((item) => item.length > 0),
    ),
  );
  const initialCountsFromQuery = parseCountsFromQuery(params.getAll("c"));
  const hasInitialCountsFromQuery = Object.keys(initialCountsFromQuery).length > 0;
  const initialTopicMeta = allTopics.find((item) => item.topicId === initialTopicId)?.meta;

  const [topicId, setTopicId] = useState(initialTopicId);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>(
    initialSelectedTopicIds.length > 0 ? initialSelectedTopicIds : [initialTopicId],
  );
  const [selectedGrade, setSelectedGrade] = useState<number>(initialTopicMeta?.levels?.[0] ?? 5);
  const [selectedDomain, setSelectedDomain] = useState<TopicDomain>(
    initialTopicMeta?.domain ?? allTopics[0]?.meta?.domain ?? "arithmetic",
  );
  const [variantsCount, setVariantsCount] = useState(1);
  const [workType, setWorkType] = useState<WorkType>("quiz");
  const [shuffleOrder, setShuffleOrder] = useState(true);
  const [printLayout, setPrintLayout] = useState<PrintLayoutMode>("single");
  const [topic, setTopic] = useState<TopicPayload | null>(null);
  const [loadedTopics, setLoadedTopics] = useState<TopicPayload[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const initialCountsRef = useRef<Record<string, number> | null>(
    hasInitialCountsFromQuery ? initialCountsFromQuery : null,
  );
  const [loadingTopic, setLoadingTopic] = useState(false);
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState<TeacherApiError | null>(null);
  const [results, setResults] = useState<GeneratedVariant[]>([]);
  const [workId, setWorkId] = useState<string | null>(null);
  const [recentWorks, setRecentWorks] = useState<RecentWork[]>([]);
  const [loadingRecentWorks, setLoadingRecentWorks] = useState(false);
  const [highlightResultsPanel, setHighlightResultsPanel] = useState(false);
  const [resultsFocusTick, setResultsFocusTick] = useState(0);
  const resultsActionCardRef = useRef<HTMLDivElement | null>(null);

  const gradeOptions = useMemo(
    () =>
      Array.from(
        new Set(
          allTopics.flatMap((topic) => topic.meta?.levels ?? []),
        ),
      ).sort((a, b) => a - b),
    [allTopics],
  );

  const domainOptions = useMemo(
    () =>
      Array.from(
        new Set(
          allTopics
            .filter((topic) => (topic.meta?.levels ?? []).includes(selectedGrade))
            .map((topic) => topic.meta?.domain)
            .filter((domain): domain is TopicDomain => Boolean(domain)),
        ),
      ),
    [allTopics, selectedGrade],
  );

  const topics = useMemo(
    () =>
      allTopics.filter((topic) => {
        const levels = topic.meta?.levels ?? [];
        const domain = topic.meta?.domain;
        return levels.includes(selectedGrade) && domain === selectedDomain;
      }),
    [allTopics, selectedDomain, selectedGrade],
  );

  const topicsForGrade = useMemo(
    () =>
      allTopics.filter((topic) => {
        const levels = topic.meta?.levels ?? [];
        return levels.includes(selectedGrade);
      }),
    [allTopics, selectedGrade],
  );

  const orderedSelectedTopicIds = useMemo(() => {
    if (selectedTopicIds.length === 0) return [topicId];
    const unique = Array.from(new Set(selectedTopicIds));
    if (!unique.includes(topicId)) return [topicId, ...unique];
    return [topicId, ...unique.filter((id) => id !== topicId)];
  }, [selectedTopicIds, topicId]);

  useEffect(() => {
    if (domainOptions.length === 0) return;
    if (!domainOptions.includes(selectedDomain)) {
      setSelectedDomain(domainOptions[0]!);
    }
  }, [domainOptions, selectedDomain]);

  useEffect(() => {
    if (topics.length === 0) return;
    if (!topics.some((item) => item.topicId === topicId)) {
      setTopicId(topics[0]!.topicId);
    }
    setSelectedTopicIds((prev) => {
      const allowedIds = new Set(topicsForGrade.map((item) => item.topicId));
      const next = prev.filter((item) => allowedIds.has(item));
      const fallback = next.length > 0 ? next : [topicsForGrade[0]?.topicId ?? topics[0]!.topicId];
      if (
        fallback.length === prev.length &&
        fallback.every((item, index) => item === prev[index])
      ) {
        return prev;
      }
      return fallback;
    });
  }, [topicId, topics, topicsForGrade]);

  async function loadRecentWorks() {
    setLoadingRecentWorks(true);
    try {
      const response = await fetch("/api/teacher/demo/works", {
        credentials: "same-origin",
        cache: "no-store",
      });
      const payload = (await response.json()) as { ok?: boolean; works?: RecentWork[] };
      if (!response.ok || !payload.ok || !Array.isArray(payload.works)) {
        return;
      }
      setRecentWorks(payload.works);
    } catch {
      // Non-blocking. Constructor should still work if recent works list fails.
    } finally {
      setLoadingRecentWorks(false);
    }
  }

  useEffect(() => {
    void loadRecentWorks();
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadTopic() {
      setLoadingTopic(true);
      setError(null);
      try {
        const responses = await Promise.all(
          orderedSelectedTopicIds.map(async (selectedTopicId) => {
            const response = await fetch(`/api/teacher/demo/topic?topicId=${encodeURIComponent(selectedTopicId)}`);
            const payload = (await response.json()) as { ok?: boolean; topic?: TopicPayload };
            return { response, payload };
          }),
        );

        const hasError = responses.some(({ response, payload }) => !response.ok || !payload.ok || !payload.topic);
        if (hasError) {
          if (!cancelled) {
            const firstError = responses.find(({ response, payload }) => !response.ok || !payload.ok || !payload.topic);
            setTopic(null);
            setLoadedTopics([]);
            setError(parseTeacherError(firstError?.payload, "Не удалось загрузить навыки темы."));
          }
          return;
        }
        if (!cancelled) {
          const fetchedTopics = responses
            .map(({ payload }) => payload.topic)
            .filter((item): item is TopicPayload => Boolean(item));
          setLoadedTopics(fetchedTopics);
          const allSkills = fetchedTopics.flatMap((item) => item.skills);
          setTopic({
            topicId: orderedSelectedTopicIds[0] ?? topicId,
            title:
              fetchedTopics.length === 1
                ? fetchedTopics[0]!.title
                : ({
                    ru: "Несколько тем",
                    en: "Multiple topics",
                    de: "Mehrere Themen",
                  } as Record<Locale, string>),
            skills: allSkills,
          });
          if (initialCountsRef.current) {
            const restoredCounts: Record<string, number> = {};
            for (const skill of allSkills) {
              restoredCounts[skill.id] = clamp(initialCountsRef.current[skill.id] ?? 0, 0, 30);
            }
            setCounts(restoredCounts);
            initialCountsRef.current = null;
          } else {
            setCounts((prev) => {
              const next: Record<string, number> = { ...prev };
              for (const skill of allSkills) {
                if (!Number.isFinite(next[skill.id])) {
                  next[skill.id] = 0;
                }
              }
              return next;
            });
          }
        }
      } catch {
        if (!cancelled) setError({ message: "Ошибка сети при загрузке навыков темы." });
      } finally {
        if (!cancelled) setLoadingTopic(false);
      }
    }
    void loadTopic();
    return () => {
      cancelled = true;
    };
  }, [topicId, orderedSelectedTopicIds]);

  const summary = useMemo(() => {
    const skills = topic?.skills ?? [];
    const selected = skills
      .map((skill) => ({ skill, count: counts[skill.id] ?? 0 }))
      .filter((item) => item.count > 0);
    const total = selected.reduce((sum, item) => sum + item.count, 0);
    return { selected, total };
  }, [topic, counts]);

  const skillTopicById = useMemo(() => {
    const map = new Map<string, { topicId: string; topicTitle: string }>();
    for (const loadedTopic of loadedTopics) {
      const title = loadedTopic.title[locale] ?? loadedTopic.title.ru ?? loadedTopic.topicId;
      for (const skill of loadedTopic.skills) {
        map.set(skill.id, { topicId: loadedTopic.topicId, topicTitle: title });
      }
    }
    return map;
  }, [loadedTopics, locale]);

  const topicContext = useMemo(() => {
    const primaryTopicId = selectedTopicIds[0] ?? topicId;
    const meta = topicCatalogEntries.find((entry) => entry.id === primaryTopicId);
    const level = meta?.levels?.[0] ?? (topicId.startsWith("g5.") ? 5 : null);
    const domain = meta?.domain ?? null;
    const title =
      selectedTopicIds.length > 1
        ? locale === "de"
          ? "Mehrere Themen"
          : locale === "en"
            ? "Multiple topics"
            : "Несколько тем"
        : topic?.title?.[locale] ??
          topic?.title?.ru ??
          allTopics.find((item) => item.topicId === primaryTopicId)?.title ??
          primaryTopicId;
    return { level, domain, title };
  }, [allTopics, locale, selectedTopicIds, topic, topicId]);

  const layoutRecommendation = useMemo(() => {
    const variantTaskCounts =
      results.length > 0
        ? results.map((variant) => variant.tasksCount)
        : summary.total > 0 && variantsCount > 0
          ? Array.from({ length: variantsCount }, () => summary.total)
          : [];
    if (variantTaskCounts.length === 0) return null;
    // Work type is now configured on the Work page; use a stable default here.
    return recommendPrintLayout({ workType: "quiz", variantTaskCounts });
  }, [results, summary.total, variantsCount]);

  useEffect(() => {
    if (!layoutRecommendation) return;
    setPrintLayout((prev) => (prev === layoutRecommendation.recommendedLayout ? prev : layoutRecommendation.recommendedLayout));
  }, [layoutRecommendation]);

  useEffect(() => {
    if (resultsFocusTick === 0) return;

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const scrollTimer = window.setTimeout(() => {
      const node = resultsActionCardRef.current;
      if (!node) return;
      const topOffset = 180;
      const targetTop = Math.max(0, window.scrollY + node.getBoundingClientRect().top - topOffset);
      window.scrollTo({
        top: targetTop,
        behavior: reduceMotion ? "auto" : "smooth",
      });
      setHighlightResultsPanel(true);
    }, 0);

    const clearHighlightTimer = window.setTimeout(() => {
      setHighlightResultsPanel(false);
    }, reduceMotion ? 800 : 1600);

    return () => {
      window.clearTimeout(scrollTimer);
      window.clearTimeout(clearHighlightTimer);
    };
  }, [resultsFocusTick]);

  async function handleBuild() {
    setBuilding(true);
    setError(null);
    try {
      const response = await fetch("/api/teacher/demo/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          topicId: selectedTopicIds[0] ?? topicId,
          topics: selectedTopicIds,
          variantsCount,
          workType,
          printLayout,
          shuffleOrder,
          plan: Object.entries(counts)
            .filter(([skillId, count]) => count > 0 && skillTopicById.has(skillId))
            .map(([skillId, count]) => ({
              topicId: skillTopicById.get(skillId)?.topicId,
              skillId,
              count,
            })),
        }),
      });
      const payload = (await response.json()) as GenerateResponse;
      if (!response.ok || !payload.ok || !payload.variants) {
        setError(parseTeacherError(payload, "Не удалось собрать варианты."));
        return;
      }
      setWorkId(typeof payload.workId === "string" ? payload.workId : null);
      setResults(payload.variants);
      setResultsFocusTick((v) => v + 1);
      void loadRecentWorks();
    } catch {
      setError({ message: "Ошибка сети при сборке вариантов." });
    } finally {
      setBuilding(false);
    }
  }

  function buildSkillCardHref(cardHref: string) {
    const query = buildTeacherToolsStateQuery({
      topicId,
      selectedTopicIds,
      totalTasks: summary.total,
      variantsCount,
      workType,
      shuffleOrder,
      selectedGrade,
      selectedDomain,
      counts,
    });
    return `/${locale}${cardHref}?${query.toString()}`;
  }

  useEffect(() => {
    const query = buildTeacherToolsStateQuery({
      topicId,
      selectedTopicIds,
      totalTasks: summary.total,
      variantsCount,
      workType,
      shuffleOrder,
      selectedGrade,
      selectedDomain,
      counts,
    });
    router.replace(`/${locale}/teacher-tools?${query.toString()}`, { scroll: false });
  }, [router, locale, topicId, selectedTopicIds, summary.total, variantsCount, workType, shuffleOrder, selectedGrade, selectedDomain, counts]);

  return (
    <main className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
          Teacher tools
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{t.title}</h1>
        <p className="mt-3 max-w-4xl text-base leading-7 text-slate-600">{t.subtitle}</p>
      </section>

      {error ? <TeacherErrorState error={error} locale={locale} /> : null}

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <SurfaceCard className="p-6">
          <div className="mb-4 flex flex-wrap gap-2">
            {gradeOptions.map((grade) => (
              <button
                key={grade}
                type="button"
                onClick={() => setSelectedGrade(grade)}
                className={[
                  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
                  selectedGrade === grade
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100",
                ].join(" ")}
              >
                {t.grade}: {formatNumber(locale, grade)}
              </button>
            ))}
            {domainOptions.map((domain) => (
              <button
                key={domain}
                type="button"
                onClick={() => setSelectedDomain(domain)}
                className={[
                  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
                  selectedDomain === domain
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100",
                ].join(" ")}
              >
                {t.section}: {t.domains[domain]}
              </button>
            ))}
            <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {t.topic}: {topicContext.title}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t.topic}
              </span>
              <div className="space-y-2">
                <select
                  value={topicId}
                  onChange={(e) => {
                    const nextTopicId = e.target.value;
                    setTopicId(nextTopicId);
                    setSelectedTopicIds([nextTopicId]);
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                >
                  {topics.map((item) => (
                    <option key={item.topicId} value={item.topicId}>
                      {item.title}
                    </option>
                  ))}
                </select>
                <div className="flex flex-wrap gap-2">
                  {topics.map((item) => {
                    const selected = selectedTopicIds.includes(item.topicId);
                    return (
                      <button
                        key={item.topicId}
                        type="button"
                        onClick={() =>
                          setSelectedTopicIds((prev) => {
                            const exists = prev.includes(item.topicId);
                            if (exists) {
                              if (prev.length <= 1) return prev;
                              return prev.filter((id) => id !== item.topicId);
                            }
                            return [...prev, item.topicId];
                          })
                        }
                        className={[
                          "rounded-full border px-3 py-1 text-xs font-semibold",
                          selected
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100",
                        ].join(" ")}
                      >
                        {item.title}
                      </button>
                    );
                  })}
                </div>
                {selectedTopicIds.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {t.selectedTopics}:
                    </span>
                    {selectedTopicIds.map((selectedId) => {
                      const selectedTopic = allTopics.find((item) => item.topicId === selectedId);
                      const label = selectedTopic?.title ?? selectedId;
                      return (
                        <button
                          key={selectedId}
                          type="button"
                          onClick={() =>
                            setSelectedTopicIds((prev) => {
                              if (prev.length <= 1) return prev;
                              return prev.filter((item) => item !== selectedId);
                            })
                          }
                          className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
                          title={label}
                        >
                          {label}
                          <span aria-hidden="true">×</span>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </label>

            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t.composition}
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setCounts((prev) => {
                      const next: Record<string, number> = {};
                      for (const key of Object.keys(prev)) {
                        next[key] = 0;
                      }
                      return next;
                    })
                  }
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
                >
                  {t.clearAll}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTopicIds([topicId])}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
                >
                  {t.keepCurrentTopic}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t.workType}
              </span>
              <select
                value={workType}
                onChange={(e) => setWorkType(e.target.value as WorkType)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 sm:max-w-xs"
              >
                {(Object.keys(t.workTypes) as WorkType[]).map((type) => (
                  <option key={type} value={type}>
                    {t.workTypes[type]}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500">{t.workTypeHint}</p>
            </label>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-slate-950">{t.composition}</h2>
              {loadingTopic ? <span className="text-xs text-slate-500">{t.loadingSkills}</span> : null}
            </div>
            {loadedTopics.length > 0 ? (
              <div className="space-y-3">
                {loadedTopics.map((loadedTopic) => (
                  <div key={loadedTopic.topicId} className="space-y-3">
                    {selectedTopicIds.length > 1 ? (
                      <p className="text-sm font-semibold text-slate-900">
                        {loadedTopic.title[locale] ?? loadedTopic.title.ru ?? loadedTopic.topicId}
                      </p>
                    ) : null}
                    {loadedTopic.skills.map((skill) => {
                      const value = counts[skill.id] ?? 0;
                      const disabled = skill.status === "soon";
                      return (
                        <div
                          key={skill.id}
                          className={[
                            "rounded-xl border p-3",
                            disabled ? "border-slate-200 bg-slate-50 opacity-70" : "border-slate-200 bg-white",
                          ].join(" ")}
                        >
                          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="min-w-0">
                              <p className="font-medium text-slate-950">{skill.title}</p>
                              {skill.summary ? (
                                <p className="mt-1 text-sm leading-5 text-slate-600">{skill.summary}</p>
                              ) : null}
                              {skill.example ? (
                                <p className="mt-1 text-sm leading-5 text-slate-700">
                                  <span className="font-medium text-slate-900">{t.example}:</span>{" "}
                                  {skill.example}
                                </p>
                              ) : null}
                              {skill.cardHref ? (
                                <div className="mt-2">
                                  <Link
                                    href={buildSkillCardHref(skill.cardHref)}
                                    className="text-sm font-medium text-blue-700 hover:text-blue-900"
                                  >
                                    {t.skillCard}
                                  </Link>
                                </div>
                              ) : null}
                              <p className="mt-1 text-xs text-slate-500">
                                {t.available}: {formatNumber(locale, skill.availableCount ?? 0)}
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <button
                                type="button"
                                disabled={disabled}
                                onClick={() =>
                                  setCounts((prev) => ({
                                    ...prev,
                                    [skill.id]: clamp((prev[skill.id] ?? 0) - 1, 0, 30),
                                  }))
                                }
                                className="h-8 w-8 rounded-lg border border-slate-300 text-sm text-slate-800 disabled:opacity-40"
                              >
                                -
                              </button>
                              <input
                                aria-label={`${t.quantity}: ${skill.title}`}
                                type="number"
                                min={0}
                                max={30}
                                disabled={disabled}
                                value={value}
                                onChange={(e) =>
                                  setCounts((prev) => ({
                                    ...prev,
                                    [skill.id]: clamp(Number(e.target.value || 0), 0, 30),
                                  }))
                                }
                                className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-center text-sm"
                              />
                              <button
                                type="button"
                                disabled={disabled}
                                onClick={() =>
                                  setCounts((prev) => ({
                                    ...prev,
                                    [skill.id]: clamp((prev[skill.id] ?? 0) + 1, 0, 30),
                                  }))
                                }
                                className="h-8 w-8 rounded-lg border border-slate-300 text-sm text-slate-800 disabled:opacity-40"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                {t.noSkills}
              </div>
            )}
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t.variantsCount}
              </span>
              <input
                type="number"
                min={1}
                max={6}
                value={variantsCount}
                onChange={(e) => setVariantsCount(clamp(Number(e.target.value || 1), 1, 6))}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 sm:w-32"
              />
            </label>
            <button
              type="button"
              onClick={handleBuild}
              disabled={building || loadingTopic || summary.total < 1}
              className="inline-flex items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {building ? `${t.build}...` : t.build}
            </button>
          </div>

          <label className="mt-4 inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={shuffleOrder}
              onChange={(e) => setShuffleOrder(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            {t.shuffle}
          </label>

          <p className="mt-4 text-xs leading-5 text-slate-500">{t.note}</p>
        </SurfaceCard>

        <SurfaceCard className="p-6">
          <h2 className="text-lg font-semibold text-slate-950">{t.total}</h2>
          <p className="mt-2 text-2xl font-bold text-slate-950">{formatNumber(locale, summary.total)}</p>
          <h3 className="mt-5 text-sm font-semibold uppercase tracking-wide text-slate-500">
            {t.bySkills}
          </h3>
          <ul className="mt-3 space-y-2">
            {summary.selected.length > 0 ? (
              summary.selected.map(({ skill, count }) => (
                <li key={skill.id} className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <span className="min-w-0 text-sm text-slate-700">
                    {selectedTopicIds.length > 1
                      ? `${skillTopicById.get(skill.id)?.topicTitle ?? ""}: ${skill.title}`
                      : skill.title}
                  </span>
                  <span className="shrink-0 text-sm font-medium text-slate-900">{count}</span>
                </li>
              ))
            ) : (
              <li className="text-sm text-slate-500">—</li>
            )}
          </ul>
          <p className="mt-5 text-xs text-slate-500">{t.loginHint}</p>
        </SurfaceCard>
      </section>

      <section className="space-y-3">
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{t.resultTitle}</h2>
          <SurfaceCard
            ref={resultsActionCardRef}
            className={[
              "p-4 transition-colors duration-700",
              highlightResultsPanel ? "bg-blue-50/70 ring-2 ring-blue-200" : "",
            ].join(" ")}
          >
            <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t.printLayout}
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setPrintLayout("single")}
                    className={[
                      "rounded-lg border px-3 py-2 text-sm font-medium",
                      printLayout === "single"
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-300 bg-white text-slate-900 hover:bg-slate-100",
                    ].join(" ")}
                  >
                    {t.printLayoutSingle}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintLayout("two")}
                    className={[
                      "rounded-lg border px-3 py-2 text-sm font-medium",
                      printLayout === "two"
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-300 bg-white text-slate-900 hover:bg-slate-100",
                    ].join(" ")}
                  >
                    {t.printLayoutTwo}
                  </button>
                </div>
              </div>

              <div className="lg:justify-self-end">
                {workId ? (
                  <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-2 shadow-sm">
                    <p className="px-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                      {locale === "de" ? "Nächster Schritt" : locale === "en" ? "Next step" : "Следующий шаг"}
                    </p>
                    <Link
                      href={`/${locale}/teacher-tools/works/${workId}`}
                      className="mt-1 inline-flex items-center rounded-lg border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    >
                      {t.openWork}
                    </Link>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t.recommendation}
              </p>
              {layoutRecommendation ? (
                <p className="mt-1 text-sm text-slate-700">
                  <span className="font-medium text-slate-900">
                    {t.recommendationPrefix}:{" "}
                    {layoutRecommendation.recommendedLayout === "two"
                      ? t.printLayoutTwo
                      : t.printLayoutSingle}
                    .
                  </span>
                  {layoutRecommendation.reasonCodes.length > 0 ? " " : null}
                  {layoutRecommendation.reasonCodes.length > 0
                    ? layoutRecommendation.reasonCodes.map((code) => t.recommendationReasons[code]).join("; ")
                    : null}
                </p>
              ) : (
                <p className="mt-1 text-sm text-slate-600">{t.recommendationNone}</p>
              )}
            </div>
            <p className="mt-3 text-sm font-medium text-slate-700">{t.resultNextStep}</p>
          </SurfaceCard>
        </div>

        <SurfaceCard className="p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-slate-950">{t.recentWorksTitle}</h3>
            {loadingRecentWorks ? <span className="text-xs text-slate-500">{t.loadingSkills}</span> : null}
          </div>
          {recentWorks.length === 0 ? (
            <p className="mt-2 text-sm text-slate-600">{t.noRecentWorks}</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {recentWorks.map((work) => (
                <li
                  key={work.id}
                  className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{work.title}</p>
                    <p className="mt-0.5 text-xs text-slate-600">
                      {formatDateTime(locale, work.createdAt)} • {formatNumber(locale, work.variantsCount)}{" "}
                      {locale === "de" ? "Varianten" : locale === "en" ? "variants" : "вариантов"}
                    </p>
                  </div>
                  <Link
                    href={`/${locale}/teacher-tools/works/${work.id}`}
                    className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
                  >
                    {t.openWork}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SurfaceCard>

        {results.length === 0 ? (
          <SurfaceCard className="p-4">
            <p className="text-sm text-slate-600">—</p>
          </SurfaceCard>
        ) : (
          <div className="space-y-3">
            {results.map((variant) => (
              <SurfaceCard key={variant.id} className="p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-950">{variant.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {formatDateTime(locale, variant.createdAt)} • {formatNumber(locale, variant.tasksCount)} задач
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/${locale}/teacher-tools/variants/${variant.id}`} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100">
                      {t.open}
                    </Link>
                  </div>
                </div>
              </SurfaceCard>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
