"use client";

import Link from "next/link";
import { useEffect, useMemo, useReducer, useState } from "react";
import { useRouter } from "next/navigation";

import { SurfaceCard } from "@/src/components/ui/SurfaceCard";
import { TeacherErrorState, type TeacherApiError } from "@/src/components/ui/TeacherErrorState";
import { listContentTopicConfigs } from "@/src/lib/content/topic-registry";
import { formatNumber } from "@/src/lib/i18n/format";
import { getTopicDomains, topicCatalogEntries, type TopicDomain } from "@/src/lib/topicMeta";
import { type WorkType } from "@/src/lib/variants/print-recommendation";

type Locale = "ru" | "en" | "de";
type Props = { locale: Locale };
type GradeFilter = number | "all";
type SubjectFilter = TopicDomain | "all";
type WizardStep = 1 | 2 | 3 | 4;
type WorkTypeUi = WorkType | "custom";

type TopicSkill = {
  id: string;
  title: string;
  branchId?: string;
  summary?: string;
  example?: string;
  cardHref?: string;
  availableCount?: number;
  availableByDifficulty?: { 1: number; 2: number; 3: number };
  status?: "ready" | "soon";
};

type TopicPayload = {
  topicId: string;
  sectionId?: string;
  moduleId?: string;
  gradeTags?: number[];
  title: Record<Locale, string>;
  skills: TopicSkill[];
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
  gradeTag: GradeFilter;
  subject: SubjectFilter;
  topicId: string | null;
  selectedBranchIds: string[];
  skillCountsById: Record<string, number>;
  workMeta: WorkMeta;
};

type WizardAction =
  | { type: "setStep"; step: WizardStep }
  | { type: "setGradeTag"; gradeTag: GradeFilter }
  | { type: "setSubject"; subject: SubjectFilter }
  | { type: "selectTopic"; topicId: string | null }
  | { type: "setSelectedBranchIds"; branchIds: string[] }
  | { type: "setSkillCount"; skillId: string; count: number }
  | { type: "setManySkillCounts"; updates: Record<string, number> }
  | { type: "setWorkMeta"; patch: Partial<WorkMeta> }
  | { type: "resetTopicFlow" };

