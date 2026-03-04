"use client";

import Link from "next/link";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { SurfaceCard } from "@/src/components/ui/SurfaceCard";
import { TeacherErrorState, type TeacherApiError } from "@/src/components/ui/TeacherErrorState";
import { listContentTopicConfigs } from "@/src/lib/content/topic-registry";
import { formatNumber } from "@/src/lib/i18n/format";
import { analyzePrereqs, type SkillPrereqEdge } from "@/src/lib/teacher-tools/prereqs";
import { getTopicDomains, topicCatalogEntries, type TopicDomain } from "@/src/lib/topicMeta";
import type { DifficultyBand } from "@/lib/tasks/difficulty-band";
import { type WorkType } from "@/src/lib/variants/print-recommendation";

type Locale = "ru" | "en" | "de";
type Props = { locale: Locale };
type GradeFilter = number | "all";
type SubjectFilter = TopicDomain | "all";
type WizardStep = 1 | 2 | 3 | 4;
type WorkTypeUi = WorkType | "custom";
type WizardMode = "single" | "multi";

type TopicSkill = {
  id: string;
  title: string;
  branchId?: string;
  summary?: string;
  example?: string;
  cardHref?: string;
  availableCount?: number;
  availableByDifficulty?: { 1: number; 2: number; 3: number };
  availableByBand?: Record<DifficultyBand, number>;
  status?: "ready" | "soon";
};

type TopicRouteStep = {
  step_id: string;
  skill_id: string;
  allowed_bands: DifficultyBand[];
  order: number;
};

type TopicRoute = {
  routeId: string;
  title: string;
  steps: TopicRouteStep[];
};

type TopicPayload = {
  topicId: string;
  sectionId?: string;
  moduleId?: string;
  gradeTags?: number[];
  title: Record<Locale, string>;
  skills: TopicSkill[];
  routes?: TopicRoute[];
  skillEdges?: SkillPrereqEdge[];
};

type TopicOption = {
  topicId: string;
  title: string;
  gradeTags: number[];
  domains: TopicDomain[];
};

type BranchGroup = {
  id: string;
  label: string;
  skills: TopicSkill[];
};

type WorkMeta = {
  workType: WorkTypeUi;
  customTypeLabel: string;
  date: string;
  showDateInPdf: boolean;
};

type WizardState = {
  step: WizardStep;
  mode: WizardMode;
  gradeTag: GradeFilter;
  subject: SubjectFilter;
  selectedModuleIds: string[];
  activeModuleId: string | null;
  selectedBranchIdsByModule: Record<string, string[]>;
  skillCountsByModule: Record<string, Record<string, number>>;
  routeIdByModule: Record<string, string | null>;
  workMeta: WorkMeta;
};

type WizardAction =
  | { type: "setStep"; step: WizardStep }
  | { type: "setMode"; mode: WizardMode }
  | { type: "setGradeTag"; gradeTag: GradeFilter }
  | { type: "setSubject"; subject: SubjectFilter }
  | { type: "setSelectedModuleIds"; moduleIds: string[] }
  | { type: "setActiveModuleId"; moduleId: string | null }
  | { type: "setBranchIdsForModule"; moduleId: string; branchIds: string[] }
  | { type: "setSkillCount"; moduleId: string; skillId: string; count: number }
  | { type: "setSkillCountsForModule"; moduleId: string; updates: Record<string, number> }
  | { type: "setRouteForModule"; moduleId: string; routeId: string | null }
  | { type: "setWorkMeta"; patch: Partial<WorkMeta> }
  | { type: "resetModeSelections" };

type GenerateResponse = {
  ok?: boolean;
  workId?: string;
  code?: string;
  message?: string;
  details?: unknown;
};

const MAX_MULTI_MODULES = 3;

