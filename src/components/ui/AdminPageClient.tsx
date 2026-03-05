"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { MarkdownMath } from "@/lib/ui/MarkdownMath";
import { SurfaceCard } from "@/src/components/ui/SurfaceCard";
import { buildAdminSectionErrors, formatAdminSectionFailures } from "@/src/components/ui/admin-page-client.utils";
import { formatDateTime } from "@/src/lib/i18n/format";
import { SKILL_KINDS, type SkillKind } from "@/src/lib/skills/kind";

type Locale = "ru" | "en" | "de";

type SessionResponse =
  | { ok: true; authenticated: false; csrfToken?: string }
  | {
      ok: true;
      authenticated: true;
      csrfToken?: string;
      user: {
        id: string;
        role: "student" | "teacher" | "admin";
      };
    }
  | { ok: false; message?: string };

type StudentItem = {
  id: string;
  username: string | null;
  email: string | null;
  mustChangePassword: boolean;
  createdAt: string;
  classesCount: number;
};

type AuditItem = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  payloadJson: unknown;
  createdAt: string;
  actor: {
    id: string;
    role: "student" | "teacher" | "admin";
    email: string | null;
    username: string | null;
  } | null;
};

type TaskAuditField = "statement_md" | "answer" | "difficulty" | "difficulty_band" | "status";
type TaskAuditActionFilter = "all" | "create" | "update" | "delete";
type TaskAuditChangedFieldFilter = "all" | TaskAuditField;

type TaskAuditSnapshot = {
  statement_md: string;
  answer: unknown;
  difficulty: number;
  difficulty_band?: "A" | "B" | "C";
  status?: "draft" | "review" | "ready";
};

type TaskAuditItem = {
  id: string;
  action: string;
  createdAt: string;
  topicId: string | null;
  skillId: string | null;
  changedFields: TaskAuditField[];
  before: TaskAuditSnapshot | null;
  after: TaskAuditSnapshot | null;
  actor: {
    id: string;
    role: "student" | "teacher" | "admin";
    email: string | null;
    username: string | null;
  } | null;
};

type ContentTopicItem = {
  topicId: string;
  title: {
    ru: string;
    en: string;
    de: string;
  };
  domain: string | null;
  status: "ready" | "soon" | null;
  levels: number[];
  gradeTags: number[];
  skillsTotal: number;
  skillsWithTasks: number;
  tasksTotal: number;
  routesTotal: number;
  prereqEdgesTotal: number;
  skills: Array<{
    id: string;
    title: string;
    branchId: string | null;
    availableCount: number;
    status: "ready" | "soon";
    kind: string | null;
  }>;
  warnings: string[];
};

type SkillRegistryItem = {
  topicId: string;
  topicTitle: {
    ru: string;
    en: string;
    de: string;
  };
  topicDomain: string | null;
  topicStatus: "ready" | "soon" | null;
  skillId: string;
  title: string;
  summary: string | null;
  status: "ready" | "soon";
  kind: SkillKind;
  branchId: string | null;
  trainerHref: string | null;
  tasksTotal: number;
  hasOverride: boolean;
  updatedAt: string | null;
};

type SkillReadyDeficitItem = {
  topicId: string;
  skillId: string;
  title: string;
  status: "ready" | "soon";
  coverage: {
    readyTotal: number;
    readyByBand: {
      A: number;
      B: number;
      C: number;
    };
  };
  reasons: string[];
};

type AdminTaskItem = {
  id: string;
  topic_id: string;
  skill_id: string;
  difficulty: number;
  difficulty_band?: "A" | "B" | "C";
  status?: "draft" | "review" | "ready";
  statement_md: string;
  answer: unknown;
};

type DraftAnswerType = "number" | "fraction" | "ratio";

