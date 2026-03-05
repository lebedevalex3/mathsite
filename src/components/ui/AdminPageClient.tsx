"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { SurfaceCard } from "@/src/components/ui/SurfaceCard";
import { buildAdminSectionErrors, formatAdminSectionFailures } from "@/src/components/ui/admin-page-client.utils";
import { formatDateTime } from "@/src/lib/i18n/format";

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
  const [sectionErrors, setSectionErrors] = useState<{
    students: string | null;
    logs: string | null;
    content: string | null;
  }>({
    students: null,
    logs: null,
    content: null,
  });
  const [contentQuery, setContentQuery] = useState("");
  const [contentDomain, setContentDomain] = useState<"all" | "arithmetic" | "algebra" | "geometry" | "data">("all");
  const [contentStatus, setContentStatus] = useState<"all" | "ready" | "soon">("all");

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

  const refreshAdminData = useCallback(async () => {
    const results = await Promise.allSettled([loadStudents(), loadLogs(), loadContent()]);
    const sectionNames = [t.studentsTitle, t.auditTitle, t.contentTitle] as const;
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
    loadStudents,
    t.auditTitle,
    t.contentTitle,
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