const copy = {
  ru: {
    title: "Конструктор вариантов по навыкам",
    subtitle: "Соберите вариант за 4 шага: тема, подтемы, навыки, параметры и генерация.",
    steps: {
      1: "Тема",
      2: "Подтемы",
      3: "Навыки",
      4: "Параметры",
    },
    stepperLabel: "Шаги мастера",
    next: "Далее",
    back: "Назад",
    build: "Собрать варианты",
    building: "Собираем...",
    modeLabel: "Режим",
    modeSingle: "Одна тема",
    modeMulti: "Смешанная работа (2–3 темы)",
    modeHint: "Смешанная — для самостоятельных/контрольных, немного дольше.",
    maxThemesHint: "Максимум 3 темы",
    selectedThemesCount: "Выбрано тем",
    grade: "Класс",
    allGrades: "Все классы",
    subject: "Предмет",
    allSubjects: "Все предметы",
    topics: "Темы",
    noTopics: "По текущим фильтрам темы не найдены.",
    topicResetNotice: "Часть выбранных тем недоступна для текущего фильтра и была снята.",
    needReSelectNotice: "В смешанном режиме нужно выбрать минимум 2 темы.",
    basket: "Корзина тем",
    removeTheme: "Удалить тему",
    branches: "Подтемы",
    branchesHint: "По умолчанию для темы выбраны все подтемы.",
    selectAllBranches: "Выбрать все",
    clearBranches: "Снять все",
    branchCounter: "Выбрано подтем",
    routeLabel: "Маршрут/уровень",
    routeNone: "Без маршрута",
    routeBadge: "Уровень",
    skills: "Навыки",
    addAllSkills: "Добавить все навыки темы",
    clearSkills: "Очистить тему",
    available: "Доступно задач",
    levelsAvailability: "По уровням",
    example: "Пример",
    quantity: "Количество",
    noSkillsForBranches: "В выбранных подтемах пока нет навыков.",
    workType: "Тип работы",
    customTypeLabel: "Свой тип",
    customTypePlaceholder: "Например: Диагностическая",
    date: "Дата",
    showDateInPdf: "Показывать дату в PDF",
    summaryTotal: "Всего задач",
    summaryBySkills: "Распределение по навыкам",
    summaryByThemes: "Разбивка по темам",
    summaryByBands: "По уровню сложности",
    routeWarnings: "Предупреждения по покрытию",
    prereqTitle: "Предпосылки",
    prereqRequired: "Обязательные предпосылки",
    prereqRecommended: "Рекомендуемые предпосылки",
    prereqUnmetRequired: "Обязательные, но недостаточно освоенные",
    prereqUnmetRecommended: "Рекомендуемые, но недостаточно освоенные",
    emptySummary: "Выберите навыки и добавьте хотя бы одну задачу.",
    emptyThemeWarning: "Некоторые темы пока пустые (0 задач). Можно продолжить или удалить их.",
    validationSelectTopic: "Выберите тему, чтобы продолжить.",
    validationSelectTwoTopics: "Для смешанной работы выберите минимум 2 темы.",
    validationSelectBranch: "Выберите хотя бы одну подтему для каждой выбранной темы.",
    validationSelectSkills: "Добавьте хотя бы одну задачу по навыкам.",
    validationCustomType: "Для типа «Своё» укажите название.",
    configured: "настроено",
    notConfigured: "пусто",
    demoLimitTitle: "Демо-лимит для гостя исчерпан",
    demoLimitBody:
      "Вы использовали 3 демо-варианта за сутки. Чтобы продолжить генерацию, войдите или зарегистрируйтесь.",
    demoLimitSignIn: "Войти",
    demoLimitSignUp: "Регистрация",
    domains: {
      arithmetic: "Арифметика",
      algebra: "Алгебра",
      geometry: "Геометрия",
      data: "Данные",
    } satisfies Record<TopicDomain, string>,
    workTypes: {
      lesson: "Тренировочная",
      quiz: "Самостоятельная",
      homework: "Домашняя",
      test: "Контрольная",
      custom: "Свое",
    },
    breadcrumbsManyBranches: "Подтемы",
    planNeed: "нужно",
    planAvailable: "доступно",
    planSelected: "будет выбрано",
  },
  en: {
    title: "Skill Variant Builder",
    subtitle: "Build a worksheet in 4 steps: topic, subtopics, skills, settings, generate.",
    steps: {
      1: "Topic",
      2: "Subtopics",
      3: "Skills",
      4: "Settings",
    },
    stepperLabel: "Wizard steps",
    next: "Next",
    back: "Back",
    build: "Generate variants",
    building: "Generating...",
    modeLabel: "Mode",
    modeSingle: "Single topic",
    modeMulti: "Mixed work (2–3 topics)",
    modeHint: "Mixed mode fits quizzes/tests and takes a bit longer.",
    maxThemesHint: "Maximum 3 topics",
    selectedThemesCount: "Selected topics",
    grade: "Grade",
    allGrades: "All grades",
    subject: "Subject",
    allSubjects: "All subjects",
    topics: "Topics",
    noTopics: "No topics for current filters.",
    topicResetNotice: "Some selected topics are unavailable for current filters and were removed.",
    needReSelectNotice: "Mixed mode requires at least 2 topics.",
    basket: "Topic basket",
    removeTheme: "Remove topic",
    branches: "Subtopics",
    branchesHint: "All subtopics are selected by default for each topic.",
    selectAllBranches: "Select all",
    clearBranches: "Clear all",
    branchCounter: "Selected subtopics",
    routeLabel: "Route/level",
    routeNone: "No route",
    routeBadge: "Level",
    skills: "Skills",
    addAllSkills: "Add all topic skills",
    clearSkills: "Clear topic",
    available: "Available tasks",
    levelsAvailability: "By levels",
    example: "Example",
    quantity: "Count",
    noSkillsForBranches: "No skills in selected subtopics.",
    workType: "Work type",
    customTypeLabel: "Custom type",
    customTypePlaceholder: "Example: Diagnostic",
    date: "Date",
    showDateInPdf: "Show date in PDF",
    summaryTotal: "Total tasks",
    summaryBySkills: "Skill distribution",
    summaryByThemes: "By topics",
    summaryByBands: "By difficulty",
    routeWarnings: "Coverage warnings",
    prereqTitle: "Prerequisites",
    prereqRequired: "Required prerequisites",
    prereqRecommended: "Recommended prerequisites",
    prereqUnmetRequired: "Required but under mastery threshold",
    prereqUnmetRecommended: "Recommended but under mastery threshold",
    emptySummary: "Select skills and add at least one task.",
    emptyThemeWarning: "Some topics are still empty (0 tasks). You can continue or remove them.",
    validationSelectTopic: "Select a topic to continue.",
    validationSelectTwoTopics: "Mixed mode requires at least 2 topics.",
    validationSelectBranch: "Select at least one subtopic for each selected topic.",
    validationSelectSkills: "Add at least one skill task.",
    validationCustomType: "Provide a custom type label.",
    configured: "configured",
    notConfigured: "empty",
    demoLimitTitle: "Guest demo limit reached",
    demoLimitBody:
      "You have used 3 demo variants for today. Sign in or register to continue generating variants.",
    demoLimitSignIn: "Sign in",
    demoLimitSignUp: "Sign up",
    domains: {
      arithmetic: "Arithmetic",
      algebra: "Algebra",
      geometry: "Geometry",
      data: "Data",
    } satisfies Record<TopicDomain, string>,
    workTypes: {
      lesson: "Practice",
      quiz: "Quiz",
      homework: "Homework",
      test: "Test",
      custom: "Custom",
    },
    breadcrumbsManyBranches: "Subtopics",
    planNeed: "need",
    planAvailable: "available",
    planSelected: "will select",
  },
  de: {
    title: "Varianten-Baukasten",
    subtitle: "Arbeitsblatt in 4 Schritten: Thema, Unterthemen, Skills, Parameter, Erstellung.",
    steps: {
      1: "Thema",
      2: "Unterthemen",
      3: "Skills",
      4: "Parameter",
    },
    stepperLabel: "Wizard-Schritte",
    next: "Weiter",
    back: "Zurück",
    build: "Varianten erstellen",
    building: "Wird erstellt...",
    modeLabel: "Modus",
    modeSingle: "Ein Thema",
    modeMulti: "Gemischte Arbeit (2–3 Themen)",
    modeHint: "Gemischt passt für Tests/Arbeiten und dauert etwas länger.",
    maxThemesHint: "Maximal 3 Themen",
    selectedThemesCount: "Gewählte Themen",
    grade: "Klasse",
    allGrades: "Alle Klassen",
    subject: "Fach",
    allSubjects: "Alle Fächer",
    topics: "Themen",
    noTopics: "Keine Themen für aktuelle Filter.",
    topicResetNotice: "Einige gewählte Themen sind für aktuelle Filter nicht verfügbar und wurden entfernt.",
    needReSelectNotice: "Gemischter Modus erfordert mindestens 2 Themen.",
    basket: "Themenkorb",
    removeTheme: "Thema entfernen",
    branches: "Unterthemen",
    branchesHint: "Standardmäßig sind für jedes Thema alle Unterthemen gewählt.",
    selectAllBranches: "Alle wählen",
    clearBranches: "Alle abwählen",
    branchCounter: "Gewählte Unterthemen",
    routeLabel: "Route/Niveau",
    routeNone: "Ohne Route",
    routeBadge: "Niveau",
    skills: "Skills",
    addAllSkills: "Alle Skills des Themas hinzufügen",
    clearSkills: "Thema leeren",
    available: "Verfügbare Aufgaben",
    levelsAvailability: "Nach Stufen",
    example: "Beispiel",
    quantity: "Anzahl",
    noSkillsForBranches: "Keine Skills in ausgewählten Unterthemen.",
    workType: "Arbeitstyp",
    customTypeLabel: "Eigener Typ",
    customTypePlaceholder: "Beispiel: Diagnosearbeit",
    date: "Datum",
    showDateInPdf: "Datum im PDF anzeigen",
    summaryTotal: "Gesamtaufgaben",
    summaryBySkills: "Skill-Verteilung",
    summaryByThemes: "Nach Themen",
    summaryByBands: "Nach Schwierigkeit",
    routeWarnings: "Abdeckungswarnungen",
    prereqTitle: "Voraussetzungen",
    prereqRequired: "Pflicht-Voraussetzungen",
    prereqRecommended: "Empfohlene Voraussetzungen",
    prereqUnmetRequired: "Pflicht, aber noch nicht ausreichend beherrscht",
    prereqUnmetRecommended: "Empfohlen, aber noch nicht ausreichend beherrscht",
    emptySummary: "Wählen Sie Skills und fügen Sie mindestens eine Aufgabe hinzu.",
    emptyThemeWarning: "Einige Themen sind noch leer (0 Aufgaben). Sie können fortfahren oder diese entfernen.",
    validationSelectTopic: "Wählen Sie ein Thema.",
    validationSelectTwoTopics: "Gemischter Modus erfordert mindestens 2 Themen.",
    validationSelectBranch: "Wählen Sie für jedes Thema mindestens ein Unterthema.",
    validationSelectSkills: "Fügen Sie mindestens eine Skill-Aufgabe hinzu.",
    validationCustomType: "Bitte benennen Sie den eigenen Typ.",
    configured: "konfiguriert",
    notConfigured: "leer",
    demoLimitTitle: "Gast-Demo-Limit erreicht",
    demoLimitBody:
      "Sie haben heute 3 Demo-Varianten genutzt. Melden Sie sich an oder registrieren Sie sich, um weiter zu generieren.",
    demoLimitSignIn: "Anmelden",
    demoLimitSignUp: "Registrieren",
    domains: {
      arithmetic: "Arithmetik",
      algebra: "Algebra",
      geometry: "Geometrie",
      data: "Daten",
    } satisfies Record<TopicDomain, string>,
    workTypes: {
      lesson: "Training",
      quiz: "Kurztest",
      homework: "Hausaufgabe",
      test: "Klassenarbeit",
      custom: "Eigene",
    },
    breadcrumbsManyBranches: "Unterthemen",
    planNeed: "benötigt",
    planAvailable: "verfügbar",
    planSelected: "wird gewählt",
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

function slugToTitle(raw: string) {
  return raw
    .split("_")
    .filter((part) => part.length > 0)
    .map((part) => part[0]!.toUpperCase() + part.slice(1))
    .join(" ");
}

function branchLabel(locale: Locale, branchId: string) {
  const key = branchId;
  const ru: Record<string, string> = {
    "math.proportion.direct": "Прямая пропорциональность",
    "math.proportion.rule": "Свойства пропорции",
    "math.proportion.problems": "Текстовые задачи",
    "math.equations.roots": "Корни и проверка",
    "math.equations.one_step": "Одношаговые уравнения",
    "math.equations.word": "Текстовые уравнения",
    "math.negative_numbers.compare_and_absolute": "Сравнение и модуль",
    "math.negative_numbers.operations": "Действия с целыми",
    "math.fractions_multiplication.s0": "База (пререквизиты)",
    "math.fractions_multiplication.s1": "Операция умножения дробей",
    "math.fractions_multiplication.s2": "Применение умножения дробей",
    "math.fractions_multiplication.s3": "Алгебра на дробях",
    "math.fractions_multiplication.s4": "Уравнения с дробными коэффициентами",
    "math.fractions_multiplication.s5": "Прикладные задачи и геометрия",
    "math.rectangular_prism.volume_relations": "Связи измерений и объем",
  };
  const en: Record<string, string> = {
    "math.proportion.direct": "Direct Proportion",
    "math.proportion.rule": "Proportion Rules",
    "math.proportion.problems": "Word Problems",
    "math.equations.roots": "Roots and Check",
    "math.equations.one_step": "One-Step Equations",
    "math.equations.word": "Word Equations",
    "math.negative_numbers.compare_and_absolute": "Compare and Absolute Value",
    "math.negative_numbers.operations": "Integer Operations",
    "math.fractions_multiplication.s0": "Foundation (Prerequisites)",
    "math.fractions_multiplication.s1": "Fractions Multiplication Operations",
    "math.fractions_multiplication.s2": "Applying Fractions Multiplication",
    "math.fractions_multiplication.s3": "Algebra with Fractions",
    "math.fractions_multiplication.s4": "Equations with Fraction Coefficients",
    "math.fractions_multiplication.s5": "Word Problems and Geometry",
    "math.rectangular_prism.volume_relations": "Dimension Relations and Volume",
  };
  const de: Record<string, string> = {
    "math.proportion.direct": "Direkte Proportion",
    "math.proportion.rule": "Proportionseigenschaften",
    "math.proportion.problems": "Textaufgaben",
    "math.equations.roots": "Wurzeln und Prüfung",
    "math.equations.one_step": "Einstufige Gleichungen",
    "math.equations.word": "Textgleichungen",
    "math.negative_numbers.compare_and_absolute": "Vergleich und Betrag",
    "math.negative_numbers.operations": "Rechnen mit ganzen Zahlen",
    "math.fractions_multiplication.s0": "Basis (Voraussetzungen)",
    "math.fractions_multiplication.s1": "Operation Bruchmultiplikation",
    "math.fractions_multiplication.s2": "Anwendung der Bruchmultiplikation",
    "math.fractions_multiplication.s3": "Algebra mit Brüchen",
    "math.fractions_multiplication.s4": "Gleichungen mit Bruchkoeffizienten",
    "math.fractions_multiplication.s5": "Sachaufgaben und Geometrie",
    "math.rectangular_prism.volume_relations": "Kantenbeziehungen und Volumen",
  };
  const map = locale === "ru" ? ru : locale === "de" ? de : en;
  if (map[key]) return map[key];
  const part = branchId.split(".").at(-1) ?? branchId;
  return slugToTitle(part);
}

function formatBands(bands: DifficultyBand[]) {
  const unique = [...new Set(bands)];
  if (unique.length <= 1) return unique[0] ?? "";
  return unique.join(",");
}

function reducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "setStep":
      return { ...state, step: action.step };
    case "setMode":
      return {
        ...state,
        mode: action.mode,
        step: 1,
        selectedModuleIds: [],
        activeModuleId: null,
        selectedBranchIdsByModule: {},
        skillCountsByModule: {},
        routeIdByModule: {},
      };
    case "setGradeTag":
      return { ...state, gradeTag: action.gradeTag };
    case "setSubject":
      return { ...state, subject: action.subject };
    case "setSelectedModuleIds":
      return {
        ...state,
        selectedModuleIds: action.moduleIds,
      };
    case "setActiveModuleId":
      return { ...state, activeModuleId: action.moduleId };
    case "setBranchIdsForModule":
      return {
        ...state,
        selectedBranchIdsByModule: {
          ...state.selectedBranchIdsByModule,
          [action.moduleId]: action.branchIds,
        },
      };
    case "setSkillCount": {
      const moduleCounts = state.skillCountsByModule[action.moduleId] ?? {};
      return {
        ...state,
        skillCountsByModule: {
          ...state.skillCountsByModule,
          [action.moduleId]: {
            ...moduleCounts,
            [action.skillId]: clamp(Math.trunc(action.count), 0, 30),
          },
        },
      };
    }
    case "setSkillCountsForModule": {
      const moduleCounts = state.skillCountsByModule[action.moduleId] ?? {};
      return {
        ...state,
        skillCountsByModule: {
          ...state.skillCountsByModule,
          [action.moduleId]: {
            ...moduleCounts,
            ...action.updates,
          },
        },
      };
    }
    case "setRouteForModule":
      return {
        ...state,
        routeIdByModule: {
          ...state.routeIdByModule,
          [action.moduleId]: action.routeId,
        },
      };
    case "setWorkMeta":
      return { ...state, workMeta: { ...state.workMeta, ...action.patch } };
    case "resetModeSelections":
      return {
        ...state,
        step: 1,
        selectedModuleIds: [],
        activeModuleId: null,
        selectedBranchIdsByModule: {},
        skillCountsByModule: {},
        routeIdByModule: {},
      };
    default:
      return state;
  }
}