const copy = {
  ru: {
    title: "Админ-панель",
    subtitle: "Управление учениками и просмотр журнала аудита.",
    authRequired: "Доступ только для admin.",
    back: "Назад",
    studentsTitle: "Ученики",
    studentsSearch: "Поиск по username/email",
    classesCount: "Групп",
    resetPassword: "Сбросить пароль",
    temporaryPassword: "Временный пароль",
    temporaryPasswordHint: "Покажите пароль пользователю один раз.",
    noStudents: "Ученики не найдены.",
    auditTitle: "Журнал аудита",
    auditSearch: "Поиск по action/entity",
    auditFilterAll: "Все",
    auditFilterAuth: "Только auth.*",
    auditFilterSuccess: "Успех",
    auditFilterFailure: "Ошибки",
    auditFilterBlocked: "Блокировки",
    noLogs: "События не найдены.",
    refresh: "Обновить",
    contentTitle: "Реестр контента",
    contentSubtitle: "Темы, навыки, покрытие задач, маршруты и предпосылки.",
    contentSearch: "Поиск по topic_id / названию навыка",
    contentDomainAll: "Все домены",
    contentStatusAll: "Все статусы",
    contentStatusReady: "Только ready",
    contentStatusSoon: "Только soon",
    contentNoItems: "Темы не найдены.",
    contentSkillsCoverage: "Навыков с задачами",
    contentRoutes: "Маршрутов",
    contentEdges: "Связей prereq",
    contentTasks: "Задач",
    contentLevels: "Классы",
    contentGradeTags: "Теги классов",
    contentWarnings: "Предупреждения",
    contentGlobalWarnings: "Глобальные предупреждения",
    contentSkillList: "Навыки",
    skillsTitle: "Реестр навыков",
    skillsSubtitle: "Все навыки с фильтрами и базовым редактированием (title/summary/kind/status).",
    skillsSearch: "Поиск по skill_id, названию или теме",
    skillsTopicAll: "Все темы",
    skillsStatusAll: "Все статусы",
    skillsWithoutTasks: "Только без задач",
    skillsNoItems: "Навыки не найдены.",
    skillsTasks: "Задач",
    skillsEdit: "Редактировать",
    skillsSave: "Сохранить",
    skillsReset: "Сбросить override",
    skillsCancel: "Отмена",
    skillsSummary: "Описание",
    skillsKind: "Тип",
    skillsStatus: "Статус",
    skillsTopic: "Тема",
    skillsOverride: "Override",
    skillsDeficitsTitle: "Дефициты качества",
    skillsDeficitsHint: "Навыки, которые не проходят порог для ready.",
    skillsOpenTasks: "Открыть задачи навыка",
    tasksTitle: "Банк задач",
    tasksSubtitle: "CRUD задач по выбранной теме/навыку с проверкой схемы.",
    tasksTopic: "Тема",
    tasksSkill: "Skill ID",
    tasksSearch: "Поиск по task_id и условию",
    tasksLoad: "Загрузить",
    tasksCreate: "Создать задачу",
    tasksUpdate: "Сохранить задачу",
    tasksDelete: "Удалить",
    tasksAnswerJson: "Ответ (JSON)",
    tasksAnswerType: "Тип ответа",
    tasksAnswerNumber: "Число",
    tasksAnswerNumerator: "Числитель",
    tasksAnswerDenominator: "Знаменатель",
    tasksAnswerLeft: "Левая часть",
    tasksAnswerRight: "Правая часть",
    tasksStatement: "Условие (Markdown + LaTeX)",
    tasksDifficulty: "Сложность",
    tasksBand: "Band",
    tasksNoItems: "Задачи не найдены.",
    tasksPreview: "Предпросмотр",
    tasksStatusFilter: "Фильтр статуса",
    tasksHistory: "История изменений",
    tasksHistoryLoad: "Загрузить историю",
    tasksHistoryReload: "Обновить историю",
    tasksHistoryEmpty: "История изменений пуста.",
    tasksHistoryChanged: "Изменено",
    tasksHistoryAction: "Действие",
    tasksHistoryActionAll: "Все",
    tasksHistoryActionCreate: "Создание",
    tasksHistoryActionUpdate: "Обновление",
    tasksHistoryActionDelete: "Удаление",
    tasksHistoryChangedField: "Поле",
    tasksHistoryChangedFieldAll: "Все поля",
    tasksHistoryActor: "Пользователь",
    tasksHistoryFrom: "С",
    tasksHistoryTo: "По",
    tasksHistoryPresetToday: "Сегодня",
    tasksHistoryPresetWeek: "7 дней",
    tasksHistoryPresetClear: "Сброс",
    tasksHistoryStatusOnly: "Только изменения статуса",
    tasksHistoryReadyOnly: "Только переходы в ready",
    tasksHistorySummaryTotal: "Событий",
    tasksHistorySummaryStatus: "Статусных",
    tasksHistorySummaryReady: "В ready",
    loading: "Загрузка...",
    errorFallback: "Не удалось выполнить действие.",
  },
  en: {
    title: "Admin panel",
    subtitle: "Manage students and review audit log.",
    authRequired: "Admin access only.",
    back: "Back",
    studentsTitle: "Students",
    studentsSearch: "Search by username/email",
    classesCount: "Classes",
    resetPassword: "Reset password",
    temporaryPassword: "Temporary password",
    temporaryPasswordHint: "Show this password to user once.",
    noStudents: "No students found.",
    auditTitle: "Audit log",
    auditSearch: "Search by action/entity",
    auditFilterAll: "All",
    auditFilterAuth: "Auth only",
    auditFilterSuccess: "Success",
    auditFilterFailure: "Failures",
    auditFilterBlocked: "Blocked",
    noLogs: "No events found.",
    refresh: "Refresh",
    contentTitle: "Content registry",
    contentSubtitle: "Topics, skills, task coverage, routes, and prerequisites.",
    contentSearch: "Search by topic_id / skill title",
    contentDomainAll: "All domains",
    contentStatusAll: "All statuses",
    contentStatusReady: "Ready only",
    contentStatusSoon: "Soon only",
    contentNoItems: "No topics found.",
    contentSkillsCoverage: "Skills with tasks",
    contentRoutes: "Routes",
    contentEdges: "Prereq edges",
    contentTasks: "Tasks",
    contentLevels: "Grades",
    contentGradeTags: "Grade tags",
    contentWarnings: "Warnings",
    contentGlobalWarnings: "Global warnings",
    contentSkillList: "Skills",
    skillsTitle: "Skills registry",
    skillsSubtitle: "All skills with filters and basic editing (title/summary/kind/status).",
    skillsSearch: "Search by skill_id, title, or topic",
    skillsTopicAll: "All topics",
    skillsStatusAll: "All statuses",
    skillsWithoutTasks: "Without tasks only",
    skillsNoItems: "No skills found.",
    skillsTasks: "Tasks",
    skillsEdit: "Edit",
    skillsSave: "Save",
    skillsReset: "Reset override",
    skillsCancel: "Cancel",
    skillsSummary: "Summary",
    skillsKind: "Kind",
    skillsStatus: "Status",
    skillsTopic: "Topic",
    skillsOverride: "Override",
    skillsDeficitsTitle: "Quality deficits",
    skillsDeficitsHint: "Skills that do not pass ready threshold.",
    skillsOpenTasks: "Open skill tasks",
    tasksTitle: "Task bank",
    tasksSubtitle: "CRUD tasks for selected topic/skill with schema validation.",
    tasksTopic: "Topic",
    tasksSkill: "Skill ID",
    tasksSearch: "Search by task_id and statement",
    tasksLoad: "Load",
    tasksCreate: "Create task",
    tasksUpdate: "Save task",
    tasksDelete: "Delete",
    tasksAnswerJson: "Answer (JSON)",
    tasksAnswerType: "Answer type",
    tasksAnswerNumber: "Number",
    tasksAnswerNumerator: "Numerator",
    tasksAnswerDenominator: "Denominator",
    tasksAnswerLeft: "Left side",
    tasksAnswerRight: "Right side",
    tasksStatement: "Statement (Markdown + LaTeX)",
    tasksDifficulty: "Difficulty",
    tasksBand: "Band",
    tasksNoItems: "No tasks found.",
    tasksPreview: "Preview",
    tasksStatusFilter: "Status filter",
    tasksHistory: "Change history",
    tasksHistoryLoad: "Load history",
    tasksHistoryReload: "Refresh history",
    tasksHistoryEmpty: "No history yet.",
    tasksHistoryChanged: "Changed",
    tasksHistoryAction: "Action",
    tasksHistoryActionAll: "All",
    tasksHistoryActionCreate: "Create",
    tasksHistoryActionUpdate: "Update",
    tasksHistoryActionDelete: "Delete",
    tasksHistoryChangedField: "Field",
    tasksHistoryChangedFieldAll: "All fields",
    tasksHistoryActor: "User",
    tasksHistoryFrom: "From",
    tasksHistoryTo: "To",
    tasksHistoryPresetToday: "Today",
    tasksHistoryPresetWeek: "7 days",
    tasksHistoryPresetClear: "Clear",
    tasksHistoryStatusOnly: "Status changes only",
    tasksHistoryReadyOnly: "Transitions to ready only",
    tasksHistorySummaryTotal: "Events",
    tasksHistorySummaryStatus: "Status changes",
    tasksHistorySummaryReady: "To ready",
    loading: "Loading...",
    errorFallback: "Action failed.",
  },
  de: {
    title: "Admin-Bereich",
    subtitle: "Schüler verwalten und Audit-Log prüfen.",
    authRequired: "Nur für Admin verfügbar.",
    back: "Zurück",
    studentsTitle: "Schüler",
    studentsSearch: "Suche nach Username/E-Mail",
    classesCount: "Klassen",
    resetPassword: "Passwort zurücksetzen",
    temporaryPassword: "Temporäres Passwort",
    temporaryPasswordHint: "Passwort dem Nutzer nur einmal zeigen.",
    noStudents: "Keine Schüler gefunden.",
    auditTitle: "Audit-Log",
    auditSearch: "Suche nach action/entity",
    auditFilterAll: "Alle",
    auditFilterAuth: "Nur auth.*",
    auditFilterSuccess: "Erfolg",
    auditFilterFailure: "Fehler",
    auditFilterBlocked: "Blockiert",
    noLogs: "Keine Ereignisse gefunden.",
    refresh: "Aktualisieren",
    contentTitle: "Content-Register",
    contentSubtitle: "Themen, Skills, Aufgabenabdeckung, Routen und Voraussetzungen.",
    contentSearch: "Suche nach topic_id / Skill-Titel",
    contentDomainAll: "Alle Domänen",
    contentStatusAll: "Alle Status",
    contentStatusReady: "Nur ready",
    contentStatusSoon: "Nur soon",
    contentNoItems: "Keine Themen gefunden.",
    contentSkillsCoverage: "Skills mit Aufgaben",
    contentRoutes: "Routen",
    contentEdges: "Prereq-Kanten",
    contentTasks: "Aufgaben",
    contentLevels: "Klassen",
    contentGradeTags: "Klassen-Tags",
    contentWarnings: "Warnungen",
    contentGlobalWarnings: "Globale Warnungen",
    contentSkillList: "Skills",
    skillsTitle: "Skill-Register",
    skillsSubtitle: "Alle Skills mit Filtern und Basisbearbeitung (Titel/Beschreibung/Typ/Status).",
    skillsSearch: "Suche nach Skill-ID, Titel oder Thema",
    skillsTopicAll: "Alle Themen",
    skillsStatusAll: "Alle Status",
    skillsWithoutTasks: "Nur ohne Aufgaben",
    skillsNoItems: "Keine Skills gefunden.",
    skillsTasks: "Aufgaben",
    skillsEdit: "Bearbeiten",
    skillsSave: "Speichern",
    skillsReset: "Override zurücksetzen",
    skillsCancel: "Abbrechen",
    skillsSummary: "Beschreibung",
    skillsKind: "Typ",
    skillsStatus: "Status",
    skillsTopic: "Thema",
    skillsOverride: "Override",
    skillsDeficitsTitle: "Qualitaetsdefizite",
    skillsDeficitsHint: "Skills, die die Ready-Schwelle nicht erfuellen.",
    skillsOpenTasks: "Skill-Aufgaben oeffnen",
    tasksTitle: "Aufgabenbank",
    tasksSubtitle: "CRUD-Aufgaben fuer ausgewaehltes Thema/Skill mit Schema-Pruefung.",
    tasksTopic: "Thema",
    tasksSkill: "Skill-ID",
    tasksSearch: "Suche nach Task-ID und Aufgabe",
    tasksLoad: "Laden",
    tasksCreate: "Aufgabe erstellen",
    tasksUpdate: "Aufgabe speichern",
    tasksDelete: "Loeschen",
    tasksAnswerJson: "Antwort (JSON)",
    tasksAnswerType: "Antworttyp",
    tasksAnswerNumber: "Zahl",
    tasksAnswerNumerator: "Zaehler",
    tasksAnswerDenominator: "Nenner",
    tasksAnswerLeft: "Linke Seite",
    tasksAnswerRight: "Rechte Seite",
    tasksStatement: "Aufgabe (Markdown + LaTeX)",
    tasksDifficulty: "Schwierigkeit",
    tasksBand: "Band",
    tasksNoItems: "Keine Aufgaben gefunden.",
    tasksPreview: "Vorschau",
    tasksStatusFilter: "Statusfilter",
    tasksHistory: "Aenderungsverlauf",
    tasksHistoryLoad: "Verlauf laden",
    tasksHistoryReload: "Verlauf aktualisieren",
    tasksHistoryEmpty: "Noch kein Verlauf.",
    tasksHistoryChanged: "Geaendert",
    tasksHistoryAction: "Aktion",
    tasksHistoryActionAll: "Alle",
    tasksHistoryActionCreate: "Erstellen",
    tasksHistoryActionUpdate: "Aktualisieren",
    tasksHistoryActionDelete: "Loeschen",
    tasksHistoryChangedField: "Feld",
    tasksHistoryChangedFieldAll: "Alle Felder",
    tasksHistoryActor: "Nutzer",
    tasksHistoryFrom: "Von",
    tasksHistoryTo: "Bis",
    tasksHistoryPresetToday: "Heute",
    tasksHistoryPresetWeek: "7 Tage",
    tasksHistoryPresetClear: "Zuruecksetzen",
    tasksHistoryStatusOnly: "Nur Statusaenderungen",
    tasksHistoryReadyOnly: "Nur Wechsel zu ready",
    tasksHistorySummaryTotal: "Ereignisse",
    tasksHistorySummaryStatus: "Statuswechsel",
    tasksHistorySummaryReady: "Zu ready",
    loading: "Laden...",
    errorFallback: "Aktion fehlgeschlagen.",
  },
} as const;

