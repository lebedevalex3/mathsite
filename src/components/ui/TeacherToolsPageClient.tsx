"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";

import { SurfaceCard } from "@/src/components/ui/SurfaceCard";
import { TeacherErrorState, type TeacherApiError } from "@/src/components/ui/TeacherErrorState";
import { listContentTopicConfigs } from "@/src/lib/content/topic-registry";
import { formatDateTime, formatNumber } from "@/src/lib/i18n/format";
import { getTopicDomains, topicCatalogEntries, type TopicDomain } from "@/src/lib/topicMeta";
import { type WorkType } from "@/src/lib/variants/print-recommendation";

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

type GenerateResponse = {
  ok?: boolean;
  workId?: string;
  code?: string;
  message?: string;
  details?: unknown;
};

type HistoryWork = {
  id: string;
  topicId: string;
  title: string;
  workType: WorkType;
  printProfileJson: unknown;
  createdAt: string;
  variantsCount: number;
};

type Props = { locale: Locale };
type GradeFilter = number | "all";
type SelectedDomainFilter = TopicDomain | "all";

const copy = {
  ru: {
    title: "Конструктор вариантов по навыкам",
    subtitle:
      "Выберите тему, задайте состав по навыкам, соберите несколько вариантов. Печать и ответы доступны сразу.",
    topics: "Темы",
    topicsPlaceholder: "Выберите темы...",
    topicsHelper: "Темы определяют, какие навыки доступны ниже.",
    topicsSearch: "Поиск тем...",
    topicsNotFound: "Темы не найдены",
    grade: "Класс",
    section: "Раздел",
    allSections: "Все",
    selectedTopics: "Выбрано тем",
    selectedShort: "выбрано",
    skillsShort: "навыков",
    expandTopic: "Развернуть тему",
    collapseTopic: "Свернуть тему",
    allGrades: "Все классы",
    composition: "Состав варианта",
    quantity: "Количество задач",
    available: "Доступно задач",
    example: "Пример",
    skillCard: "Карточка навыка",
    clearAll: "Очистить всё",
    variantsCount: "Сколько вариантов",
    shuffle: "Перемешать порядок задач",
    build: "Собрать варианты",
    total: "Всего задач в варианте",
    bySkills: "Распределение по навыкам",
    note: "Можно попробовать без регистрации. Войти нужно только для сохранения истории в teacher-кабинете.",
    historyTitle: "История работ",
    historySubtitle: "Последние собранные работы. Можно открыть, создать копию и закрепить.",
    historySearch: "Поиск по названию...",
    historyAll: "Все",
    historyOpen: "Открыть",
    historyDuplicate: "Создать копию",
    historyPin: "Закрепить",
    historyUnpin: "Открепить",
    historyEmpty: "Пока нет собранных работ.",
    historyToday: "Сегодня",
    historyYesterday: "Вчера",
    historyWeek: "На этой неделе",
    historyOlder: "Ранее",
    historyVariantsUnit: "вариантов",
    historyTasksUnit: "задач",
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
    noSkills: "Для выбранной темы пока нет настроенных навыков конструктора.",
    loadingSkills: "Загружаем навыки темы...",
    loginHint: "Войти, чтобы сохранять варианты и историю",
  },
  en: {
    title: "Skill-based Variant Builder",
    subtitle:
      "Choose a topic, set the composition by skills, and assemble multiple variants. Print and answers are available immediately.",
    topics: "Topics",
    topicsPlaceholder: "Choose topics...",
    topicsHelper: "Topics define which skills are available below.",
    topicsSearch: "Search topics...",
    topicsNotFound: "No topics found",
    grade: "Grade",
    section: "Section",
    allSections: "All",
    selectedTopics: "Selected topics",
    selectedShort: "selected",
    skillsShort: "skills",
    expandTopic: "Expand topic",
    collapseTopic: "Collapse topic",
    allGrades: "All grades",
    composition: "Variant composition",
    quantity: "Task count",
    available: "Available tasks",
    example: "Example",
    skillCard: "Skill card",
    clearAll: "Clear all",
    variantsCount: "Number of variants",
    shuffle: "Shuffle task order",
    build: "Assemble variants",
    total: "Total tasks per variant",
    bySkills: "Distribution by skills",
    note: "You can try it without registration. Sign-in is only needed to save history in the teacher workspace.",
    historyTitle: "Work history",
    historySubtitle: "Recently generated works. Open, duplicate, or pin.",
    historySearch: "Search by title...",
    historyAll: "All",
    historyOpen: "Open",
    historyDuplicate: "Duplicate",
    historyPin: "Pin",
    historyUnpin: "Unpin",
    historyEmpty: "No generated works yet.",
    historyToday: "Today",
    historyYesterday: "Yesterday",
    historyWeek: "This week",
    historyOlder: "Earlier",
    historyVariantsUnit: "variants",
    historyTasksUnit: "tasks",
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
    noSkills: "No constructor skills configured for this topic yet.",
    loadingSkills: "Loading topic skills...",
    loginHint: "Sign in to save variants and history",
  },
  de: {
    title: "Varianten-Baukasten nach Fähigkeiten",
    subtitle:
      "Thema wählen, Zusammensetzung nach Fähigkeiten festlegen und mehrere Varianten zusammenstellen. Druck und Lösungen sind sofort verfügbar.",
    topics: "Themen",
    topicsPlaceholder: "Themen auswählen...",
    topicsHelper: "Themen bestimmen, welche Skills unten verfügbar sind.",
    topicsSearch: "Themen suchen...",
    topicsNotFound: "Keine Themen gefunden",
    grade: "Klasse",
    section: "Bereich",
    allSections: "Alle",
    selectedTopics: "Ausgewählte Themen",
    selectedShort: "ausgewählt",
    skillsShort: "Skills",
    expandTopic: "Thema aufklappen",
    collapseTopic: "Thema einklappen",
    allGrades: "Alle Klassen",
    composition: "Zusammensetzung",
    quantity: "Anzahl Aufgaben",
    available: "Verfügbare Aufgaben",
    example: "Beispiel",
    skillCard: "Skill-Karte",
    clearAll: "Alles löschen",
    variantsCount: "Anzahl Varianten",
    shuffle: "Reihenfolge mischen",
    build: "Varianten zusammenstellen",
    total: "Gesamtaufgaben pro Variante",
    bySkills: "Verteilung nach Fähigkeiten",
    note: "Ohne Registrierung testbar. Anmeldung ist nur zum Speichern im Lehrkräfte-Bereich nötig.",
    historyTitle: "Arbeitsverlauf",
    historySubtitle: "Zuletzt erstellte Arbeiten. Öffnen, kopieren, anheften.",
    historySearch: "Nach Titel suchen...",
    historyAll: "Alle",
    historyOpen: "Öffnen",
    historyDuplicate: "Kopie erstellen",
    historyPin: "Anheften",
    historyUnpin: "Lösen",
    historyEmpty: "Noch keine Arbeiten erstellt.",
    historyToday: "Heute",
    historyYesterday: "Gestern",
    historyWeek: "Diese Woche",
    historyOlder: "Früher",
    historyVariantsUnit: "Varianten",
    historyTasksUnit: "Aufgaben",
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

function parseGeneration(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const generation = (value as { generation?: unknown }).generation;
  if (!generation || typeof generation !== "object") return null;
  return generation as {
    plan?: Array<{ skillId?: string; count?: number }>;
    titleTemplate?: { customTitle?: string | null; date?: string | null } | null;
  };
}

function buildHistoryTitle(params: {
  locale: Locale;
  workType: WorkType;
  customTitle?: string | null;
  date?: string | null;
}) {
  const typeLabels: Record<Locale, Record<WorkType, string>> = {
    ru: {
      lesson: "Работа на уроке",
      quiz: "Самостоятельная",
      homework: "Домашняя работа",
      test: "Контрольная",
    },
    en: {
      lesson: "Lesson work",
      quiz: "Quiz",
      homework: "Homework",
      test: "Test",
    },
    de: {
      lesson: "Unterricht",
      quiz: "Kurztest",
      homework: "Hausaufgabe",
      test: "Klassenarbeit",
    },
  };
  const base = typeLabels[params.locale][params.workType];
  const custom = params.customTitle?.trim();
  const date =
    params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date)
      ? new Intl.DateTimeFormat(params.locale === "ru" ? "ru-RU" : params.locale === "de" ? "de-DE" : "en-US", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }).format(new Date(`${params.date}T00:00:00`))
      : null;
  return [base, custom, date].filter((item): item is string => Boolean(item && item.length > 0)).join(" · ");
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function buildTeacherToolsStateQuery(params: {
  topicId: string;
  selectedTopicIds: string[];
  totalTasks: number;
  variantsCount: number;
  workType: WorkType;
  shuffleOrder: boolean;
  selectedGrade: GradeFilter;
  selectedDomain: SelectedDomainFilter;
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
  query.set("grade", params.selectedGrade === "all" ? "all" : String(params.selectedGrade));
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
  const initialVariantsRaw = Number(params.get("variants"));
  const initialVariantsCount = Number.isFinite(initialVariantsRaw)
    ? clamp(Math.trunc(initialVariantsRaw), 1, 6)
    : 2;
  const initialShuffleOrder = params.get("shuffle") === "0" ? false : true;
  const initialTopicMeta = allTopics.find((item) => item.topicId === initialTopicId)?.meta;
  const initialGradeParam = params.get("grade");
  const initialSelectedGrade: GradeFilter =
    initialGradeParam === "all"
      ? "all"
      : initialGradeParam != null && Number.isFinite(Number(initialGradeParam))
        ? Number(initialGradeParam)
        : (initialTopicMeta?.levels?.[0] ?? 5);
  const initialDomainParam = params.get("domain");
  const inferredInitialDomain =
    (initialTopicMeta ? getTopicDomains(initialTopicMeta)[0] : null) ??
    (allTopics[0]?.meta ? getTopicDomains(allTopics[0].meta)[0] : null) ??
    "arithmetic";
  const initialSelectedDomain: SelectedDomainFilter =
    initialDomainParam === "all"
      ? "all"
      : (initialDomainParam as TopicDomain | null) ?? inferredInitialDomain;

  const [topicId, setTopicId] = useState(initialTopicId);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>(
    initialSelectedTopicIds.length > 0 ? initialSelectedTopicIds : [initialTopicId],
  );
  const [topicSearchQuery, setTopicSearchQuery] = useState("");
  const [isTopicsPickerOpen, setIsTopicsPickerOpen] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<GradeFilter>(initialSelectedGrade);
  const [selectedDomain, setSelectedDomain] = useState<SelectedDomainFilter>(initialSelectedDomain);
  const [variantsCount] = useState(initialVariantsCount);
  const workType: WorkType = "quiz";
  const [shuffleOrder] = useState(initialShuffleOrder);
  const [topic, setTopic] = useState<TopicPayload | null>(null);
  const [loadedTopics, setLoadedTopics] = useState<TopicPayload[]>([]);
  const [expandedByTopicId, setExpandedByTopicId] = useState<Record<string, boolean>>({});
  const [counts, setCounts] = useState<Record<string, number>>({});
  const initialCountsRef = useRef<Record<string, number> | null>(
    hasInitialCountsFromQuery ? initialCountsFromQuery : null,
  );
  const [loadingTopic, setLoadingTopic] = useState(false);
  const [building, setBuilding] = useState(false);
  const [loadingWorks, setLoadingWorks] = useState(false);
  const [works, setWorks] = useState<HistoryWork[]>([]);
  const [historyQuery, setHistoryQuery] = useState("");
  const [historyFilter, setHistoryFilter] = useState<"all" | WorkType>("all");
  const [duplicateWorkId, setDuplicateWorkId] = useState<string | null>(null);
  const [pinnedWorkIds, setPinnedWorkIds] = useState<string[]>([]);
  const [error, setError] = useState<TeacherApiError | null>(null);
  const themesPickerRef = useRef<HTMLDivElement | null>(null);

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
            .filter((topic) =>
              selectedGrade === "all" ? true : (topic.meta?.levels ?? []).includes(selectedGrade),
            )
            .flatMap((topic) => (topic.meta ? getTopicDomains(topic.meta) : []))
            .filter((domain): domain is TopicDomain => Boolean(domain)),
        ),
      ),
    [allTopics, selectedGrade],
  );

  const domainFilterOptions = useMemo(
    () => (domainOptions.length > 0 ? (["all", ...domainOptions] as const) : (["all"] as const)),
    [domainOptions],
  );

  const topics = useMemo(
    () =>
      allTopics.filter((topic) => {
        const levels = topic.meta?.levels ?? [];
        const domains = topic.meta ? getTopicDomains(topic.meta) : [];
        const gradeMatches = selectedGrade === "all" ? true : levels.includes(selectedGrade);
        const domainMatches = selectedDomain === "all" ? true : domains.includes(selectedDomain);
        return gradeMatches && domainMatches;
      }),
    [allTopics, selectedDomain, selectedGrade],
  );

  const orderedSelectedTopicIds = useMemo(
    () => Array.from(new Set(selectedTopicIds)),
    [selectedTopicIds],
  );

  const filteredTopicOptions = useMemo(() => {
    const query = topicSearchQuery.trim().toLowerCase();
    if (!query) return topics;
    return topics.filter((item) => item.title.toLowerCase().includes(query));
  }, [topicSearchQuery, topics]);

  useEffect(() => {
    if (selectedDomain === "all") return;
    if (domainOptions.length === 0) return;
    if (!domainOptions.includes(selectedDomain)) {
      setSelectedDomain(domainOptions[0]!);
    }
  }, [domainOptions, selectedDomain]);

  useEffect(() => {
    setSelectedTopicIds((prev) => {
      const allowedIds = new Set(allTopics.map((item) => item.topicId));
      const next = prev.filter((item) => allowedIds.has(item));
      if (next.length === prev.length && next.every((item, index) => item === prev[index])) {
        return prev;
      }
      return next;
    });
  }, [allTopics]);

  useEffect(() => {
    if (selectedTopicIds.length === 0) return;
    if (selectedTopicIds.includes(topicId)) return;
    setTopicId(selectedTopicIds[0]!);
  }, [selectedTopicIds, topicId]);

  useEffect(() => {
    if (!isTopicsPickerOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (!themesPickerRef.current) return;
      if (!themesPickerRef.current.contains(event.target as Node)) {
        setIsTopicsPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isTopicsPickerOpen]);

  useEffect(() => {
    let cancelled = false;
    async function loadTopic() {
      if (orderedSelectedTopicIds.length === 0) {
        setTopic(null);
        setLoadedTopics([]);
        setCounts((prev) => {
          const next: Record<string, number> = {};
          let changed = false;
          for (const [skillId, count] of Object.entries(prev)) {
            const value = clamp(count, 0, 30);
            next[skillId] = value;
            if (value !== count) changed = true;
          }
          return changed ? next : prev;
        });
        return;
      }

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

  const topicStats = useMemo(() => {
    const map = new Map<string, { selectedCount: number; skillsCount: number }>();
    for (const loadedTopic of loadedTopics) {
      const selectedCount = loadedTopic.skills.reduce((sum, skill) => sum + (counts[skill.id] ?? 0), 0);
      map.set(loadedTopic.topicId, {
        selectedCount,
        skillsCount: loadedTopic.skills.length,
      });
    }
    return map;
  }, [loadedTopics, counts]);

  useEffect(() => {
    if (loadedTopics.length === 0) return;
    setExpandedByTopicId((prev) => {
      const knownIds = new Set(loadedTopics.map((topic) => topic.topicId));
      const next: Record<string, boolean> = {};
      let changed = false;

      for (const [id, value] of Object.entries(prev)) {
        if (knownIds.has(id)) {
          next[id] = value;
        } else {
          changed = true;
        }
      }

      for (const loadedTopic of loadedTopics) {
        if (!(loadedTopic.topicId in next)) {
          next[loadedTopic.topicId] = loadedTopic.topicId === topicId;
          changed = true;
        }
      }

      if (!changed) return prev;
      return next;
    });
  }, [loadedTopics, topicId]);

  useEffect(() => {
    const storageKey = `teacher-tools:pinned-works:${locale}`;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        setPinnedWorkIds(parsed.filter((item): item is string => typeof item === "string"));
      }
    } catch {
      // ignore malformed local storage payload
    }
  }, [locale]);

  useEffect(() => {
    const storageKey = `teacher-tools:pinned-works:${locale}`;
    window.localStorage.setItem(storageKey, JSON.stringify(pinnedWorkIds));
  }, [locale, pinnedWorkIds]);

  async function loadWorks() {
    setLoadingWorks(true);
    try {
      const response = await fetch("/api/teacher/demo/works", {
        credentials: "same-origin",
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        works?: HistoryWork[];
      };
      if (!response.ok || !payload.ok) return;
      setWorks(Array.isArray(payload.works) ? payload.works : []);
    } catch {
      // history is optional on this screen; keep silent if unavailable
    } finally {
      setLoadingWorks(false);
    }
  }

  useEffect(() => {
    void loadWorks();
  }, []);

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
          printLayout: "single",
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
      if (!response.ok || !payload.ok) {
        setError(parseTeacherError(payload, "Не удалось собрать варианты."));
        return;
      }
      const nextWorkId = typeof payload.workId === "string" ? payload.workId : null;
      if (nextWorkId) {
        void loadWorks();
        router.push(`/${locale}/teacher-tools/works/${nextWorkId}`);
        return;
      }
      setError({ message: "Работа собрана, но не удалось открыть страницу работы." });
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

  async function handleDuplicateWork(workId: string) {
    setDuplicateWorkId(workId);
    try {
      const response = await fetch(`/api/teacher/demo/works/${workId}/duplicate`, {
        method: "POST",
        credentials: "same-origin",
      });
      const payload = (await response.json()) as { ok?: boolean; workId?: string };
      if (!response.ok || !payload.ok || typeof payload.workId !== "string") return;
      await loadWorks();
      router.push(`/${locale}/teacher-tools/works/${payload.workId}`);
    } catch {
      // keep silent; duplication is secondary action in history
    } finally {
      setDuplicateWorkId(null);
    }
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

  const filteredWorks = useMemo(() => {
    const query = historyQuery.trim().toLowerCase();
    return works.filter((work) => {
      if (historyFilter !== "all" && work.workType !== historyFilter) return false;
      const generation = parseGeneration(work.printProfileJson);
      const title = buildHistoryTitle({
        locale,
        workType: work.workType,
        customTitle: generation?.titleTemplate?.customTitle ?? null,
        date: generation?.titleTemplate?.date ?? null,
      });
      if (!query) return true;
      return title.toLowerCase().includes(query);
    });
  }, [historyFilter, historyQuery, locale, works]);

  const groupedWorks = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 6);

    const groups: Record<"today" | "yesterday" | "week" | "older", HistoryWork[]> = {
      today: [],
      yesterday: [],
      week: [],
      older: [],
    };

    const sorted = [...filteredWorks].sort((a, b) => {
      const pinDiff = Number(pinnedWorkIds.includes(b.id)) - Number(pinnedWorkIds.includes(a.id));
      if (pinDiff !== 0) return pinDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    for (const work of sorted) {
      const createdAt = new Date(work.createdAt);
      if (isSameDay(createdAt, today)) {
        groups.today.push(work);
      } else if (isSameDay(createdAt, yesterday)) {
        groups.yesterday.push(work);
      } else if (createdAt >= weekStart) {
        groups.week.push(work);
      } else {
        groups.older.push(work);
      }
    }

    return groups;
  }, [filteredWorks, pinnedWorkIds]);

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
            {domainFilterOptions.map((domain) => (
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
                {t.section}: {domain === "all" ? t.allSections : t.domains[domain]}
              </button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-4">
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t.grade}
                </span>
                <select
                    value={selectedGrade === "all" ? "all" : String(selectedGrade)}
                    onChange={(e) => {
                      setSelectedGrade(e.target.value === "all" ? "all" : Number(e.target.value));
                      setSelectedTopicIds([]);
                      setTopicSearchQuery("");
                      setCounts((prev) => {
                        const next: Record<string, number> = {};
                        for (const key of Object.keys(prev)) {
                          next[key] = 0;
                        }
                        return next;
                      });
                    }}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                >
                  <option value="all">{t.allGrades}</option>
                  {gradeOptions.map((grade) => (
                    <option key={grade} value={String(grade)}>
                      {formatNumber(locale, grade)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t.topics}
                </span>
                <div className="space-y-2">
                  <div ref={themesPickerRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setIsTopicsPickerOpen((prev) => !prev)}
                      className="relative flex min-h-11 w-full items-center rounded-xl border border-slate-300 bg-white px-3 py-2 pr-16 text-left text-sm text-slate-900"
                      aria-expanded={isTopicsPickerOpen}
                    >
                      <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
                        {selectedTopicIds.length === 0 ? (
                          <span className="text-slate-500">{t.topicsPlaceholder}</span>
                        ) : (
                          selectedTopicIds.map((selectedId) => {
                            const selectedTopic = allTopics.find((item) => item.topicId === selectedId);
                            const label = selectedTopic?.title ?? selectedId;
                            return (
                              <span
                                key={selectedId}
                                className="inline-flex max-w-full items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700"
                                title={label}
                              >
                                <span className="truncate">{label}</span>
                                <span
                                  role="button"
                                  aria-label={label}
                                  tabIndex={-1}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setSelectedTopicIds((prev) => prev.filter((item) => item !== selectedId));
                                    const removedTopic = loadedTopics.find((item) => item.topicId === selectedId);
                                    if (removedTopic) {
                                      setCounts((prev) => {
                                        const next = { ...prev };
                                        for (const skill of removedTopic.skills) {
                                          next[skill.id] = 0;
                                        }
                                        return next;
                                      });
                                    }
                                  }}
                                  className="rounded-full px-1 leading-none text-blue-700 hover:bg-blue-100"
                                >
                                  ×
                                </span>
                              </span>
                            );
                          })
                        )}
                      </span>
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true">
                        ▾
                      </span>
                    </button>
                    {selectedTopicIds.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTopicIds([]);
                          setCounts((prev) => {
                            const next = { ...prev };
                            for (const value of loadedTopics) {
                              for (const skill of value.skills) {
                                next[skill.id] = 0;
                              }
                            }
                            return next;
                          });
                        }}
                        className="absolute right-7 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                        aria-label={t.clearAll}
                      >
                        ×
                      </button>
                    ) : null}

                    {isTopicsPickerOpen ? (
                      <div className="absolute z-20 mt-2 w-full rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                        <input
                          type="text"
                          value={topicSearchQuery}
                          onChange={(event) => setTopicSearchQuery(event.target.value)}
                          placeholder={t.topicsSearch}
                          className="mb-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                        />
                        <ul className="max-h-64 space-y-1 overflow-auto">
                          {filteredTopicOptions.length === 0 ? (
                            <li className="px-2 py-1 text-sm text-slate-500">{t.topicsNotFound}</li>
                          ) : (
                            filteredTopicOptions.map((item) => {
                              const checked = selectedTopicIds.includes(item.topicId);
                              return (
                                <li key={item.topicId}>
                                  <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-800 hover:bg-slate-50">
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() =>
                                        setSelectedTopicIds((prev) => {
                                          if (checked) {
                                            const removedTopic = loadedTopics.find((value) => value.topicId === item.topicId);
                                            if (removedTopic) {
                                              setCounts((prevCounts) => {
                                                const next = { ...prevCounts };
                                                for (const skill of removedTopic.skills) {
                                                  next[skill.id] = 0;
                                                }
                                                return next;
                                              });
                                            }
                                            return prev.filter((id) => id !== item.topicId);
                                          }
                                          setTopicId(item.topicId);
                                          return [...prev, item.topicId];
                                        })
                                      }
                                      className="h-4 w-4 rounded border-slate-300"
                                    />
                                    <span className="truncate">{item.title}</span>
                                  </label>
                                </li>
                              );
                            })
                          )}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                  <p className="text-xs text-slate-500">{t.topicsHelper}</p>
                </div>
              </label>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t.composition}
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCounts((prev) => {
                      const next: Record<string, number> = {};
                      for (const key of Object.keys(prev)) {
                        next[key] = 0;
                      }
                      return next;
                    });
                    setSelectedTopicIds([]);
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
                >
                  {t.clearAll}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-slate-950">{t.composition}</h2>
              {loadingTopic ? <span className="text-xs text-slate-500">{t.loadingSkills}</span> : null}
            </div>
            {loadedTopics.length > 0 ? (
              <div className="space-y-3">
                {loadedTopics.map((loadedTopic) => {
                  const stats = topicStats.get(loadedTopic.topicId) ?? { selectedCount: 0, skillsCount: loadedTopic.skills.length };
                  const isExpanded = expandedByTopicId[loadedTopic.topicId] === true;
                  return (
                  <div key={loadedTopic.topicId} className="space-y-3">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedByTopicId((prev) => ({
                          ...prev,
                          [loadedTopic.topicId]: !isExpanded,
                        }))
                      }
                      aria-label={isExpanded ? t.collapseTopic : t.expandTopic}
                      className={[
                        "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left",
                        loadedTopic.topicId === topicId
                          ? "border-slate-300 bg-slate-100"
                          : "border-slate-200 bg-slate-50 hover:bg-slate-100",
                      ].join(" ")}
                    >
                      <span className="text-sm font-semibold text-slate-900">
                        {loadedTopic.title[locale] ?? loadedTopic.title.ru ?? loadedTopic.topicId}
                      </span>
                      <span className="inline-flex items-center gap-2 text-xs text-slate-600">
                        <span>{t.selectedShort}: {formatNumber(locale, stats.selectedCount)}</span>
                        <span>{t.skillsShort}: {formatNumber(locale, stats.skillsCount)}</span>
                        <span className="text-slate-500">{isExpanded ? "▾" : "▸"}</span>
                      </span>
                    </button>
                    {isExpanded ? loadedTopic.skills.map((skill) => {
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
                    }) : null}
                  </div>
                );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                {t.noSkills}
              </div>
            )}
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <div />
            <button
              type="button"
              onClick={handleBuild}
              disabled={building || loadingTopic || summary.total < 1}
              className="inline-flex items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 lg:hidden"
            >
              {building ? `${t.build}...` : t.build}
            </button>
          </div>

          <p className="mt-4 text-xs leading-5 text-slate-500">{t.note}</p>
        </SurfaceCard>

        <SurfaceCard className="p-6">
          <h2 className="text-lg font-semibold text-slate-950">{t.total}</h2>
          <p className="mt-2 text-2xl font-bold text-slate-950">{formatNumber(locale, summary.total)}</p>
          <button
            type="button"
            onClick={handleBuild}
            disabled={building || loadingTopic || summary.total < 1}
            className="mt-4 hidden w-full items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 lg:inline-flex"
          >
            {building ? `${t.build}...` : t.build}
          </button>
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

      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">{t.historyTitle}</h2>
            <p className="mt-1 text-sm text-slate-600">{t.historySubtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => void loadWorks()}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
          >
            {loadingWorks ? "..." : "↻"}
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <input
            type="text"
            value={historyQuery}
            onChange={(event) => setHistoryQuery(event.target.value)}
            placeholder={t.historySearch}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setHistoryFilter("all")}
              className={[
                "rounded-full border px-3 py-1 text-xs font-semibold",
                historyFilter === "all"
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-300 bg-white text-slate-700",
              ].join(" ")}
            >
              {t.historyAll}
            </button>
            {(Object.keys(t.workTypes) as WorkType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setHistoryFilter(type)}
                className={[
                  "rounded-full border px-3 py-1 text-xs font-semibold",
                  historyFilter === type
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-300 bg-white text-slate-700",
                ].join(" ")}
              >
                {t.workTypes[type]}
              </button>
            ))}
          </div>
        </div>

        {(["today", "yesterday", "week", "older"] as const).map((bucket) => {
          const items = groupedWorks[bucket];
          if (items.length === 0) return null;
          const heading =
            bucket === "today"
              ? t.historyToday
              : bucket === "yesterday"
                ? t.historyYesterday
                : bucket === "week"
                  ? t.historyWeek
                  : t.historyOlder;
          return (
            <div key={bucket} className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{heading}</h3>
              <div className="space-y-2">
                {items.map((work) => {
                  const generation = parseGeneration(work.printProfileJson);
                  const tasksCount =
                    generation?.plan?.reduce((sum, item) => sum + (typeof item.count === "number" ? item.count : 0), 0) ?? 0;
                  const displayTitle = buildHistoryTitle({
                    locale,
                    workType: work.workType,
                    customTitle: generation?.titleTemplate?.customTitle ?? null,
                    date: generation?.titleTemplate?.date ?? null,
                  });
                  const isPinned = pinnedWorkIds.includes(work.id);
                  const topicTitle = allTopics.find((item) => item.topicId === work.topicId)?.title ?? work.topicId;
                  return (
                    <div key={work.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold text-slate-950">{displayTitle || work.title}</p>
                          <p className="mt-1 text-sm text-slate-600">
                            {formatDateTime(locale, work.createdAt)} • {formatNumber(locale, work.variantsCount)} {t.historyVariantsUnit} • {formatNumber(locale, tasksCount)} {t.historyTasksUnit}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="rounded-full border border-slate-300 bg-white px-2 py-0.5 text-xs font-medium text-slate-700">
                              {t.workTypes[work.workType]}
                            </span>
                            <span className="rounded-full border border-slate-300 bg-white px-2 py-0.5 text-xs font-medium text-slate-700">
                              {topicTitle}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/${locale}/teacher-tools/works/${work.id}`}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
                          >
                            {t.historyOpen}
                          </Link>
                          <button
                            type="button"
                            onClick={() => void handleDuplicateWork(work.id)}
                            disabled={duplicateWorkId === work.id}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100 disabled:opacity-60"
                          >
                            {duplicateWorkId === work.id ? "..." : t.historyDuplicate}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setPinnedWorkIds((prev) =>
                                isPinned ? prev.filter((id) => id !== work.id) : [work.id, ...prev],
                              )
                            }
                            className={[
                              "rounded-lg border px-3 py-2 text-sm font-medium",
                              isPinned
                                ? "border-slate-900 bg-slate-900 text-white"
                                : "border-slate-300 bg-white text-slate-900 hover:bg-slate-100",
                            ].join(" ")}
                          >
                            {isPinned ? t.historyUnpin : t.historyPin}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {Object.values(groupedWorks).every((items) => items.length === 0) ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            {t.historyEmpty}
          </div>
        ) : null}
      </section>
    </main>
  );
}