const initialState: WizardState = {
  step: 1,
  mode: "single",
  gradeTag: "all",
  subject: "all",
  selectedModuleIds: [],
  activeModuleId: null,
  selectedBranchIdsByModule: {},
  skillCountsByModule: {},
  routeIdByModule: {},
  workMeta: {
    workType: "quiz",
    customTypeLabel: "",
    date: "",
    showDateInPdf: false,
  },
};

export function TeacherToolsPageClient({ locale }: Props) {
  const t = copy[locale];
  const router = useRouter();
  const [state, dispatch] = useReducer(reducer, initialState);

  const [topicDataById, setTopicDataById] = useState<Record<string, TopicPayload>>({});
  const [loadingTopics, setLoadingTopics] = useState<Record<string, boolean>>({});
  const loadingTopicsRef = useRef<Set<string>>(new Set());
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState<TeacherApiError | null>(null);
  const [inlineValidation, setInlineValidation] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [requiresGuestRegistration, setRequiresGuestRegistration] = useState(false);
  const [csrfToken, setCsrfToken] = useState("");

  const topicConfigs = useMemo(() => listContentTopicConfigs(), []);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/auth/session", { credentials: "same-origin" });
        const payload = (await response.json()) as { csrfToken?: unknown };
        if (typeof payload.csrfToken === "string" && payload.csrfToken) {
          setCsrfToken(payload.csrfToken);
        }
      } catch {
        // optional block: fallback handled by action-level validation
      }
    })();
  }, []);

  const allTopics = useMemo<TopicOption[]>(() => {
    return topicConfigs
      .map((cfg) => {
        const catalog = topicCatalogEntries.find(
          (entry) => entry.id === cfg.topicSlug || entry.slug.endsWith(`/${cfg.topicSlug}`),
        );
        const topicId = catalog?.id ?? cfg.topicSlug;
        if (!catalog) return null;
        return {
          topicId,
          title: cfg.titles?.[locale] ?? cfg.titles?.ru ?? topicId,
          gradeTags: catalog.levels,
          domains: getTopicDomains(catalog),
        };
      })
      .filter((item): item is TopicOption => Boolean(item));
  }, [locale, topicConfigs]);

  const topicTitleById = useMemo(() => {
    return new Map(allTopics.map((topic) => [topic.topicId, topic.title] as const));
  }, [allTopics]);

  const gradeOptions = useMemo(
    () => Array.from(new Set(allTopics.flatMap((item) => item.gradeTags))).sort((a, b) => a - b),
    [allTopics],
  );

  const subjectOptions = useMemo(
    () =>
      Array.from(
        new Set(
          allTopics
            .filter((topic) => (state.gradeTag === "all" ? true : topic.gradeTags.includes(state.gradeTag)))
            .flatMap((topic) => topic.domains),
        ),
      ),
    [allTopics, state.gradeTag],
  );

  const filteredTopics = useMemo(
    () =>
      allTopics.filter((topic) => {
        if (state.gradeTag !== "all" && !topic.gradeTags.includes(state.gradeTag)) return false;
        if (state.subject !== "all" && !topic.domains.includes(state.subject)) return false;
        return true;
      }),
    [allTopics, state.gradeTag, state.subject],
  );

  const filteredTopicIds = useMemo(() => new Set(filteredTopics.map((topic) => topic.topicId)), [filteredTopics]);

  useEffect(() => {
    const nextSelected = state.selectedModuleIds.filter((id) => filteredTopicIds.has(id));
    if (nextSelected.length === state.selectedModuleIds.length) return;

    dispatch({ type: "setSelectedModuleIds", moduleIds: nextSelected });

    const nextActive = nextSelected.includes(state.activeModuleId ?? "")
      ? state.activeModuleId
      : nextSelected[0] ?? null;
    dispatch({ type: "setActiveModuleId", moduleId: nextActive });

    setNotice(t.topicResetNotice);

    if (state.mode === "single" && nextSelected.length === 0) {
      dispatch({ type: "setStep", step: 1 });
      return;
    }
    if (state.mode === "multi" && nextSelected.length < 2) {
      dispatch({ type: "setStep", step: 1 });
      setNotice(t.needReSelectNotice);
    }
  }, [filteredTopicIds, state.activeModuleId, state.mode, state.selectedModuleIds, t.needReSelectNotice, t.topicResetNotice]);

  useEffect(() => {
    const moduleIdsToLoad = state.selectedModuleIds.filter(
      (moduleId) => !topicDataById[moduleId] && !loadingTopicsRef.current.has(moduleId),
    );
    if (moduleIdsToLoad.length === 0) return;

    let cancelled = false;
    void (async () => {
      for (const id of moduleIdsToLoad) {
        loadingTopicsRef.current.add(id);
      }
      setLoadingTopics((prev) => {
        const next = { ...prev };
        for (const id of moduleIdsToLoad) next[id] = true;
        return next;
      });

      try {
        const results = await Promise.all(
          moduleIdsToLoad.map(async (moduleId) => {
            const response = await fetch(`/api/teacher/demo/topic?topicId=${encodeURIComponent(moduleId)}`);
            const payload = (await response.json()) as { ok?: boolean; topic?: TopicPayload };
            return { moduleId, response, payload };
          }),
        );

        if (cancelled) return;

        const failed = results.find((item) => !item.response.ok || !item.payload.ok || !item.payload.topic);
        if (failed) {
          setError(parseTeacherError(failed.payload, "Не удалось загрузить тему."));
        }

        const loaded = results.filter((item) => item.response.ok && item.payload.ok && item.payload.topic);
        if (loaded.length > 0) {
          setTopicDataById((prev) => {
            const next = { ...prev };
            for (const item of loaded) {
              next[item.moduleId] = item.payload.topic as TopicPayload;
            }
            return next;
          });

          for (const item of loaded) {
            const topic = item.payload.topic as TopicPayload;
            const defaultBranchIds = Array.from(
              new Set(topic.skills.map((skill) => skill.branchId).filter((value): value is string => Boolean(value))),
            );
            const hasExisting = (state.selectedBranchIdsByModule[item.moduleId] ?? []).length > 0;
            if (!hasExisting && defaultBranchIds.length > 0) {
              dispatch({ type: "setBranchIdsForModule", moduleId: item.moduleId, branchIds: defaultBranchIds });
            }
          }
        }
      } catch {
        if (!cancelled) {
          setError({ message: "Ошибка сети при загрузке тем." });
        }
      } finally {
        for (const id of moduleIdsToLoad) {
          loadingTopicsRef.current.delete(id);
        }
        if (!cancelled) {
          setLoadingTopics((prev) => {
            const next = { ...prev };
            for (const id of moduleIdsToLoad) delete next[id];
            return next;
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [state.selectedBranchIdsByModule, state.selectedModuleIds, topicDataById]);

  useEffect(() => {
    if (!state.activeModuleId && state.selectedModuleIds.length > 0) {
      dispatch({ type: "setActiveModuleId", moduleId: state.selectedModuleIds[0]! });
      return;
    }
    if (state.activeModuleId && !state.selectedModuleIds.includes(state.activeModuleId)) {
      dispatch({ type: "setActiveModuleId", moduleId: state.selectedModuleIds[0] ?? null });
    }
  }, [state.activeModuleId, state.selectedModuleIds]);

  const activeModuleId = state.activeModuleId ?? state.selectedModuleIds[0] ?? null;

  const activeRouteByModule = useMemo(() => {
    const map = new Map<string, TopicRoute | null>();
    for (const moduleId of state.selectedModuleIds) {
      const routeId = state.routeIdByModule[moduleId];
      if (!routeId) {
        map.set(moduleId, null);
        continue;
      }
      const topic = topicDataById[moduleId];
      const route = topic?.routes?.find((item) => item.routeId === routeId) ?? null;
      map.set(moduleId, route);
    }
    return map;
  }, [state.routeIdByModule, state.selectedModuleIds, topicDataById]);

  const branchGroupsByModule = useMemo(() => {
    const map: Record<string, BranchGroup[]> = {};
    for (const moduleId of state.selectedModuleIds) {
      const topic = topicDataById[moduleId];
      if (!topic) {
        map[moduleId] = [];
        continue;
      }
      const activeRoute = activeRouteByModule.get(moduleId) ?? null;
      const routeSkillSet = activeRoute
        ? new Set(activeRoute.steps.map((step) => step.skill_id))
        : null;
      const grouped = new Map<string, TopicSkill[]>();
      for (const skill of topic.skills.filter((entry) =>
        routeSkillSet ? routeSkillSet.has(entry.id) : true,
      )) {
        const branchId = skill.branchId ?? "default";
        const existing = grouped.get(branchId) ?? [];
        existing.push(skill);
        grouped.set(branchId, existing);
      }
      map[moduleId] = [...grouped.entries()].map(([id, skills]) => ({
        id,
        label: id === "default" ? t.branches : branchLabel(locale, id),
        skills,
      }));
    }
    return map;
  }, [activeRouteByModule, locale, state.selectedModuleIds, t.branches, topicDataById]);

  const activeBranchGroups = useMemo(
    () => (activeModuleId ? branchGroupsByModule[activeModuleId] ?? [] : []),
    [activeModuleId, branchGroupsByModule],
  );

  const activeSelectedBranchSet = useMemo(() => {
    if (!activeModuleId) return new Set<string>();
    return new Set(state.selectedBranchIdsByModule[activeModuleId] ?? []);
  }, [activeModuleId, state.selectedBranchIdsByModule]);

  const activeSkillsForSelectedBranches = useMemo(() => {
    return activeBranchGroups
      .filter((branch) => activeSelectedBranchSet.has(branch.id))
      .flatMap((branch) => branch.skills);
  }, [activeBranchGroups, activeSelectedBranchSet]);

  const routeBandsBySkillForActive = useMemo(() => {
    if (!activeModuleId) return new Map<string, DifficultyBand[]>();
    const route = activeRouteByModule.get(activeModuleId);
    if (!route) return new Map<string, DifficultyBand[]>();
    const map = new Map<string, DifficultyBand[]>();
    for (const step of route.steps) {
      const current = map.get(step.skill_id) ?? [];
      map.set(step.skill_id, [...new Set([...current, ...step.allowed_bands])]);
    }
    return map;
  }, [activeModuleId, activeRouteByModule]);

  const moduleStatus = useMemo(() => {
    const status = new Map<string, { total: number; ok: boolean }>();
    for (const moduleId of state.selectedModuleIds) {
      const counts = state.skillCountsByModule[moduleId] ?? {};
      const total = Object.values(counts).reduce((sum, value) => sum + (Number.isFinite(value) ? value : 0), 0);
      status.set(moduleId, { total, ok: total > 0 });
    }
    return status;
  }, [state.selectedModuleIds, state.skillCountsByModule]);

  const summary = useMemo(() => {
    const warnings: Array<{
      moduleId: string;
      moduleTitle: string;
      skillId: string;
      skillTitle: string;
      need: number;
      available: number;
      selected: number;
      bands: DifficultyBand[];
    }> = [];
    const byBands: Record<DifficultyBand, number> = { A: 0, B: 0, C: 0 };

    const byModule = state.selectedModuleIds.map((moduleId) => {
      const topic = topicDataById[moduleId];
      const counts = state.skillCountsByModule[moduleId] ?? {};
      const route = activeRouteByModule.get(moduleId) ?? null;
      const routeBandsBySkill = new Map<string, DifficultyBand[]>();
      for (const step of route?.steps ?? []) {
        const current = routeBandsBySkill.get(step.skill_id) ?? [];
        routeBandsBySkill.set(step.skill_id, [...new Set([...current, ...step.allowed_bands])]);
      }

      const selectedSkills = (topic?.skills ?? [])
        .map((skill) => {
          const need = counts[skill.id] ?? 0;
          const routeBands = routeBandsBySkill.get(skill.id) ?? [];
          const isIncludedInRoute = !route || routeBands.length > 0;
          if (!isIncludedInRoute || need <= 0) return null;
          const available = route
            ? routeBands.reduce((sum, band) => sum + (skill.availableByBand?.[band] ?? 0), 0)
            : (skill.availableCount ?? 0);
          const selected = Math.min(need, available);
          if (selected < need) {
            warnings.push({
              moduleId,
              moduleTitle:
                topic?.title[locale] ?? topic?.title.ru ?? topicTitleById.get(moduleId) ?? moduleId,
              skillId: skill.id,
              skillTitle: skill.title,
              need,
              available,
              selected,
              bands: routeBands,
            });
          }
          if (route && routeBands.length > 0) {
            byBands[routeBands[0]!] += selected;
          } else {
            byBands.A += selected;
          }
          return { skill, count: selected, requested: need, available, routeBands };
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item));

      const total = selectedSkills.reduce((sum, item) => sum + item.count, 0);
      return {
        moduleId,
        title: topic?.title[locale] ?? topic?.title.ru ?? topicTitleById.get(moduleId) ?? moduleId,
        total,
        selectedSkills,
      };
    });
    const total = byModule.reduce((sum, item) => sum + item.total, 0);
    return { total, byModule, byBands, warnings };
  }, [
    activeRouteByModule,
    locale,
    state.selectedModuleIds,
    state.skillCountsByModule,
    topicDataById,
    topicTitleById,
  ]);

  const breadcrumb = useMemo(() => {
    if (!activeModuleId) return null;
    const topicMeta = allTopics.find((topic) => topic.topicId === activeModuleId);
    const topicData = topicDataById[activeModuleId];
    if (!topicMeta || !topicData) return null;
    const subject = topicMeta.domains[0] ?? "arithmetic";
    const subjectLabel = t.domains[subject];
    const topicLabel = topicData.title[locale] ?? topicData.title.ru ?? topicMeta.title;
    const selectedBranches = activeBranchGroups.filter((branch) => activeSelectedBranchSet.has(branch.id));
    if (selectedBranches.length === 1) {
      return `${subjectLabel} -> ${topicLabel} -> ${selectedBranches[0]!.label}`;
    }
    return `${subjectLabel} -> ${topicLabel} -> ${t.breadcrumbsManyBranches}: ${selectedBranches.length}`;
  }, [activeBranchGroups, activeModuleId, activeSelectedBranchSet, allTopics, locale, t.breadcrumbsManyBranches, t.domains, topicDataById]);

  const hasAnyEmptyTheme = useMemo(() => {
    if (state.mode !== "multi") return false;
    return summary.byModule.some((item) => item.total === 0);
  }, [state.mode, summary.byModule]);

  const prereqSummary = useMemo(() => {
    const combined = {
      missingRequired: [] as Array<{ title: string; reason?: string; priority: number }>,
      missingRecommended: [] as Array<{ title: string; reason?: string; priority: number }>,
      unmetRequired: [] as Array<{ title: string; reason?: string; priority: number }>,
      unmetRecommended: [] as Array<{ title: string; reason?: string; priority: number }>,
    };

    for (const moduleId of state.selectedModuleIds) {
      const topic = topicDataById[moduleId];
      if (!topic || !topic.skillEdges || topic.skillEdges.length === 0) continue;
      const counts = state.skillCountsByModule[moduleId] ?? {};
      const selectedSkillIds = new Set(
        Object.entries(counts)
          .filter(([, count]) => Number.isFinite(count) && count > 0)
          .map(([skillId]) => skillId),
      );
      if (selectedSkillIds.size === 0) continue;
      const titlesById = new Map(topic.skills.map((skill) => [skill.id, skill.title] as const));
      const analyzed = analyzePrereqs({
        selectedSkillIds,
        edges: topic.skillEdges,
        skillTitlesById: titlesById,
      });
      combined.missingRequired.push(
        ...analyzed.missing_required.map((item) => ({
          title: item.title,
          reason: item.reason,
          priority: item.priority,
        })),
      );
      combined.missingRecommended.push(
        ...analyzed.missing_recommended.map((item) => ({
          title: item.title,
          reason: item.reason,
          priority: item.priority,
        })),
      );
      combined.unmetRequired.push(
        ...analyzed.unmet_mastery_required.map((item) => ({
          title: item.title,
          reason: item.reason,
          priority: item.priority,
        })),
      );
      combined.unmetRecommended.push(
        ...analyzed.unmet_mastery_recommended.map((item) => ({
          title: item.title,
          reason: item.reason,
          priority: item.priority,
        })),
      );
    }

    function dedupe(items: Array<{ title: string; reason?: string; priority: number }>) {
      const map = new Map<string, { title: string; reason?: string; priority: number }>();
      for (const item of items) {
        const key = item.title;
        const existing = map.get(key);
        if (!existing) {
          map.set(key, item);
          continue;
        }
        map.set(key, {
          title: key,
          priority: Math.min(existing.priority, item.priority),
          reason:
            existing.reason && item.reason && existing.reason !== item.reason
              ? `${existing.reason}; ${item.reason}`
              : existing.reason ?? item.reason,
        });
      }
      return [...map.values()].sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return a.title.localeCompare(b.title, "ru");
      });
    }

    return {
      missingRequired: dedupe(combined.missingRequired),
      missingRecommended: dedupe(combined.missingRecommended),
      unmetRequired: dedupe(combined.unmetRequired),
      unmetRecommended: dedupe(combined.unmetRecommended),
    };
  }, [state.selectedModuleIds, state.skillCountsByModule, topicDataById]);

  function setSelectedModules(moduleIds: string[]) {
    dispatch({ type: "setSelectedModuleIds", moduleIds });
    const nextActive = moduleIds.includes(activeModuleId ?? "") ? activeModuleId : moduleIds[0] ?? null;
    dispatch({ type: "setActiveModuleId", moduleId: nextActive });
  }

  function toggleModule(moduleId: string) {
    const isSelected = state.selectedModuleIds.includes(moduleId);

    if (state.mode === "single") {
      setSelectedModules([moduleId]);
      setInlineValidation(null);
      setNotice(null);
      return;
    }

    if (isSelected) {
      setSelectedModules(state.selectedModuleIds.filter((id) => id !== moduleId));
      setInlineValidation(null);
      return;
    }

    if (state.selectedModuleIds.length >= MAX_MULTI_MODULES) return;
    setSelectedModules([...state.selectedModuleIds, moduleId]);
    setInlineValidation(null);
    setNotice(null);
  }

  function removeModule(moduleId: string) {
    setSelectedModules(state.selectedModuleIds.filter((id) => id !== moduleId));
  }

  function setBranchSelectionForActive(branchIds: string[]) {
    if (!activeModuleId) return;
    dispatch({ type: "setBranchIdsForModule", moduleId: activeModuleId, branchIds });
    setInlineValidation(null);
  }

  function setRouteForActive(routeId: string | null) {
    if (!activeModuleId) return;
    dispatch({ type: "setRouteForModule", moduleId: activeModuleId, routeId });
    const topic = topicDataById[activeModuleId];
    if (!topic) return;
    const route = topic.routes?.find((item) => item.routeId === routeId) ?? null;
    const routeSkillSet = route ? new Set(route.steps.map((step) => step.skill_id)) : null;
    const branchIds = Array.from(
      new Set(
        topic.skills
          .filter((skill) => (routeSkillSet ? routeSkillSet.has(skill.id) : true))
          .map((skill) => skill.branchId)
          .filter((value): value is string => Boolean(value)),
      ),
    );
    dispatch({ type: "setBranchIdsForModule", moduleId: activeModuleId, branchIds });
    setInlineValidation(null);
  }

  function updateSkillCount(moduleId: string, skillId: string, count: number) {
    dispatch({ type: "setSkillCount", moduleId, skillId, count });
    setInlineValidation(null);
  }

  function addAllSkillsForActive() {
    if (!activeModuleId) return;
    const updates: Record<string, number> = {};
    const moduleCounts = state.skillCountsByModule[activeModuleId] ?? {};
    for (const skill of activeSkillsForSelectedBranches) {
      updates[skill.id] = Math.max(1, moduleCounts[skill.id] ?? 0);
    }
    dispatch({ type: "setSkillCountsForModule", moduleId: activeModuleId, updates });
    setInlineValidation(null);
  }

  function clearSkillsForActive() {
    if (!activeModuleId) return;
    const topic = topicDataById[activeModuleId];
    if (!topic) return;
    const updates: Record<string, number> = {};
    for (const skill of topic.skills) {
      updates[skill.id] = 0;
    }
    dispatch({ type: "setSkillCountsForModule", moduleId: activeModuleId, updates });
  }

  function isStepValid(step: WizardStep) {
    if (step === 1) {
      if (state.mode === "single") return state.selectedModuleIds.length === 1;
      return state.selectedModuleIds.length >= 2 && state.selectedModuleIds.length <= MAX_MULTI_MODULES;
    }

    if (step === 2) {
      if (state.selectedModuleIds.length === 0) return false;
      return state.selectedModuleIds.every((moduleId) => {
        const branchGroups = branchGroupsByModule[moduleId] ?? [];
        if (branchGroups.length === 0) return false;
        const selected = state.selectedBranchIdsByModule[moduleId] ?? [];
        return selected.length > 0;
      });
    }

    if (step === 3) return summary.total > 0;

    if (step === 4) {
      if (summary.total < 1) return false;
      if (state.workMeta.workType === "custom" && state.workMeta.customTypeLabel.trim().length === 0) return false;
      return true;
    }

    return false;
  }

  function getFirstValidationMessage(step: WizardStep) {
    if (step === 1) {
      if (state.mode === "single" && state.selectedModuleIds.length !== 1) return t.validationSelectTopic;
      if (state.mode === "multi" && state.selectedModuleIds.length < 2) return t.validationSelectTwoTopics;
    }
    if (step === 2 && !isStepValid(2)) return t.validationSelectBranch;
    if (step === 3 && summary.total < 1) return t.validationSelectSkills;
    if (step === 4 && state.workMeta.workType === "custom" && state.workMeta.customTypeLabel.trim().length === 0) {
      return t.validationCustomType;
    }
    return null;
  }

  const maxReachableStep: WizardStep = (() => {
    if (!isStepValid(1)) return 1;
    if (!isStepValid(2)) return 2;
    if (!isStepValid(3)) return 3;
    return 4;
  })();

  function goNext() {
    const validation = getFirstValidationMessage(state.step);
    if (validation) {
      setInlineValidation(validation);
      return;
    }
    setInlineValidation(null);
    dispatch({ type: "setStep", step: Math.min(4, state.step + 1) as WizardStep });
  }

  function goBack() {
    setInlineValidation(null);
    dispatch({ type: "setStep", step: Math.max(1, state.step - 1) as WizardStep });
  }

  async function handleGenerate() {
    if (!csrfToken) {
      setError({ message: "Не удалось получить CSRF-токен." });
      return;
    }
    const validation = getFirstValidationMessage(4) ?? (summary.total < 1 ? t.validationSelectSkills : null);
    if (validation) {
      setInlineValidation(validation);
      return;
    }

    setBuilding(true);
    setError(null);
    setInlineValidation(null);

    try {
      const workTypeForApi: WorkType = state.workMeta.workType === "custom" ? "quiz" : state.workMeta.workType;
      const customTitle = state.workMeta.workType === "custom" ? state.workMeta.customTypeLabel.trim().slice(0, 80) : null;
      const titleTemplate = {
        customTitle,
        date: state.workMeta.showDateInPdf ? state.workMeta.date || null : null,
      };

      const plan = state.selectedModuleIds.flatMap((moduleId) => {
        const topic = topicDataById[moduleId];
        const counts = state.skillCountsByModule[moduleId] ?? {};
        const routeId = state.routeIdByModule[moduleId] ?? null;
        const route = activeRouteByModule.get(moduleId) ?? null;
        const routeBandsBySkill = new Map<string, DifficultyBand[]>();
        for (const step of route?.steps ?? []) {
          const current = routeBandsBySkill.get(step.skill_id) ?? [];
          routeBandsBySkill.set(step.skill_id, [...new Set([...current, ...step.allowed_bands])]);
        }
        if (!topic) return [];
        return topic.skills
          .map((skill) => {
            const need = Math.trunc(counts[skill.id] ?? 0);
            if (need <= 0) return null;
            const routeBands = routeBandsBySkill.get(skill.id) ?? [];
            if (route && routeBands.length === 0) return null;
            const available = route
              ? routeBands.reduce((sum, band) => sum + (skill.availableByBand?.[band] ?? 0), 0)
              : (skill.availableCount ?? 0);
            const count = Math.min(need, available);
            if (count <= 0) return null;
            return {
              topicId: moduleId,
              skillId: skill.id,
              count,
              ...(routeId ? { routeId } : {}),
              ...(routeBands.length > 0 ? { allowedBands: routeBands } : {}),
            };
          })
          .filter((item): item is NonNullable<typeof item> => Boolean(item));
      });

      const primaryTopicId = state.selectedModuleIds[0] ?? null;
      if (!primaryTopicId) {
        setInlineValidation(t.validationSelectTopic);
        setBuilding(false);
        return;
      }

      const response = await fetch("/api/teacher/demo/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
        credentials: "same-origin",
        body: JSON.stringify({
          locale,
          topicId: primaryTopicId,
          topics: state.selectedModuleIds,
          variantsCount: 2,
          workType: workTypeForApi,
          printLayout: "single",
          shuffleOrder: false,
          titleTemplate,
          plan,
        }),
      });

      const payload = (await response.json()) as GenerateResponse;
      if (!response.ok || !payload.ok) {
        const parsedError = parseTeacherError(payload, "Не удалось собрать варианты.");
        if (parsedError.code === "RATE_LIMITED") {
          setRequiresGuestRegistration(true);
        }
        setError(parsedError);
        return;
      }

      setRequiresGuestRegistration(false);
      const nextWorkId = typeof payload.workId === "string" ? payload.workId : null;
      if (nextWorkId) {
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

  const moduleTabs =
    state.mode === "multi" ? (
      <div className="flex gap-2 overflow-x-auto pb-1">
        {state.selectedModuleIds.map((moduleId) => {
          const isActive = moduleId === activeModuleId;
          const status = moduleStatus.get(moduleId);
          const label = topicTitleById.get(moduleId) ?? moduleId;
          return (
            <button
              key={moduleId}
              type="button"
              onClick={() => dispatch({ type: "setActiveModuleId", moduleId })}
              className={[
                "inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold",
                isActive
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100",
              ].join(" ")}
            >
              <span>{label}</span>
              <span>{status?.ok ? "✅" : "⚠️"}</span>
            </button>
          );
        })}
      </div>
    ) : null;

  const activeTopicRoutes = activeModuleId ? topicDataById[activeModuleId]?.routes ?? [] : [];
  const activeRouteId = activeModuleId ? (state.routeIdByModule[activeModuleId] ?? null) : null;

  return (
    <main className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">Teacher tools</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{t.title}</h1>
        <p className="mt-3 max-w-4xl text-base leading-7 text-slate-600">{t.subtitle}</p>
      </section>

      {notice ? (
        <SurfaceCard className="border-amber-300 bg-amber-50 p-4">
          <p className="text-sm text-amber-900">{notice}</p>
        </SurfaceCard>
      ) : null}

      {error ? <TeacherErrorState error={error} locale={locale} /> : null}

      {requiresGuestRegistration ? (
        <SurfaceCard className="border-amber-300 bg-amber-50 p-6">
          <h2 className="text-lg font-semibold text-amber-950">{t.demoLimitTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-amber-900">{t.demoLimitBody}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/${locale}/teacher-cabinet`}
              className="inline-flex items-center justify-center rounded-lg border border-amber-950 bg-amber-950 px-3 py-2 text-sm font-medium text-white hover:bg-amber-800"
            >
              {t.demoLimitSignIn}
            </Link>
            <Link
              href={`/${locale}/teacher-cabinet`}
              className="inline-flex items-center justify-center rounded-lg border border-amber-500 bg-white px-3 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100"
            >
              {t.demoLimitSignUp}
            </Link>
          </div>
        </SurfaceCard>
      ) : null}

      <SurfaceCard className="p-6">
        <nav aria-label={t.stepperLabel} className="mb-6">
          <ol className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {([1, 2, 3, 4] as const).map((stepNumber) => {
              const isCurrent = state.step === stepNumber;
              const isClickable = stepNumber <= maxReachableStep;
              const isDone = stepNumber < state.step;
              return (
                <li key={stepNumber}>
                  <button
                    type="button"
                    disabled={!isClickable}
                    onClick={() => dispatch({ type: "setStep", step: stepNumber })}
                    aria-current={isCurrent ? "step" : undefined}
                    className={[
                      "flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left",
                      isCurrent
                        ? "border-slate-900 bg-slate-900 text-white"
                        : isDone
                          ? "border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
                          : "border-slate-200 bg-slate-50 text-slate-500",
                      !isClickable ? "cursor-not-allowed opacity-60" : "",
                    ].join(" ")}
                  >
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-current text-xs font-semibold">
                      {stepNumber}
                    </span>
                    <span className="text-sm font-medium">{t.steps[stepNumber]}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        {state.step >= 2 && breadcrumb ? (
          <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            {breadcrumb}
          </div>
        ) : null}

        {state.step === 1 ? (
          <section className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t.modeLabel}</span>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    dispatch({ type: "setMode", mode: "single" });
                    setNotice(null);
                  }}
                  className={[
                    "rounded-full border px-3 py-1.5 text-xs font-semibold",
                    state.mode === "single"
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100",
                  ].join(" ")}
                >
                  {t.modeSingle}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    dispatch({ type: "setMode", mode: "multi" });
                    setNotice(null);
                  }}
                  className={[
                    "rounded-full border px-3 py-1.5 text-xs font-semibold",
                    state.mode === "multi"
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100",
                  ].join(" ")}
                >
                  {t.modeMulti}
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-500">{t.modeHint}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t.grade}</span>
                <select
                  value={state.gradeTag === "all" ? "all" : String(state.gradeTag)}
                  onChange={(event) => {
                    dispatch({
                      type: "setGradeTag",
                      gradeTag: event.target.value === "all" ? "all" : Number(event.target.value),
                    });
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                >
                  <option value="all">{t.allGrades}</option>
                  {gradeOptions.map((grade) => (
                    <option key={grade} value={grade}>
                      {formatNumber(locale, grade)}
                    </option>
                  ))}
                </select>
              </label>

              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t.subject}</span>
                <div className="flex flex-wrap gap-2">
                  {(["all", ...subjectOptions] as const).map((subject) => (
                    <button
                      key={subject}
                      type="button"
                      onClick={() => dispatch({ type: "setSubject", subject })}
                      className={[
                        "rounded-full border px-3 py-1 text-xs font-semibold",
                        state.subject === subject
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100",
                      ].join(" ")}
                    >
                      {subject === "all" ? t.allSubjects : t.domains[subject]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <span>
                {t.selectedThemesCount}: {formatNumber(locale, state.selectedModuleIds.length)}
              </span>
              {state.mode === "multi" ? <span>{t.maxThemesHint}</span> : null}
            </div>

            {state.mode === "multi" && state.selectedModuleIds.length > 0 ? (
              <div className="space-y-2">
                <h2 className="text-sm font-semibold text-slate-900">{t.basket}</h2>
                <div className="flex flex-wrap gap-2">
                  {state.selectedModuleIds.map((moduleId) => (
                    <span
                      key={moduleId}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700"
                    >
                      {topicTitleById.get(moduleId) ?? moduleId}
                      <button
                        type="button"
                        aria-label={t.removeTheme}
                        onClick={() => removeModule(moduleId)}
                        className="rounded-full px-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <h2 className="text-base font-semibold text-slate-900">{t.topics}</h2>
              {filteredTopics.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  {t.noTopics}
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {filteredTopics.map((topic) => {
                    const selected = state.selectedModuleIds.includes(topic.topicId);
                    const disabled =
                      state.mode === "multi" &&
                      !selected &&
                      state.selectedModuleIds.length >= MAX_MULTI_MODULES;

                    return (
                      <button
                        key={topic.topicId}
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                          toggleModule(topic.topicId);
                          setInlineValidation(null);
                        }}
                        className={[
                          "rounded-xl border p-4 text-left transition-colors",
                          selected
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-300 bg-white text-slate-900 hover:bg-slate-50",
                          disabled ? "cursor-not-allowed opacity-50" : "",
                        ].join(" ")}
                      >
                        <p className="font-semibold">{topic.title}</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        ) : null}

        {state.step === 2 ? (
          <section className="space-y-4">
            {moduleTabs}
            <div>
              <h2 className="text-base font-semibold text-slate-900">{t.branches}</h2>
              <p className="mt-1 text-sm text-slate-600">{t.branchesHint}</p>
            </div>

            {activeModuleId && loadingTopics[activeModuleId] ? (
              <p className="text-sm text-slate-500">Loading...</p>
            ) : null}

            {!activeModuleId ? null : (
              <div className="space-y-3">
                {activeTopicRoutes.length > 0 ? (
                  <label className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t.routeLabel}</span>
                    <select
                      value={activeRouteId ?? ""}
                      onChange={(event) => setRouteForActive(event.target.value || null)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                    >
                      <option value="">{t.routeNone}</option>
                      {activeTopicRoutes.map((route) => (
                        <option key={route.routeId} value={route.routeId}>
                          {route.title}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setBranchSelectionForActive(activeBranchGroups.map((branch) => branch.id))}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    {t.selectAllBranches}
                  </button>
                  <button
                    type="button"
                    onClick={() => setBranchSelectionForActive([])}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    {t.clearBranches}
                  </button>
                  <span className="text-xs text-slate-500">
                    {t.branchCounter}: {formatNumber(locale, (state.selectedBranchIdsByModule[activeModuleId] ?? []).length)}
                  </span>
                  {state.mode === "multi" ? (
                    <button
                      type="button"
                      onClick={() => removeModule(activeModuleId)}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                    >
                      {t.removeTheme}
                    </button>
                  ) : null}
                </div>

                <div className="space-y-2">
                  {activeBranchGroups.map((branch) => {
                    const checked = activeSelectedBranchSet.has(branch.id);
                    return (
                      <label
                        key={branch.id}
                        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(event) => {
                            const current = state.selectedBranchIdsByModule[activeModuleId] ?? [];
                            if (event.target.checked) {
                              setBranchSelectionForActive([...current, branch.id]);
                            } else {
                              setBranchSelectionForActive(current.filter((id) => id !== branch.id));
                            }
                          }}
                          className="h-4 w-4 rounded border-slate-300"
                        />
                        <span>{branch.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        ) : null}

        {state.step === 3 ? (
          <section className="space-y-4">
            {moduleTabs}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-slate-900">{t.skills}</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={addAllSkillsForActive}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  {t.addAllSkills}
                </button>
                <button
                  type="button"
                  onClick={clearSkillsForActive}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  {t.clearSkills}
                </button>
                {state.mode === "multi" && activeModuleId ? (
                  <button
                    type="button"
                    onClick={() => removeModule(activeModuleId)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    {t.removeTheme}
                  </button>
                ) : null}
              </div>
            </div>

            {activeBranchGroups.filter((branch) => activeSelectedBranchSet.has(branch.id)).length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                {t.noSkillsForBranches}
              </div>
            ) : (
              <div className="space-y-3">
                {activeBranchGroups
                  .filter((branch) => activeSelectedBranchSet.has(branch.id))
                  .map((branch) => (
                    <details key={branch.id} open className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <summary className="cursor-pointer text-sm font-semibold text-slate-900">{branch.label}</summary>
                      <div className="mt-3 space-y-2">
                        {branch.skills.map((skill) => {
                          if (!activeModuleId) return null;
                          const moduleCounts = state.skillCountsByModule[activeModuleId] ?? {};
                          const value = moduleCounts[skill.id] ?? 0;
                          const disabled = skill.status === "soon";
                          const routeBands = routeBandsBySkillForActive.get(skill.id) ?? [];
                          const hasRoute = routeBands.length > 0;
                          const levels = skill.availableByDifficulty ?? { 1: 0, 2: 0, 3: 0 };
                          const levelsText = [1, 2, 3]
                            .map((level) => `L${level}: ${formatNumber(locale, levels[level as 1 | 2 | 3])}`)
                            .join(", ");
                          const availableFromRoute = routeBands.reduce(
                            (sum, band) => sum + (skill.availableByBand?.[band] ?? 0),
                            0,
                          );
                          const availableCount = hasRoute ? availableFromRoute : (skill.availableCount ?? 0);
                          const bandsText = hasRoute
                            ? routeBands.map((band) => `${band}: ${formatNumber(locale, skill.availableByBand?.[band] ?? 0)}`).join(", ")
                            : "";

                          return (
                            <div key={skill.id} className="rounded-lg border border-slate-200 bg-white p-3">
                              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div className="min-w-0">
                                  <p className="font-medium text-slate-950">
                                    {skill.title}{" "}
                                    {hasRoute ? (
                                      <span className="rounded-full border border-slate-300 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                                        {t.routeBadge} {formatBands(routeBands)}
                                      </span>
                                    ) : null}
                                  </p>
                                  {skill.summary ? <p className="mt-1 text-sm text-slate-600">{skill.summary}</p> : null}
                                  {skill.example ? (
                                    <p className="mt-1 text-sm text-slate-700">
                                      <span className="font-medium text-slate-900">{t.example}:</span> {skill.example}
                                    </p>
                                  ) : null}
                                  <p className="mt-1 text-xs text-slate-500">
                                    {t.available}: {formatNumber(locale, availableCount)}
                                  </p>
                                  {hasRoute ? (
                                    <p className="mt-1 text-xs text-slate-500">
                                      {t.levelsAvailability}: {bandsText}
                                    </p>
                                  ) : (
                                    <p className="mt-1 text-xs text-slate-500">
                                      {t.levelsAvailability}: {levelsText}
                                    </p>
                                  )}
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                  <button
                                    type="button"
                                    disabled={disabled}
                                    aria-label={`Decrease ${skill.title}`}
                                    onClick={() => updateSkillCount(activeModuleId, skill.id, value - 1)}
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
                                    onChange={(event) => updateSkillCount(activeModuleId, skill.id, Number(event.target.value || 0))}
                                    className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-center text-sm"
                                  />
                                  <button
                                    type="button"
                                    disabled={disabled}
                                    aria-label={`Increase ${skill.title}`}
                                    onClick={() => updateSkillCount(activeModuleId, skill.id, value + 1)}
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
                    </details>
                  ))}
              </div>
            )}
          </section>
        ) : null}

        {state.step === 4 ? (
          <section className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t.workType}</span>
                <select
                  value={state.workMeta.workType}
                  onChange={(event) =>
                    dispatch({
                      type: "setWorkMeta",
                      patch: { workType: event.target.value as WorkTypeUi },
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                >
                  <option value="homework">{t.workTypes.homework}</option>
                  <option value="lesson">{t.workTypes.lesson}</option>
                  <option value="quiz">{t.workTypes.quiz}</option>
                  <option value="test">{t.workTypes.test}</option>
                  <option value="custom">{t.workTypes.custom}</option>
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t.date}</span>
                <input
                  type="date"
                  value={state.workMeta.date}
                  onChange={(event) => dispatch({ type: "setWorkMeta", patch: { date: event.target.value } })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                />
              </label>
            </div>

            {state.workMeta.workType === "custom" ? (
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t.customTypeLabel}</span>
                <input
                  type="text"
                  value={state.workMeta.customTypeLabel}
                  onChange={(event) =>
                    dispatch({ type: "setWorkMeta", patch: { customTypeLabel: event.target.value.slice(0, 80) } })
                  }
                  placeholder={t.customTypePlaceholder}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                />
              </label>
            ) : null}

            <label className="inline-flex items-center gap-2 text-sm text-slate-800">
              <input
                type="checkbox"
                checked={state.workMeta.showDateInPdf}
                onChange={(event) => dispatch({ type: "setWorkMeta", patch: { showDateInPdf: event.target.checked } })}
                className="h-4 w-4 rounded border-slate-300"
              />
              {t.showDateInPdf}
            </label>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">{t.summaryTotal}</p>
              <p className="mt-1 text-2xl font-bold text-slate-950">{formatNumber(locale, summary.total)}</p>

              <p className="mt-4 text-sm font-semibold text-slate-900">{t.summaryByThemes}</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                {summary.byModule.map((item) => (
                  <li key={item.moduleId} className="flex items-center justify-between gap-2">
                    <span>{item.title}</span>
                    <span className="font-semibold text-slate-900">{item.total}</span>
                  </li>
                ))}
              </ul>

              <p className="mt-4 text-sm font-semibold text-slate-900">{t.summaryBySkills}</p>
              {summary.byModule.flatMap((item) => item.selectedSkills).length === 0 ? (
                <p className="mt-1 text-sm text-slate-500">{t.emptySummary}</p>
              ) : (
                <ul className="mt-2 space-y-1">
                  {summary.byModule.flatMap((item) =>
                    item.selectedSkills.map(({ skill, count }) => (
                      <li key={`${item.moduleId}:${skill.id}`} className="flex items-center justify-between gap-2 text-sm text-slate-700">
                        <span className="min-w-0">
                          {state.mode === "multi" ? `${item.title}: ${skill.title}` : skill.title}
                        </span>
                        <span className="font-semibold text-slate-900">{count}</span>
                      </li>
                    )),
                  )}
                </ul>
              )}

              <p className="mt-4 text-sm font-semibold text-slate-900">{t.summaryByBands}</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                {(["A", "B", "C"] as const).map((band) => (
                  <li key={band} className="flex items-center justify-between gap-2">
                    <span>{band}</span>
                    <span className="font-semibold text-slate-900">{formatNumber(locale, summary.byBands[band])}</span>
                  </li>
                ))}
              </ul>

              {summary.warnings.length > 0 ? (
                <>
                  <p className="mt-4 text-sm font-semibold text-amber-900">{t.routeWarnings}</p>
                  <ul className="mt-2 space-y-1 text-sm text-amber-900">
                    {summary.warnings.map((warning) => (
                      <li key={`${warning.moduleId}:${warning.skillId}`}>
                        {warning.moduleTitle}: {warning.skillTitle} ({t.planNeed} {warning.need}, {t.planAvailable} {warning.available},{" "}
                        {t.planSelected} {warning.selected}
                        {warning.bands.length > 0 ? `, ${formatBands(warning.bands)}` : ""})
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}

              {prereqSummary.missingRequired.length > 0 ||
              prereqSummary.missingRecommended.length > 0 ||
              prereqSummary.unmetRequired.length > 0 ||
              prereqSummary.unmetRecommended.length > 0 ? (
                <>
                  <p className="mt-4 text-sm font-semibold text-slate-900">{t.prereqTitle}</p>

                  {prereqSummary.missingRequired.length > 0 ? (
                    <>
                      <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-rose-700">{t.prereqRequired}</p>
                      <ul className="mt-1 space-y-1 text-sm text-rose-700">
                        {prereqSummary.missingRequired.map((item) => (
                          <li key={`pre:req:${item.title}`}>{item.reason ? `${item.title} — ${item.reason}` : item.title}</li>
                        ))}
                      </ul>
                    </>
                  ) : null}

                  {prereqSummary.missingRecommended.length > 0 ? (
                    <>
                      <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-amber-800">{t.prereqRecommended}</p>
                      <ul className="mt-1 space-y-1 text-sm text-amber-800">
                        {prereqSummary.missingRecommended.map((item) => (
                          <li key={`pre:rec:${item.title}`}>{item.reason ? `${item.title} — ${item.reason}` : item.title}</li>
                        ))}
                      </ul>
                    </>
                  ) : null}

                  {prereqSummary.unmetRequired.length > 0 ? (
                    <>
                      <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-rose-700">{t.prereqUnmetRequired}</p>
                      <ul className="mt-1 space-y-1 text-sm text-rose-700">
                        {prereqSummary.unmetRequired.map((item) => (
                          <li key={`pre:unmet:req:${item.title}`}>{item.reason ? `${item.title} — ${item.reason}` : item.title}</li>
                        ))}
                      </ul>
                    </>
                  ) : null}

                  {prereqSummary.unmetRecommended.length > 0 ? (
                    <>
                      <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-amber-800">{t.prereqUnmetRecommended}</p>
                      <ul className="mt-1 space-y-1 text-sm text-amber-800">
                        {prereqSummary.unmetRecommended.map((item) => (
                          <li key={`pre:unmet:rec:${item.title}`}>{item.reason ? `${item.title} — ${item.reason}` : item.title}</li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                </>
              ) : null}
            </div>

            {hasAnyEmptyTheme ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                {t.emptyThemeWarning}
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleGenerate}
              disabled={requiresGuestRegistration || building || !isStepValid(4)}
              className="inline-flex w-full items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {building ? t.building : t.build}
            </button>
          </section>
        ) : null}

        {inlineValidation ? (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
            {inlineValidation}
          </div>
        ) : null}

        <div className="mt-6 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={goBack}
            disabled={state.step === 1}
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t.back}
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={state.step === 4}
            className="inline-flex items-center rounded-lg border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t.next}
          </button>
        </div>
      </SurfaceCard>
    </main>
  );
}