type GenerateResponse = {
  ok?: boolean;
  workId?: string;
  code?: string;
  message?: string;
  details?: unknown;
};

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
    grade: "Класс",
    allGrades: "Все классы",
    subject: "Предмет",
    allSubjects: "Все предметы",
    topics: "Темы",
    noTopics: "По текущим фильтрам темы не найдены.",
    topicResetNotice: "Выбранная тема недоступна для этого класса. Выберите тему заново.",
    branches: "Подтемы",
    branchesHint: "По умолчанию выбраны все подтемы — так быстрее собрать вариант.",
    selectAllBranches: "Выбрать все",
    clearBranches: "Снять все",
    branchCounter: "Выбрано подтем",
    skills: "Навыки",
    addAllSkills: "Добавить все навыки",
    clearSkills: "Очистить",
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
    emptySummary: "Выберите навыки и добавьте хотя бы одну задачу.",
    validationSelectTopic: "Выберите тему, чтобы продолжить.",
    validationSelectBranch: "Выберите хотя бы одну подтему.",
    validationSelectSkills: "Добавьте хотя бы одну задачу по навыкам.",
    validationCustomType: "Для типа «Своё» укажите название.",
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
  },
  en: {
    title: "Skill Variant Builder",
    subtitle: "Build a worksheet in 4 steps: topic, branches, skills, then generate.",
    steps: {
      1: "Topic",
      2: "Branches",
      3: "Skills",
      4: "Settings",
    },
    stepperLabel: "Wizard steps",
    next: "Next",
    back: "Back",
    build: "Generate variants",
    building: "Generating...",
    grade: "Grade",
    allGrades: "All grades",
    subject: "Subject",
    allSubjects: "All subjects",
    topics: "Topics",
    noTopics: "No topics for current filters.",
    topicResetNotice: "Selected topic is unavailable for this grade. Choose another topic.",
    branches: "Subtopics",
    branchesHint: "All subtopics are selected by default for faster setup.",
    selectAllBranches: "Select all",
    clearBranches: "Clear all",
    branchCounter: "Selected subtopics",
    skills: "Skills",
    addAllSkills: "Add all skills",
    clearSkills: "Clear",
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
    summaryBySkills: "Distribution by skills",
    emptySummary: "Select skills and add at least one task.",
    validationSelectTopic: "Select a topic to continue.",
    validationSelectBranch: "Select at least one subtopic.",
    validationSelectSkills: "Add at least one skill task.",
    validationCustomType: "Provide a custom type label.",
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
  },
  de: {
    title: "Varianten-Baukasten",
    subtitle: "Arbeitsblatt in 4 Schritten: Thema, Unterthemen, Skills, Parameter.",
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
    grade: "Klasse",
    allGrades: "Alle Klassen",
    subject: "Fach",
    allSubjects: "Alle Fächer",
    topics: "Themen",
    noTopics: "Keine Themen für aktuelle Filter.",
    topicResetNotice: "Gewähltes Thema ist für diese Klasse nicht verfügbar. Bitte neu wählen.",
    branches: "Unterthemen",
    branchesHint: "Standardmäßig sind alle Unterthemen gewählt für schnellere Erstellung.",
    selectAllBranches: "Alle wählen",
    clearBranches: "Alle abwählen",
    branchCounter: "Gewählte Unterthemen",
    skills: "Skills",
    addAllSkills: "Alle Skills hinzufügen",
    clearSkills: "Leeren",
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
    summaryBySkills: "Verteilung nach Skills",
    emptySummary: "Wählen Sie Skills und fügen Sie mindestens eine Aufgabe hinzu.",
    validationSelectTopic: "Wählen Sie ein Thema.",
    validationSelectBranch: "Wählen Sie mindestens ein Unterthema.",
    validationSelectSkills: "Fügen Sie mindestens eine Skill-Aufgabe hinzu.",
    validationCustomType: "Bitte benennen Sie den eigenen Typ.",
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
  };
  const map = locale === "ru" ? ru : locale === "de" ? de : en;
  if (map[key]) return map[key];
  const part = branchId.split(".").at(-1) ?? branchId;
  return slugToTitle(part);
}

function reducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "setStep":
      return { ...state, step: action.step };
    case "setGradeTag":
      return { ...state, gradeTag: action.gradeTag };
    case "setSubject":
      return { ...state, subject: action.subject };
    case "selectTopic":
      return {
        ...state,
        topicId: action.topicId,
        step: action.topicId ? 2 : 1,
        selectedBranchIds: [],
        skillCountsById: {},
      };
    case "setSelectedBranchIds":
      return { ...state, selectedBranchIds: action.branchIds };
    case "setSkillCount":
      return {
        ...state,
        skillCountsById: {
          ...state.skillCountsById,
          [action.skillId]: clamp(Math.trunc(action.count), 0, 30),
        },
      };
    case "setManySkillCounts":
      return {
        ...state,
        skillCountsById: {
          ...state.skillCountsById,
          ...action.updates,
        },
      };
    case "setWorkMeta":
      return { ...state, workMeta: { ...state.workMeta, ...action.patch } };
    case "resetTopicFlow":
      return {
        ...state,
        step: 1,
        topicId: null,
        selectedBranchIds: [],
        skillCountsById: {},
      };
    default:
      return state;
  }
}