export function AdminPageClient({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [csrfToken, setCsrfToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [studentsQuery, setStudentsQuery] = useState("");
  const [logs, setLogs] = useState<AuditItem[]>([]);
  const [logsQuery, setLogsQuery] = useState("");
  const [logsActionFilter, setLogsActionFilter] = useState<
    "all" | "auth" | "success" | "failure" | "blocked"
  >("all");
  const [resettingStudentId, setResettingStudentId] = useState<string | null>(null);
  const [lastReset, setLastReset] = useState<{ username: string | null; temporaryPassword: string } | null>(null);
  const [contentTopics, setContentTopics] = useState<ContentTopicItem[]>([]);
  const [contentGlobalWarnings, setContentGlobalWarnings] = useState<string[]>([]);
  const [skillItems, setSkillItems] = useState<SkillRegistryItem[]>([]);
  const [skillDeficits, setSkillDeficits] = useState<SkillReadyDeficitItem[]>([]);
  const [sectionErrors, setSectionErrors] = useState<{
    students: string | null;
    logs: string | null;
    content: string | null;
    skills: string | null;
  }>({
    students: null,
    logs: null,
    content: null,
    skills: null,
  });
  const [contentQuery, setContentQuery] = useState("");
  const [contentDomain, setContentDomain] = useState<"all" | "arithmetic" | "algebra" | "geometry" | "data">("all");
  const [contentStatus, setContentStatus] = useState<"all" | "ready" | "soon">("all");
  const [skillsQuery, setSkillsQuery] = useState("");
  const [skillsTopicFilter, setSkillsTopicFilter] = useState("all");
  const [skillsStatusFilter, setSkillsStatusFilter] = useState<"all" | "ready" | "soon">("all");
  const [skillsWithoutTasksOnly, setSkillsWithoutTasksOnly] = useState(false);
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [skillDraftTitle, setSkillDraftTitle] = useState("");
  const [skillDraftSummary, setSkillDraftSummary] = useState("");
  const [skillDraftKind, setSkillDraftKind] = useState<SkillKind>("compute");
  const [skillDraftStatus, setSkillDraftStatus] = useState<"ready" | "soon">("ready");
  const [savingSkillId, setSavingSkillId] = useState<string | null>(null);
  const [taskTopicFilter, setTaskTopicFilter] = useState("all");
  const [taskSkillFilter, setTaskSkillFilter] = useState("");
  const [taskQuery, setTaskQuery] = useState("");
  const [taskStatusFilter, setTaskStatusFilter] = useState<"all" | "draft" | "review" | "ready">("all");
  const [taskItems, setTaskItems] = useState<AdminTaskItem[]>([]);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskDraftStatement, setTaskDraftStatement] = useState("");
  const [taskDraftDifficulty, setTaskDraftDifficulty] = useState(1);
  const [taskDraftBand, setTaskDraftBand] = useState<"A" | "B" | "C">("A");
  const [taskDraftStatus, setTaskDraftStatus] = useState<"draft" | "review" | "ready">("draft");
  const [taskDraftAnswerType, setTaskDraftAnswerType] = useState<DraftAnswerType>("number");
  const [taskDraftNumberValue, setTaskDraftNumberValue] = useState(0);
  const [taskDraftFractionNumerator, setTaskDraftFractionNumerator] = useState(1);
  const [taskDraftFractionDenominator, setTaskDraftFractionDenominator] = useState(2);
  const [taskDraftRatioLeft, setTaskDraftRatioLeft] = useState(1);
  const [taskDraftRatioRight, setTaskDraftRatioRight] = useState(2);
  const [creatingTask, setCreatingTask] = useState(false);
  const [taskAuditById, setTaskAuditById] = useState<Record<string, TaskAuditItem[]>>({});
  const [taskAuditLoadingId, setTaskAuditLoadingId] = useState<string | null>(null);
  const [taskAuditErrorById, setTaskAuditErrorById] = useState<Record<string, string>>({});
  const [taskAuditActionFilter, setTaskAuditActionFilter] = useState<TaskAuditActionFilter>("all");
  const [taskAuditChangedFieldFilter, setTaskAuditChangedFieldFilter] =
    useState<TaskAuditChangedFieldFilter>("all");
  const [taskAuditActorFilter, setTaskAuditActorFilter] = useState("");
  const [taskAuditFromDate, setTaskAuditFromDate] = useState("");
  const [taskAuditToDate, setTaskAuditToDate] = useState("");
  const [taskAuditStatusOnly, setTaskAuditStatusOnly] = useState(false);
  const [taskAuditReadyOnly, setTaskAuditReadyOnly] = useState(false);

  const formatSectionError = useCallback(
    (label: string, reason: unknown) => {
      const text = reason instanceof Error ? reason.message : t.errorFallback;
      return `${label}: ${text}`;
    },
    [t.errorFallback],
  );

  const filteredStudents = useMemo(() => {
    const q = studentsQuery.trim().toLowerCase();
    if (!q) return students;
    return students.filter((item) =>
      [item.username ?? "", item.email ?? "", item.id].join(" ").toLowerCase().includes(q),
    );
  }, [students, studentsQuery]);

  const filteredLogs = useMemo(() => {
    const q = logsQuery.trim().toLowerCase();
    return logs
      .filter((item) => {
        if (logsActionFilter === "all") return true;
        if (logsActionFilter === "auth") return item.action.startsWith("auth.");
        if (logsActionFilter === "success") return item.action.includes(".success");
        if (logsActionFilter === "failure") return item.action.includes(".failure");
        if (logsActionFilter === "blocked") return item.action.includes(".blocked");
        return true;
      })
      .filter((item) => {
        if (!q) return true;
        return [item.action, item.entityType, item.entityId, item.actor?.username ?? "", item.actor?.email ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(q);
      });
  }, [logs, logsActionFilter, logsQuery]);

  const filteredContentTopics = useMemo(() => {
    const q = contentQuery.trim().toLowerCase();
    return contentTopics
      .filter((item) => {
        if (contentDomain === "all") return true;
        return item.domain === contentDomain;
      })
      .filter((item) => {
        if (contentStatus === "all") return true;
        return item.status === contentStatus;
      })
      .filter((item) => {
        if (!q) return true;
        const skillTitles = item.skills.map((skill) => skill.title).join(" ");
        const title = item.title[locale] ?? item.title.ru ?? "";
        return [item.topicId, title, skillTitles].join(" ").toLowerCase().includes(q);
      });
  }, [contentDomain, contentQuery, contentStatus, contentTopics, locale]);

  const skillsTopicOptions = useMemo(
    () => [...new Set(skillItems.map((item) => item.topicId))].sort(),
    [skillItems],
  );

  const filteredSkillItems = useMemo(() => {
    const q = skillsQuery.trim().toLowerCase();

    return skillItems
      .filter((item) => {
        if (skillsTopicFilter === "all") return true;
        return item.topicId === skillsTopicFilter;
      })
      .filter((item) => {
        if (skillsStatusFilter === "all") return true;
        return item.status === skillsStatusFilter;
      })
      .filter((item) => {
        if (!skillsWithoutTasksOnly) return true;
        return item.tasksTotal === 0;
      })
      .filter((item) => {
        if (!q) return true;
        return [item.skillId, item.title, item.summary ?? "", item.topicId, item.topicTitle[locale]]
          .join(" ")
          .toLowerCase()
          .includes(q);
      });
  }, [locale, skillItems, skillsQuery, skillsStatusFilter, skillsTopicFilter, skillsWithoutTasksOnly]);

  function applyDraftAnswer(answer: unknown) {
    if (!answer || typeof answer !== "object") {
      setTaskDraftAnswerType("number");
      setTaskDraftNumberValue(0);
      return;
    }
    const source = answer as Record<string, unknown>;
    if (source.type === "number" && typeof source.value === "number") {
      setTaskDraftAnswerType("number");
      setTaskDraftNumberValue(source.value);
      return;
    }
    if (
      source.type === "fraction" &&
      typeof source.numerator === "number" &&
      typeof source.denominator === "number"
    ) {
      setTaskDraftAnswerType("fraction");
      setTaskDraftFractionNumerator(source.numerator);
      setTaskDraftFractionDenominator(source.denominator);
      return;
    }
    if (source.type === "ratio" && typeof source.left === "number" && typeof source.right === "number") {
      setTaskDraftAnswerType("ratio");
      setTaskDraftRatioLeft(source.left);
      setTaskDraftRatioRight(source.right);
      return;
    }
    setTaskDraftAnswerType("number");
    setTaskDraftNumberValue(0);
  }

  function buildTaskAnswer(): unknown | null {
    if (taskDraftAnswerType === "number") {
      return {
        type: "number",
        value: taskDraftNumberValue,
      };
    }
    if (taskDraftAnswerType === "fraction") {
      if (taskDraftFractionDenominator === 0) return null;
      return {
        type: "fraction",
        numerator: taskDraftFractionNumerator,
        denominator: taskDraftFractionDenominator,
      };
    }
    if (taskDraftRatioRight === 0) return null;
    return {
      type: "ratio",
      left: taskDraftRatioLeft,
      right: taskDraftRatioRight,
    };
  }

  function formatTaskAnswer(answer: unknown) {
    if (!answer || typeof answer !== "object") return "—";
    const source = answer as Record<string, unknown>;
    if (source.type === "number" && typeof source.value === "number") {
      return `${source.value}`;
    }
    if (
      source.type === "fraction" &&
      typeof source.numerator === "number" &&
      typeof source.denominator === "number"
    ) {
      return `${source.numerator}/${source.denominator}`;
    }
    if (source.type === "ratio" && typeof source.left === "number" && typeof source.right === "number") {
      return `${source.left}:${source.right}`;
    }
    return "—";
  }

  function formatTaskAuditFieldValue(snapshot: TaskAuditSnapshot | null, field: TaskAuditField) {
    if (!snapshot) return "—";
    if (field === "answer") return formatTaskAnswer(snapshot.answer);
    const value = snapshot[field];
    if (typeof value === "string" || typeof value === "number") return `${value}`;
    return "—";
  }

  function formatDateInputValue(date: Date) {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function applyTaskAuditDatePreset(preset: "today" | "week" | "clear") {
    if (preset === "clear") {
      setTaskAuditFromDate("");
      setTaskAuditToDate("");
      return;
    }

    const now = new Date();
    const to = formatDateInputValue(now);
    if (preset === "today") {
      setTaskAuditFromDate(to);
      setTaskAuditToDate(to);
      return;
    }
    const fromDate = new Date(now);
    fromDate.setDate(fromDate.getDate() - 6);
    setTaskAuditFromDate(formatDateInputValue(fromDate));
    setTaskAuditToDate(to);
  }

  const loadTasks = useCallback(
    async (params?: { topicId?: string; skillId?: string; q?: string }) => {
      const topicId = params?.topicId ?? taskTopicFilter;
      if (!topicId || topicId === "all") {
        setTaskItems([]);
        return;
      }
      setTasksLoading(true);
      try {
        const url = new URL("/api/admin/tasks", window.location.origin);
        url.searchParams.set("topicId", topicId);
        if (params?.skillId ?? taskSkillFilter.trim()) {
          url.searchParams.set("skillId", (params?.skillId ?? taskSkillFilter).trim());
        }
        if (params?.q ?? taskQuery.trim()) {
          url.searchParams.set("q", (params?.q ?? taskQuery).trim());
        }
        if (taskStatusFilter !== "all") {
          url.searchParams.set("status", taskStatusFilter);
        }
        const response = await fetch(url.toString(), { credentials: "same-origin" });
        const payload = (await response.json()) as {
          ok?: boolean;
          tasks?: AdminTaskItem[];
          message?: string;
        };
        if (!response.ok || !payload.ok) {
          setTasksError(payload.message ?? t.errorFallback);
          return;
        }
        setTaskItems(Array.isArray(payload.tasks) ? payload.tasks : []);
        setTasksError(null);
      } finally {
        setTasksLoading(false);
      }
    },
    [t.errorFallback, taskQuery, taskSkillFilter, taskStatusFilter, taskTopicFilter],
  );

  const loadTaskAudit = useCallback(
    async (taskId: string) => {
      setTaskAuditLoadingId(taskId);
      try {
        const url = new URL(`/api/admin/tasks/${encodeURIComponent(taskId)}/audit`, window.location.origin);
        if (taskAuditActionFilter !== "all") {
          url.searchParams.set("action", taskAuditActionFilter);
        }
        if (taskAuditChangedFieldFilter !== "all") {
          url.searchParams.set("changedField", taskAuditChangedFieldFilter);
        }
        if (taskAuditActorFilter.trim()) {
          url.searchParams.set("actor", taskAuditActorFilter.trim());
        }
        if (taskAuditFromDate) {
          url.searchParams.set("from", taskAuditFromDate);
        }
        if (taskAuditToDate) {
          url.searchParams.set("to", taskAuditToDate);
        }
        if (taskAuditStatusOnly) {
          url.searchParams.set("statusOnly", "1");
        }
        if (taskAuditReadyOnly) {
          url.searchParams.set("readyOnly", "1");
        }
        const response = await fetch(url.toString(), {
          credentials: "same-origin",
        });
        const payload = (await response.json()) as { ok?: boolean; logs?: TaskAuditItem[]; message?: string };
        if (!response.ok || !payload.ok) {
          setTaskAuditErrorById((prev) => ({ ...prev, [taskId]: payload.message ?? t.errorFallback }));
          return;
        }
        setTaskAuditById((prev) => ({
          ...prev,
          [taskId]: Array.isArray(payload.logs) ? payload.logs : [],
        }));
        setTaskAuditErrorById((prev) => {
          const next = { ...prev };
          delete next[taskId];
          return next;
        });
      } catch {
        setTaskAuditErrorById((prev) => ({ ...prev, [taskId]: t.errorFallback }));
      } finally {
        setTaskAuditLoadingId((current) => (current === taskId ? null : current));
      }
    },
    [
      t.errorFallback,
      taskAuditActionFilter,
      taskAuditActorFilter,
      taskAuditChangedFieldFilter,
      taskAuditFromDate,
      taskAuditReadyOnly,
      taskAuditStatusOnly,
      taskAuditToDate,
    ],
  );

  const loadStudents = useCallback(async () => {
    const response = await fetch("/api/admin/students", { credentials: "same-origin" });
    const payload = (await response.json()) as { ok?: boolean; students?: StudentItem[]; message?: string };
    if (!response.ok || !payload.ok) {
      throw new Error(payload.message ?? t.errorFallback);
    }
    setStudents(Array.isArray(payload.students) ? payload.students : []);
  }, [t.errorFallback]);

  const loadLogs = useCallback(async () => {
    const response = await fetch("/api/admin/audit", { credentials: "same-origin" });
    const payload = (await response.json()) as { ok?: boolean; logs?: AuditItem[]; message?: string };
    if (!response.ok || !payload.ok) {
      throw new Error(payload.message ?? t.errorFallback);
    }
    setLogs(Array.isArray(payload.logs) ? payload.logs : []);
  }, [t.errorFallback]);

  const loadContent = useCallback(async () => {
    const response = await fetch("/api/admin/content", { credentials: "same-origin" });
    const payload = (await response.json()) as {
      ok?: boolean;
      topics?: ContentTopicItem[];
      globalWarnings?: string[];
      message?: string;
    };
    if (!response.ok || !payload.ok) {
      throw new Error(payload.message ?? t.errorFallback);
    }
    setContentTopics(Array.isArray(payload.topics) ? payload.topics : []);
    setContentGlobalWarnings(Array.isArray(payload.globalWarnings) ? payload.globalWarnings : []);
  }, [t.errorFallback]);

  const loadSkills = useCallback(async () => {
    const response = await fetch("/api/admin/skills", { credentials: "same-origin" });
    const payload = (await response.json()) as {
      ok?: boolean;
      items?: SkillRegistryItem[];
      deficits?: SkillReadyDeficitItem[];
      message?: string;
    };
    if (!response.ok || !payload.ok) {
      throw new Error(payload.message ?? t.errorFallback);
    }
    setSkillItems(Array.isArray(payload.items) ? payload.items : []);
    setSkillDeficits(Array.isArray(payload.deficits) ? payload.deficits : []);
  }, [t.errorFallback]);

  const refreshAdminData = useCallback(async () => {
    const results = await Promise.allSettled([loadStudents(), loadLogs(), loadContent(), loadSkills()]);
    const sectionNames = [t.studentsTitle, t.auditTitle, t.contentTitle, t.skillsTitle] as const;
    const nextSectionErrors = buildAdminSectionErrors({
      results,
      sectionNames,
      formatSectionError,
    });
    setSectionErrors(nextSectionErrors);
    const failures = formatAdminSectionFailures({
      results,
      sectionNames,
      formatSectionError,
    });

    if (failures.length > 0) {
      setError(failures.join(" | "));
      return;
    }
    setError(null);
  }, [
    formatSectionError,
    loadContent,
    loadLogs,
    loadSkills,
    loadStudents,
    t.auditTitle,
    t.contentTitle,
    t.skillsTitle,
    t.studentsTitle,
  ]);

  useEffect(() => {
    void (async () => {
      try {
        const sessionResponse = await fetch("/api/auth/session", { credentials: "same-origin" });
        const sessionPayload = (await sessionResponse.json()) as SessionResponse;
        if (sessionPayload.ok && typeof sessionPayload.csrfToken === "string" && sessionPayload.csrfToken) {
          setCsrfToken(sessionPayload.csrfToken);
        }
        const admin = Boolean(
          sessionResponse.ok && sessionPayload.ok && sessionPayload.authenticated && sessionPayload.user.role === "admin",
        );
        setIsAdmin(admin);
        if (!admin) return;
        await refreshAdminData();
      } catch (err) {
        setError(err instanceof Error ? err.message : t.errorFallback);
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshAdminData, t.errorFallback]);

  useEffect(() => {
    if (taskTopicFilter === "all" && skillsTopicOptions.length > 0) {
      setTaskTopicFilter(skillsTopicOptions[0] ?? "all");
    }
  }, [skillsTopicOptions, taskTopicFilter]);

  useEffect(() => {
    if (taskTopicFilter === "all") return;
    void loadTasks({ topicId: taskTopicFilter });
  }, [loadTasks, taskTopicFilter]);

  useEffect(() => {
    setTaskAuditById({});
    setTaskAuditErrorById({});
    if (!editingTaskId) return;
    void loadTaskAudit(editingTaskId);
  }, [
    editingTaskId,
    loadTaskAudit,
    taskAuditActionFilter,
    taskAuditActorFilter,
    taskAuditChangedFieldFilter,
    taskAuditFromDate,
    taskAuditReadyOnly,
    taskAuditStatusOnly,
    taskAuditToDate,
  ]);

  async function handleResetStudent(studentId: string) {
    if (!csrfToken) {
      setError(t.errorFallback);
      return;
    }
    setResettingStudentId(studentId);
    setError(null);
    setLastReset(null);
    try {
      const response = await fetch(`/api/students/${studentId}/reset-password`, {
        method: "POST",
        headers: { "x-csrf-token": csrfToken },
        credentials: "same-origin",
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
        student?: { username: string | null };
        temporaryPassword?: string;
      };
      if (!response.ok || !payload.ok || !payload.temporaryPassword) {
        setError(payload.message ?? t.errorFallback);
        return;
      }
      setLastReset({
        username: payload.student?.username ?? null,
        temporaryPassword: payload.temporaryPassword,
      });
      await Promise.all([loadStudents(), loadLogs()]);
    } catch {
      setError(t.errorFallback);
    } finally {
      setResettingStudentId(null);
    }
  }

  function startEditSkill(item: SkillRegistryItem) {
    setEditingSkillId(item.skillId);
    setSkillDraftTitle(item.title);
    setSkillDraftSummary(item.summary ?? "");
    setSkillDraftKind(item.kind);
    setSkillDraftStatus(item.status);
    setError(null);
  }

  function stopEditSkill() {
    setEditingSkillId(null);
    setSavingSkillId(null);
  }

  async function saveSkillOverride(skillId: string) {
    if (!csrfToken) {
      setError(t.errorFallback);
      return;
    }
    setSavingSkillId(skillId);
    try {
      const response = await fetch(`/api/admin/skills/${encodeURIComponent(skillId)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        credentials: "same-origin",
        body: JSON.stringify({
          title: skillDraftTitle.trim() || null,
          summary: skillDraftSummary.trim() || null,
          kind: skillDraftKind,
          status: skillDraftStatus,
        }),
      });
      const payload = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok || !payload.ok) {
        setError(payload.message ?? t.errorFallback);
        return;
      }
      await loadSkills();
      stopEditSkill();
    } catch {
      setError(t.errorFallback);
    } finally {
      setSavingSkillId(null);
    }
  }

  async function resetSkillOverride(skillId: string) {
    if (!csrfToken) {
      setError(t.errorFallback);
      return;
    }
    setSavingSkillId(skillId);
    try {
      const response = await fetch(`/api/admin/skills/${encodeURIComponent(skillId)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        credentials: "same-origin",
        body: JSON.stringify({
          title: null,
          summary: null,
          kind: null,
          status: null,
        }),
      });
      const payload = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok || !payload.ok) {
        setError(payload.message ?? t.errorFallback);
        return;
      }
      await loadSkills();
      stopEditSkill();
    } catch {
      setError(t.errorFallback);
    } finally {
      setSavingSkillId(null);
    }
  }

  function startEditTask(item: AdminTaskItem) {
    setEditingTaskId(item.id);
    setTaskDraftStatement(item.statement_md);
    setTaskDraftDifficulty(item.difficulty ?? 1);
    setTaskDraftBand(item.difficulty_band ?? "A");
    setTaskDraftStatus(item.status ?? "ready");
    applyDraftAnswer(item.answer);
    void loadTaskAudit(item.id);
  }

  async function createTask() {
    if (!csrfToken) {
      setError(t.errorFallback);
      return;
    }
    if (!taskTopicFilter || taskTopicFilter === "all") {
      setTasksError("topicId is required");
      return;
    }
    const skillId = taskSkillFilter.trim();
    if (!skillId) {
      setTasksError("skillId is required");
      return;
    }
    const answer = buildTaskAnswer();
    if (!answer) {
      setTasksError("Invalid answer values");
      return;
    }

    setCreatingTask(true);
    try {
      const response = await fetch("/api/admin/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        credentials: "same-origin",
        body: JSON.stringify({
          topicId: taskTopicFilter,
          skillId,
          statementMd: taskDraftStatement,
          difficulty: taskDraftDifficulty,
          difficultyBand: taskDraftBand,
          status: taskDraftStatus,
          answer,
        }),
      });
      const payload = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok || !payload.ok) {
        setTasksError(payload.message ?? t.errorFallback);
        return;
      }
      await loadTasks();
      setTasksError(null);
    } catch {
      setTasksError(t.errorFallback);
    } finally {
      setCreatingTask(false);
    }
  }

  async function updateTask(taskId: string) {
    if (!csrfToken) {
      setError(t.errorFallback);
      return;
    }
    const answer = buildTaskAnswer();
    if (!answer) {
      setTasksError("Invalid answer values");
      return;
    }

    setCreatingTask(true);
    try {
      const response = await fetch(`/api/admin/tasks/${encodeURIComponent(taskId)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        credentials: "same-origin",
        body: JSON.stringify({
          statementMd: taskDraftStatement,
          difficulty: taskDraftDifficulty,
          difficultyBand: taskDraftBand,
          status: taskDraftStatus,
          answer,
        }),
      });
      const payload = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok || !payload.ok) {
        setTasksError(payload.message ?? t.errorFallback);
        return;
      }
      await loadTasks();
      setTaskAuditById((prev) => {
        const next = { ...prev };
        delete next[taskId];
        return next;
      });
      setTaskAuditErrorById((prev) => {
        const next = { ...prev };
        delete next[taskId];
        return next;
      });
      setEditingTaskId(null);
      setTasksError(null);
    } catch {
      setTasksError(t.errorFallback);
    } finally {
      setCreatingTask(false);
    }
  }

  async function deleteTask(taskId: string) {
    if (!csrfToken) {
      setError(t.errorFallback);
      return;
    }
    setCreatingTask(true);
    try {
      const response = await fetch(`/api/admin/tasks/${encodeURIComponent(taskId)}`, {
        method: "DELETE",
        headers: {
          "x-csrf-token": csrfToken,
        },
        credentials: "same-origin",
      });
      const payload = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok || !payload.ok) {
        setTasksError(payload.message ?? t.errorFallback);
        return;
      }
      await loadTasks();
      setTaskAuditById((prev) => {
        const next = { ...prev };
        delete next[taskId];
        return next;
      });
      setTaskAuditErrorById((prev) => {
        const next = { ...prev };
        delete next[taskId];
        return next;
      });
      if (editingTaskId === taskId) setEditingTaskId(null);
      setTasksError(null);
    } catch {
      setTasksError(t.errorFallback);
    } finally {
      setCreatingTask(false);
    }
  }

  if (loading) {
    return <SurfaceCard className="p-6 text-sm text-slate-600">{t.loading}</SurfaceCard>;
  }

  if (!isAdmin) {
    return (
      <SurfaceCard className="p-6">
        <p className="text-sm text-slate-700">{t.authRequired}</p>
        <Link
          href={`/${locale}/teacher/cabinet`}
          className="mt-3 inline-flex rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
        >
          {t.back}
        </Link>
      </SurfaceCard>
    );
  }

  return (
    <main className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">{t.title}</h1>
        <p className="mt-2 text-sm text-slate-600">{t.subtitle}</p>
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      </section>

      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">{t.studentsTitle}</h2>
          <button
            type="button"
            onClick={() => void refreshAdminData()}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
          >
            {t.refresh}
          </button>
        </div>
        <input
          type="text"
          value={studentsQuery}
          onChange={(event) => setStudentsQuery(event.target.value)}
          placeholder={t.studentsSearch}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
        />
        {sectionErrors.students ? <p className="text-sm text-red-700">{sectionErrors.students}</p> : null}
        {lastReset ? (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            <p>
              <span className="font-semibold">{t.temporaryPassword}:</span> <code>{lastReset.temporaryPassword}</code>
            </p>
            <p className="mt-1 text-xs">{t.temporaryPasswordHint}</p>
          </div>
        ) : null}
        {filteredStudents.length === 0 ? (
          <p className="text-sm text-slate-600">{t.noStudents}</p>
        ) : (
          <div className="space-y-2">
            {filteredStudents.map((student) => (
              <div
                key={student.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-950">{student.username ?? student.id}</p>
                  <p className="text-xs text-slate-600">
                    {student.email ?? "no-email"} • {t.classesCount}: {student.classesCount} •{" "}
                    {formatDateTime(locale, student.createdAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleResetStudent(student.id)}
                  disabled={resettingStudentId === student.id}
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-100 disabled:opacity-60"
                >
                  {resettingStudentId === student.id ? "..." : t.resetPassword}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-semibold tracking-tight text-slate-950">{t.contentTitle}</h2>
        <p className="text-sm text-slate-600">{t.contentSubtitle}</p>
        <div className="grid gap-3 md:grid-cols-3">
          <input
            type="text"
            value={contentQuery}
            onChange={(event) => setContentQuery(event.target.value)}
            placeholder={t.contentSearch}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          />
          <select
            value={contentDomain}
            onChange={(event) =>
              setContentDomain(event.target.value as "all" | "arithmetic" | "algebra" | "geometry" | "data")
            }
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          >
            <option value="all">{t.contentDomainAll}</option>
            <option value="arithmetic">arithmetic</option>
            <option value="algebra">algebra</option>
            <option value="geometry">geometry</option>
            <option value="data">data</option>
          </select>
          <select
            value={contentStatus}
            onChange={(event) => setContentStatus(event.target.value as "all" | "ready" | "soon")}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          >
            <option value="all">{t.contentStatusAll}</option>
            <option value="ready">{t.contentStatusReady}</option>
            <option value="soon">{t.contentStatusSoon}</option>
          </select>
        </div>
        {sectionErrors.content ? <p className="text-sm text-red-700">{sectionErrors.content}</p> : null}
        {contentGlobalWarnings.length > 0 ? (
          <div className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            <p className="font-semibold">{t.contentGlobalWarnings}</p>
            <ul className="mt-1 list-disc pl-4">
              {contentGlobalWarnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {filteredContentTopics.length === 0 ? (
          <p className="text-sm text-slate-600">{t.contentNoItems}</p>
        ) : (
          <div className="space-y-3">
            {filteredContentTopics.map((topic) => (
              <details key={topic.topicId} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <summary className="cursor-pointer list-none">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">
                        {topic.title[locale] || topic.title.ru} <span className="text-slate-500">({topic.topicId})</span>
                      </p>
                      <p className="text-xs text-slate-600">
                        {topic.domain ?? "—"} • status: {topic.status ?? "—"} • {t.contentLevels}:{" "}
                        {topic.levels.length > 0 ? topic.levels.join(", ") : "—"} • {t.contentGradeTags}:{" "}
                        {topic.gradeTags.length > 0 ? topic.gradeTags.join(", ") : "—"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full border border-slate-300 bg-white px-2 py-1">
                        {t.contentSkillsCoverage}: {topic.skillsWithTasks}/{topic.skillsTotal}
                      </span>
                      <span className="rounded-full border border-slate-300 bg-white px-2 py-1">
                        {t.contentTasks}: {topic.tasksTotal}
                      </span>
                      <span className="rounded-full border border-slate-300 bg-white px-2 py-1">
                        {t.contentRoutes}: {topic.routesTotal}
                      </span>
                      <span className="rounded-full border border-slate-300 bg-white px-2 py-1">
                        {t.contentEdges}: {topic.prereqEdgesTotal}
                      </span>
                    </div>
                  </div>
                </summary>
                {topic.warnings.length > 0 ? (
                  <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    <p className="font-semibold">{t.contentWarnings}</p>
                    <ul className="mt-1 list-disc pl-4">
                      {topic.warnings.map((warning) => (
                        <li key={`${topic.topicId}-${warning}`}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <div className="mt-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{t.contentSkillList}</p>
                  <div className="space-y-1">
                    {topic.skills.map((skill) => (
                      <div key={skill.id} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs">
                        <span className="font-semibold text-slate-900">{skill.title}</span>
                        <span className="text-slate-600"> • {skill.id}</span>
                        <span className="text-slate-600">
                          {" "}
                          • branch: {skill.branchId ?? "—"} • tasks: {skill.availableCount} • kind:{" "}
                          {skill.kind ?? "—"} • status: {skill.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </details>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-semibold tracking-tight text-slate-950">{t.skillsTitle}</h2>
        <p className="text-sm text-slate-600">{t.skillsSubtitle}</p>
        <div className="grid gap-3 md:grid-cols-5">
          <input
            type="text"
            value={skillsQuery}
            onChange={(event) => setSkillsQuery(event.target.value)}
            placeholder={t.skillsSearch}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          />
          <select
            value={skillsTopicFilter}
            onChange={(event) => setSkillsTopicFilter(event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          >
            <option value="all">{t.skillsTopicAll}</option>
            {skillsTopicOptions.map((topicId) => (
              <option key={topicId} value={topicId}>
                {topicId}
              </option>
            ))}
          </select>
          <select
            value={skillsStatusFilter}
            onChange={(event) => setSkillsStatusFilter(event.target.value as "all" | "ready" | "soon")}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          >
            <option value="all">{t.skillsStatusAll}</option>
            <option value="ready">ready</option>
            <option value="soon">soon</option>
          </select>
          <label className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={skillsWithoutTasksOnly}
              onChange={(event) => setSkillsWithoutTasksOnly(event.target.checked)}
            />
            {t.skillsWithoutTasks}
          </label>
        </div>
        {sectionErrors.skills ? <p className="text-sm text-red-700">{sectionErrors.skills}</p> : null}
        {skillDeficits.length > 0 ? (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
            <p className="font-semibold">{t.skillsDeficitsTitle}</p>
            <p className="mt-1">{t.skillsDeficitsHint}</p>
            <div className="mt-2 space-y-2">
              {skillDeficits.map((deficit) => (
                <div key={deficit.skillId} className="rounded-lg border border-amber-200 bg-white px-3 py-2">
                  <p className="font-semibold text-slate-900">
                    {deficit.title} <span className="text-slate-500">({deficit.skillId})</span>
                  </p>
                  <p className="text-slate-600">
                    ready: {deficit.coverage.readyTotal} • A:{deficit.coverage.readyByBand.A} B:
                    {deficit.coverage.readyByBand.B} C:{deficit.coverage.readyByBand.C}
                  </p>
                  <p className="text-slate-600">{deficit.reasons.join(", ")}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setTaskTopicFilter(deficit.topicId);
                      setTaskSkillFilter(deficit.skillId);
                      setTaskStatusFilter("all");
                      void loadTasks({ topicId: deficit.topicId, skillId: deficit.skillId, q: "" });
                    }}
                    className="mt-2 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-100"
                  >
                    {t.skillsOpenTasks}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {filteredSkillItems.length === 0 ? (
          <p className="text-sm text-slate-600">{t.skillsNoItems}</p>
        ) : (
          <div className="space-y-2">
            {filteredSkillItems.map((item) => {
              const isEditing = editingSkillId === item.skillId;
              const isSaving = savingSkillId === item.skillId;
              return (
                <div key={item.skillId} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">
                        {item.title} <span className="text-slate-500">({item.skillId})</span>
                      </p>
                      <p className="text-xs text-slate-600">
                        {t.skillsTopic}: {item.topicId} • {t.skillsKind}: {item.kind} • {t.skillsStatus}: {item.status} •{" "}
                        {t.skillsTasks}: {item.tasksTotal} • {t.skillsOverride}: {item.hasOverride ? "yes" : "no"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => startEditSkill(item)}
                      className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-100"
                    >
                      {t.skillsEdit}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-slate-700">{item.summary ?? "—"}</p>

                  {isEditing ? (
                    <div className="mt-3 space-y-2 rounded-lg border border-slate-300 bg-white p-3">
                      <input
                        type="text"
                        value={skillDraftTitle}
                        onChange={(event) => setSkillDraftTitle(event.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                      />
                      <textarea
                        value={skillDraftSummary}
                        onChange={(event) => setSkillDraftSummary(event.target.value)}
                        rows={3}
                        className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                      />
                      <div className="grid gap-2 sm:grid-cols-2">
                        <select
                          value={skillDraftKind}
                          onChange={(event) => setSkillDraftKind(event.target.value as SkillKind)}
                          className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                        >
                          {SKILL_KINDS.map((kind) => (
                            <option key={kind} value={kind}>
                              {kind}
                            </option>
                          ))}
                        </select>
                        <select
                          value={skillDraftStatus}
                          onChange={(event) => setSkillDraftStatus(event.target.value as "ready" | "soon")}
                          className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                        >
                          <option value="ready">ready</option>
                          <option value="soon">soon</option>
                        </select>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => void saveSkillOverride(item.skillId)}
                          className="rounded-lg border border-slate-300 bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                        >
                          {t.skillsSave}
                        </button>
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => void resetSkillOverride(item.skillId)}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-100 disabled:opacity-60"
                        >
                          {t.skillsReset}
                        </button>
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={stopEditSkill}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                        >
                          {t.skillsCancel}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-semibold tracking-tight text-slate-950">{t.tasksTitle}</h2>
        <p className="text-sm text-slate-600">{t.tasksSubtitle}</p>
        <div className="grid gap-3 md:grid-cols-4">
          <select
            value={taskTopicFilter}
            onChange={(event) => setTaskTopicFilter(event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          >
            <option value="all">{t.tasksTopic}</option>
            {skillsTopicOptions.map((topicId) => (
              <option key={topicId} value={topicId}>
                {topicId}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={taskSkillFilter}
            onChange={(event) => setTaskSkillFilter(event.target.value)}
            placeholder={t.tasksSkill}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          />
          <input
            type="text"
            value={taskQuery}
            onChange={(event) => setTaskQuery(event.target.value)}
            placeholder={t.tasksSearch}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          />
          <select
            value={taskStatusFilter}
            onChange={(event) => setTaskStatusFilter(event.target.value as "all" | "draft" | "review" | "ready")}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          >
            <option value="all">{t.tasksStatusFilter}</option>
            <option value="draft">draft</option>
            <option value="review">review</option>
            <option value="ready">ready</option>
          </select>
          <button
            type="button"
            onClick={() => void loadTasks()}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
          >
            {t.tasksLoad}
          </button>
        </div>

        <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t.tasksCreate}</p>
          <textarea
            value={taskDraftStatement}
            onChange={(event) => setTaskDraftStatement(event.target.value)}
            rows={3}
            placeholder={t.tasksStatement}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          />
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{t.tasksPreview}</p>
            <MarkdownMath className="prose prose-slate max-w-none text-sm">
              {taskDraftStatement.trim() || "—"}
            </MarkdownMath>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <select
              value={taskDraftAnswerType}
              onChange={(event) => setTaskDraftAnswerType(event.target.value as DraftAnswerType)}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm"
            >
              <option value="number">number</option>
              <option value="fraction">fraction</option>
              <option value="ratio">ratio</option>
            </select>
            {taskDraftAnswerType === "number" ? (
              <input
                type="number"
                value={taskDraftNumberValue}
                onChange={(event) => setTaskDraftNumberValue(Number(event.target.value || 0))}
                placeholder={t.tasksAnswerNumber}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm"
              />
            ) : null}
            {taskDraftAnswerType === "fraction" ? (
              <>
                <input
                  type="number"
                  value={taskDraftFractionNumerator}
                  onChange={(event) => setTaskDraftFractionNumerator(Number(event.target.value || 0))}
                  placeholder={t.tasksAnswerNumerator}
                  className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm"
                />
                <input
                  type="number"
                  value={taskDraftFractionDenominator}
                  onChange={(event) => setTaskDraftFractionDenominator(Number(event.target.value || 0))}
                  placeholder={t.tasksAnswerDenominator}
                  className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm"
                />
              </>
            ) : null}
            {taskDraftAnswerType === "ratio" ? (
              <>
                <input
                  type="number"
                  value={taskDraftRatioLeft}
                  onChange={(event) => setTaskDraftRatioLeft(Number(event.target.value || 0))}
                  placeholder={t.tasksAnswerLeft}
                  className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm"
                />
                <input
                  type="number"
                  value={taskDraftRatioRight}
                  onChange={(event) => setTaskDraftRatioRight(Number(event.target.value || 0))}
                  placeholder={t.tasksAnswerRight}
                  className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm"
                />
              </>
            ) : null}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <select
              value={taskDraftStatus}
              onChange={(event) => setTaskDraftStatus(event.target.value as "draft" | "review" | "ready")}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm"
            >
              <option value="draft">draft</option>
              <option value="review">review</option>
              <option value="ready">ready</option>
            </select>
            <input
              type="number"
              min={1}
              max={5}
              value={taskDraftDifficulty}
              onChange={(event) => setTaskDraftDifficulty(Number(event.target.value || 1))}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm"
            />
            <select
              value={taskDraftBand}
              onChange={(event) => setTaskDraftBand(event.target.value as "A" | "B" | "C")}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm"
            >
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
            </select>
          </div>
          <button
            type="button"
            disabled={creatingTask}
            onClick={() => void createTask()}
            className="rounded-lg border border-slate-300 bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {t.tasksCreate}
          </button>
        </div>

        {tasksError ? <p className="text-sm text-red-700">{tasksError}</p> : null}
        {tasksLoading ? <p className="text-sm text-slate-600">{t.loading}</p> : null}
        {!tasksLoading && taskItems.length === 0 ? <p className="text-sm text-slate-600">{t.tasksNoItems}</p> : null}
        <div className="space-y-2">
          {taskItems.map((task) => {
            const isEditing = editingTaskId === task.id;
            const taskAudit = taskAuditById[task.id] ?? [];
            const taskAuditError = taskAuditErrorById[task.id];
            const isTaskAuditLoading = taskAuditLoadingId === task.id;
            const statusChangesTotal = taskAudit.filter((item) => item.changedFields.includes("status")).length;
            const readyTransitionsTotal = taskAudit.filter((item) => item.after?.status === "ready").length;
            return (
              <details key={task.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3" open={isEditing}>
                <summary className="cursor-pointer list-none">
                  <p className="text-sm font-semibold text-slate-950">{task.id}</p>
                  <p className="text-xs text-slate-600">
                    {task.skill_id} • status: {task.status ?? "ready"} • {t.tasksDifficulty}: {task.difficulty} • {t.tasksBand}: {task.difficulty_band ?? "—"}
                  </p>
                </summary>
                <p className="mt-2 text-sm text-slate-800">{task.statement_md}</p>
                <p className="mt-2 text-xs text-slate-700">{formatTaskAnswer(task.answer)}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => startEditTask(task)}
                    className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-100"
                  >
                    {t.skillsEdit}
                  </button>
                  <button
                    type="button"
                    onClick={() => void loadTaskAudit(task.id)}
                    className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-100"
                  >
                    {taskAudit.length > 0 ? t.tasksHistoryReload : t.tasksHistoryLoad}
                  </button>
                  <button
                    type="button"
                    disabled={creatingTask}
                    onClick={() => void deleteTask(task.id)}
                    className="rounded-lg border border-red-300 bg-white px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                  >
                    {t.tasksDelete}
                  </button>
                </div>
                <div className="mt-3 space-y-2 rounded-lg border border-slate-200 bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t.tasksHistory}</p>
                  <div className="grid gap-2 md:grid-cols-4">
                    <select
                      value={taskAuditActionFilter}
                      onChange={(event) =>
                        setTaskAuditActionFilter(event.target.value as TaskAuditActionFilter)
                      }
                      className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900"
                    >
                      <option value="all">{t.tasksHistoryActionAll}</option>
                      <option value="create">{t.tasksHistoryActionCreate}</option>
                      <option value="update">{t.tasksHistoryActionUpdate}</option>
                      <option value="delete">{t.tasksHistoryActionDelete}</option>
                    </select>
                    <select
                      value={taskAuditChangedFieldFilter}
                      onChange={(event) =>
                        setTaskAuditChangedFieldFilter(event.target.value as TaskAuditChangedFieldFilter)
                      }
                      className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900"
                    >
                      <option value="all">{t.tasksHistoryChangedFieldAll}</option>
                      <option value="status">status</option>
                      <option value="difficulty">difficulty</option>
                      <option value="difficulty_band">difficulty_band</option>
                      <option value="answer">answer</option>
                      <option value="statement_md">statement_md</option>
                    </select>
                    <input
                      type="text"
                      value={taskAuditActorFilter}
                      onChange={(event) => setTaskAuditActorFilter(event.target.value)}
                      placeholder={t.tasksHistoryActor}
                      className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900"
                    />
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        onClick={() => applyTaskAuditDatePreset("today")}
                        className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-[11px] text-slate-700 hover:bg-slate-100"
                      >
                        {t.tasksHistoryPresetToday}
                      </button>
                      <button
                        type="button"
                        onClick={() => applyTaskAuditDatePreset("week")}
                        className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-[11px] text-slate-700 hover:bg-slate-100"
                      >
                        {t.tasksHistoryPresetWeek}
                      </button>
                      <button
                        type="button"
                        onClick={() => applyTaskAuditDatePreset("clear")}
                        className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-[11px] text-slate-700 hover:bg-slate-100"
                      >
                        {t.tasksHistoryPresetClear}
                      </button>
                    </div>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    <label className="flex items-center gap-2 text-xs text-slate-700">
                      <span>{t.tasksHistoryFrom}</span>
                      <input
                        type="date"
                        value={taskAuditFromDate}
                        onChange={(event) => setTaskAuditFromDate(event.target.value)}
                        className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900"
                      />
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-700">
                      <span>{t.tasksHistoryTo}</span>
                      <input
                        type="date"
                        value={taskAuditToDate}
                        onChange={(event) => setTaskAuditToDate(event.target.value)}
                        className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900"
                      />
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <label className="inline-flex items-center gap-2 text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={taskAuditStatusOnly}
                        onChange={(event) => setTaskAuditStatusOnly(event.target.checked)}
                        className="h-3.5 w-3.5 rounded border-slate-300"
                      />
                      {t.tasksHistoryStatusOnly}
                    </label>
                    <label className="inline-flex items-center gap-2 text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={taskAuditReadyOnly}
                        onChange={(event) => {
                          const checked = event.target.checked;
                          setTaskAuditReadyOnly(checked);
                          if (checked) setTaskAuditStatusOnly(true);
                        }}
                        className="h-3.5 w-3.5 rounded border-slate-300"
                      />
                      {t.tasksHistoryReadyOnly}
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-slate-300 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-700">
                      {t.tasksHistorySummaryTotal}: {taskAudit.length}
                    </span>
                    <span className="rounded-full border border-slate-300 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-700">
                      {t.tasksHistorySummaryStatus}: {statusChangesTotal}
                    </span>
                    <span className="rounded-full border border-slate-300 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-700">
                      {t.tasksHistorySummaryReady}: {readyTransitionsTotal}
                    </span>
                  </div>
                  {isTaskAuditLoading ? <p className="text-xs text-slate-600">{t.loading}</p> : null}
                  {taskAuditError ? <p className="text-xs text-red-700">{taskAuditError}</p> : null}
                  {!isTaskAuditLoading && !taskAuditError && taskAudit.length === 0 ? (
                    <p className="text-xs text-slate-600">{t.tasksHistoryEmpty}</p>
                  ) : null}
                  {taskAudit.length > 0 ? (
                    <div className="space-y-2">
                      {taskAudit.map((log) => (
                        <div key={log.id} className="rounded-md border border-slate-200 bg-slate-50 p-2">
                          <p className="text-xs font-medium text-slate-900">
                            {log.action} • {formatDateTime(locale, log.createdAt)}
                          </p>
                          <p className="text-[11px] text-slate-600">
                            {log.actor?.username ?? log.actor?.email ?? "system"}
                          </p>
                          {log.changedFields.length > 0 ? (
                            <div className="mt-1 space-y-1">
                              <p className="text-[11px] font-semibold text-slate-600">{t.tasksHistoryChanged}</p>
                              <ul className="space-y-1 text-[11px] text-slate-700">
                                {log.changedFields.map((field) => (
                                  <li key={field}>
                                    {field}: {formatTaskAuditFieldValue(log.before, field)} {"->"}{" "}
                                    {formatTaskAuditFieldValue(log.after, field)}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
                {isEditing ? (
                  <div className="mt-3 space-y-2 rounded-lg border border-slate-300 bg-white p-3">
                    <textarea
                      value={taskDraftStatement}
                      onChange={(event) => setTaskDraftStatement(event.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                    />
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{t.tasksPreview}</p>
                      <MarkdownMath className="prose prose-slate max-w-none text-sm">
                        {taskDraftStatement.trim() || "—"}
                      </MarkdownMath>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <select
                        value={taskDraftAnswerType}
                        onChange={(event) => setTaskDraftAnswerType(event.target.value as DraftAnswerType)}
                        className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                      >
                        <option value="number">number</option>
                        <option value="fraction">fraction</option>
                        <option value="ratio">ratio</option>
                      </select>
                      {taskDraftAnswerType === "number" ? (
                        <input
                          type="number"
                          value={taskDraftNumberValue}
                          onChange={(event) => setTaskDraftNumberValue(Number(event.target.value || 0))}
                          className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                        />
                      ) : null}
                      {taskDraftAnswerType === "fraction" ? (
                        <>
                          <input
                            type="number"
                            value={taskDraftFractionNumerator}
                            onChange={(event) => setTaskDraftFractionNumerator(Number(event.target.value || 0))}
                            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                          />
                          <input
                            type="number"
                            value={taskDraftFractionDenominator}
                            onChange={(event) => setTaskDraftFractionDenominator(Number(event.target.value || 0))}
                            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                          />
                        </>
                      ) : null}
                      {taskDraftAnswerType === "ratio" ? (
                        <>
                          <input
                            type="number"
                            value={taskDraftRatioLeft}
                            onChange={(event) => setTaskDraftRatioLeft(Number(event.target.value || 0))}
                            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                          />
                          <input
                            type="number"
                            value={taskDraftRatioRight}
                            onChange={(event) => setTaskDraftRatioRight(Number(event.target.value || 0))}
                            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                          />
                        </>
                      ) : null}
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <select
                        value={taskDraftStatus}
                        onChange={(event) => setTaskDraftStatus(event.target.value as "draft" | "review" | "ready")}
                        className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                      >
                        <option value="draft">draft</option>
                        <option value="review">review</option>
                        <option value="ready">ready</option>
                      </select>
                      <input
                        type="number"
                        min={1}
                        max={5}
                        value={taskDraftDifficulty}
                        onChange={(event) => setTaskDraftDifficulty(Number(event.target.value || 1))}
                        className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                      />
                      <select
                        value={taskDraftBand}
                        onChange={(event) => setTaskDraftBand(event.target.value as "A" | "B" | "C")}
                        className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                      >
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                      </select>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={creatingTask}
                        onClick={() => void updateTask(task.id)}
                        className="rounded-lg border border-slate-300 bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                      >
                        {t.tasksUpdate}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingTaskId(null)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                      >
                        {t.skillsCancel}
                      </button>
                    </div>
                  </div>
                ) : null}
              </details>
            );
          })}
        </div>
      </section>

      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-semibold tracking-tight text-slate-950">{t.auditTitle}</h2>
        <div className="flex flex-wrap gap-2">
          {([
            ["all", t.auditFilterAll],
            ["auth", t.auditFilterAuth],
            ["success", t.auditFilterSuccess],
            ["failure", t.auditFilterFailure],
            ["blocked", t.auditFilterBlocked],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setLogsActionFilter(value)}
              className={[
                "rounded-full border px-3 py-1 text-xs font-medium",
                logsActionFilter === value
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={logsQuery}
          onChange={(event) => setLogsQuery(event.target.value)}
          placeholder={t.auditSearch}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
        />
        {sectionErrors.logs ? <p className="text-sm text-red-700">{sectionErrors.logs}</p> : null}
        {filteredLogs.length === 0 ? (
          <p className="text-sm text-slate-600">{t.noLogs}</p>
        ) : (
          <div className="space-y-2">
            {filteredLogs.map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-sm font-semibold text-slate-950">
                  {item.action} • {item.entityType}:{item.entityId}
                </p>
                <p className="text-xs text-slate-600">
                  {formatDateTime(locale, item.createdAt)} • {item.actor?.username ?? item.actor?.email ?? "system"}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