const initialState: WizardState = {
  step: 1,
  gradeTag: "all",
  subject: "all",
  topicId: null,
  selectedBranchIds: [],
  skillCountsById: {},
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
  const [selectedTopic, setSelectedTopic] = useState<TopicPayload | null>(null);
  const [loadingTopic, setLoadingTopic] = useState(false);
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState<TeacherApiError | null>(null);
  const [inlineValidation, setInlineValidation] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [requiresGuestRegistration, setRequiresGuestRegistration] = useState(false);

  const topicConfigs = useMemo(() => listContentTopicConfigs(), []);

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

  useEffect(() => {
    if (!state.topicId) return;
    if (filteredTopics.some((topic) => topic.topicId === state.topicId)) return;
    dispatch({ type: "resetTopicFlow" });
    setSelectedTopic(null);
    setNotice(t.topicResetNotice);
  }, [filteredTopics, state.topicId, t.topicResetNotice]);

  useEffect(() => {
    if (!state.topicId) return;
    let cancelled = false;

    async function loadTopic() {
      setLoadingTopic(true);
      setError(null);
      try {
        const response = await fetch(`/api/teacher/demo/topic?topicId=${encodeURIComponent(state.topicId!)}`);
        const payload = (await response.json()) as { ok?: boolean; topic?: TopicPayload };
        if (!response.ok || !payload.ok || !payload.topic) {
          if (!cancelled) {
            setError(parseTeacherError(payload, "Не удалось загрузить тему."));
            setSelectedTopic(null);
          }
          return;
        }
        if (!cancelled) {
          setSelectedTopic(payload.topic);
          const branchIds = Array.from(
            new Set(payload.topic.skills.map((skill) => skill.branchId).filter((value): value is string => Boolean(value))),
          );
          dispatch({
            type: "setSelectedBranchIds",
            branchIds: branchIds.length > 0 ? branchIds : [],
          });
        }
      } catch {
        if (!cancelled) {
          setError({ message: "Ошибка сети при загрузке темы." });
          setSelectedTopic(null);
        }
      } finally {
        if (!cancelled) setLoadingTopic(false);
      }
    }

    void loadTopic();
    return () => {
      cancelled = true;
    };
  }, [state.topicId]);

  const branchGroups = useMemo<BranchGroup[]>(() => {
    if (!selectedTopic) return [];
    const grouped = new Map<string, TopicSkill[]>();
    for (const skill of selectedTopic.skills) {
      const branchId = skill.branchId ?? "default";
      const existing = grouped.get(branchId) ?? [];
      existing.push(skill);
      grouped.set(branchId, existing);
    }
    return [...grouped.entries()].map(([id, skills]) => ({
      id,
      label: id === "default" ? t.branches : branchLabel(locale, id),
      skills,
    }));
  }, [locale, selectedTopic, t.branches]);

  const selectedBranchSet = useMemo(() => new Set(state.selectedBranchIds), [state.selectedBranchIds]);

  const skillsForSelectedBranches = useMemo(() => {
    return branchGroups
      .filter((branch) => selectedBranchSet.has(branch.id))
      .flatMap((branch) => branch.skills);
  }, [branchGroups, selectedBranchSet]);

  const summary = useMemo(() => {
    const selectedSkills = skillsForSelectedBranches
      .map((skill) => ({ skill, count: state.skillCountsById[skill.id] ?? 0 }))
      .filter((item) => item.count > 0);
    const total = selectedSkills.reduce((sum, item) => sum + item.count, 0);
    return { total, selectedSkills };
  }, [skillsForSelectedBranches, state.skillCountsById]);

  const selectedTopicMeta = useMemo(
    () => allTopics.find((topic) => topic.topicId === state.topicId) ?? null,
    [allTopics, state.topicId],
  );

  const breadcrumb = useMemo(() => {
    if (!selectedTopicMeta || !selectedTopic) return null;
    const subject = selectedTopicMeta.domains[0] ?? "arithmetic";
    const subjectLabel = t.domains[subject];
    const topicLabel = selectedTopic.title[locale] ?? selectedTopic.title.ru ?? selectedTopicMeta.title;
    const selectedBranches = branchGroups.filter((branch) => selectedBranchSet.has(branch.id));
    if (selectedBranches.length === 1) {
      return `${subjectLabel} -> ${topicLabel} -> ${selectedBranches[0]!.label}`;
    }
    return `${subjectLabel} -> ${topicLabel} -> ${t.breadcrumbsManyBranches}: ${selectedBranches.length}`;
  }, [branchGroups, locale, selectedBranchSet, selectedTopic, selectedTopicMeta, t.breadcrumbsManyBranches, t.domains]);

  function setBranchSelection(ids: string[]) {
    dispatch({ type: "setSelectedBranchIds", branchIds: ids });
    setInlineValidation(null);
  }

  function updateSkillCount(skillId: string, count: number) {
    dispatch({ type: "setSkillCount", skillId, count });
    setInlineValidation(null);
  }

  function addAllVisibleSkills() {
    const updates: Record<string, number> = {};
    for (const skill of skillsForSelectedBranches) {
      updates[skill.id] = Math.max(1, state.skillCountsById[skill.id] ?? 0);
    }
    dispatch({ type: "setManySkillCounts", updates });
    setInlineValidation(null);
  }

  function clearVisibleSkills() {
    const updates: Record<string, number> = {};
    for (const skill of skillsForSelectedBranches) {
      updates[skill.id] = 0;
    }
    dispatch({ type: "setManySkillCounts", updates });
  }

  function isStepValid(step: WizardStep) {
    if (step === 1) return Boolean(state.topicId);
    if (step === 2) return state.selectedBranchIds.length > 0;
    if (step === 3) return summary.total > 0;
    if (step === 4) {
      if (summary.total < 1) return false;
      if (state.workMeta.workType === "custom" && state.workMeta.customTypeLabel.trim().length === 0) return false;
      return true;
    }
    return false;
  }

  function getFirstValidationMessage(step: WizardStep) {
    if (step === 1 && !state.topicId) return t.validationSelectTopic;
    if (step === 2 && state.selectedBranchIds.length === 0) return t.validationSelectBranch;
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
    const validation = getFirstValidationMessage(4) ?? (summary.total < 1 ? t.validationSelectSkills : null);
    if (validation) {
      setInlineValidation(validation);
      return;
    }

    setBuilding(true);
    setError(null);
    setInlineValidation(null);
    try {
      const workTypeForApi: WorkType =
        state.workMeta.workType === "custom" ? "quiz" : state.workMeta.workType;
      const customTitle =
        state.workMeta.workType === "custom"
          ? state.workMeta.customTypeLabel.trim().slice(0, 80)
          : null;
      const titleTemplate = {
        customTitle,
        date: state.workMeta.showDateInPdf ? state.workMeta.date || null : null,
      };

      const response = await fetch("/api/teacher/demo/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          locale,
          topicId: state.topicId,
          topics: state.topicId ? [state.topicId] : [],
          variantsCount: 2,
          workType: workTypeForApi,
          printLayout: "single",
          shuffleOrder: false,
          titleTemplate,
          plan: skillsForSelectedBranches
            .map((skill) => ({
              topicId: state.topicId ?? undefined,
              skillId: skill.id,
              count: Math.trunc(state.skillCountsById[skill.id] ?? 0),
            }))
            .filter((item) => item.count > 0),
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

            <div className="space-y-2">
              <h2 className="text-base font-semibold text-slate-900">{t.topics}</h2>
              {filteredTopics.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  {t.noTopics}
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {filteredTopics.map((topic) => {
                    const selected = state.topicId === topic.topicId;
                    return (
                      <button
                        key={topic.topicId}
                        type="button"
                        onClick={() => {
                          dispatch({ type: "selectTopic", topicId: topic.topicId });
                          setNotice(null);
                          setInlineValidation(null);
                        }}
                        className={[
                          "rounded-xl border p-4 text-left transition-colors",
                          selected
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-300 bg-white text-slate-900 hover:bg-slate-50",
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
            <div>
              <h2 className="text-base font-semibold text-slate-900">{t.branches}</h2>
              <p className="mt-1 text-sm text-slate-600">{t.branchesHint}</p>
            </div>
            {loadingTopic ? <p className="text-sm text-slate-500">Loading...</p> : null}

            {!loadingTopic ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setBranchSelection(branchGroups.map((branch) => branch.id))}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    {t.selectAllBranches}
                  </button>
                  <button
                    type="button"
                    onClick={() => setBranchSelection([])}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    {t.clearBranches}
                  </button>
                  <span className="text-xs text-slate-500">
                    {t.branchCounter}: {formatNumber(locale, state.selectedBranchIds.length)}
                  </span>
                </div>

                <div className="space-y-2">
                  {branchGroups.map((branch) => {
                    const checked = selectedBranchSet.has(branch.id);
                    return (
                      <label
                        key={branch.id}
                        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(event) => {
                            if (event.target.checked) {
                              setBranchSelection([...state.selectedBranchIds, branch.id]);
                            } else {
                              setBranchSelection(state.selectedBranchIds.filter((id) => id !== branch.id));
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
            ) : null}
          </section>
        ) : null}

        {state.step === 3 ? (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-slate-900">{t.skills}</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={addAllVisibleSkills}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  {t.addAllSkills}
                </button>
                <button
                  type="button"
                  onClick={clearVisibleSkills}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  {t.clearSkills}
                </button>
              </div>
            </div>

            {branchGroups.filter((branch) => selectedBranchSet.has(branch.id)).length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                {t.noSkillsForBranches}
              </div>
            ) : (
              <div className="space-y-3">
                {branchGroups
                  .filter((branch) => selectedBranchSet.has(branch.id))
                  .map((branch) => (
                    <details key={branch.id} open className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <summary className="cursor-pointer text-sm font-semibold text-slate-900">{branch.label}</summary>
                      <div className="mt-3 space-y-2">
                        {branch.skills.map((skill) => {
                          const value = state.skillCountsById[skill.id] ?? 0;
                          const disabled = skill.status === "soon";
                          const levels = skill.availableByDifficulty ?? { 1: 0, 2: 0, 3: 0 };
                          const levelsText = [1, 2, 3]
                            .map((level) => `L${level}: ${formatNumber(locale, levels[level as 1 | 2 | 3])}`)
                            .join(", ");

                          return (
                            <div key={skill.id} className="rounded-lg border border-slate-200 bg-white p-3">
                              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div className="min-w-0">
                                  <p className="font-medium text-slate-950">{skill.title}</p>
                                  {skill.summary ? <p className="mt-1 text-sm text-slate-600">{skill.summary}</p> : null}
                                  {skill.example ? (
                                    <p className="mt-1 text-sm text-slate-700">
                                      <span className="font-medium text-slate-900">{t.example}:</span> {skill.example}
                                    </p>
                                  ) : null}
                                  {skill.cardHref ? (
                                    <p className="mt-1">
                                      <Link
                                        href={`/${locale}${skill.cardHref}`}
                                        className="text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-hover)]"
                                      >
                                        Skill card
                                      </Link>
                                    </p>
                                  ) : null}
                                  <p className="mt-1 text-xs text-slate-500">
                                    {t.available}: {formatNumber(locale, skill.availableCount ?? 0)}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    {t.levelsAvailability}: {levelsText}
                                  </p>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                  <button
                                    type="button"
                                    disabled={disabled}
                                    aria-label={`Decrease ${skill.title}`}
                                    onClick={() => updateSkillCount(skill.id, value - 1)}
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
                                    onChange={(event) => updateSkillCount(skill.id, Number(event.target.value || 0))}
                                    className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-center text-sm"
                                  />
                                  <button
                                    type="button"
                                    disabled={disabled}
                                    aria-label={`Increase ${skill.title}`}
                                    onClick={() => updateSkillCount(skill.id, value + 1)}
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
                onChange={(event) =>
                  dispatch({ type: "setWorkMeta", patch: { showDateInPdf: event.target.checked } })
                }
                className="h-4 w-4 rounded border-slate-300"
              />
              {t.showDateInPdf}
            </label>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">{t.summaryTotal}</p>
              <p className="mt-1 text-2xl font-bold text-slate-950">{formatNumber(locale, summary.total)}</p>
              <p className="mt-4 text-sm font-semibold text-slate-900">{t.summaryBySkills}</p>
              {summary.selectedSkills.length === 0 ? (
                <p className="mt-1 text-sm text-slate-500">{t.emptySummary}</p>
              ) : (
                <ul className="mt-2 space-y-1">
                  {summary.selectedSkills.map(({ skill, count }) => (
                    <li key={skill.id} className="flex items-center justify-between gap-2 text-sm text-slate-700">
                      <span className="min-w-0">{skill.title}</span>
                      <span className="font-semibold text-slate-900">{count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

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
