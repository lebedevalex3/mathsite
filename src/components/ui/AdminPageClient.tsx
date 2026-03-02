"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { SurfaceCard } from "@/src/components/ui/SurfaceCard";
import { formatDateTime } from "@/src/lib/i18n/format";

type Locale = "ru" | "en" | "de";

type SessionResponse =
  | { ok: true; authenticated: false }
  | {
      ok: true;
      authenticated: true;
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
    noLogs: "События не найдены.",
    refresh: "Обновить",
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
    noLogs: "No events found.",
    refresh: "Refresh",
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
    noLogs: "Keine Ereignisse gefunden.",
    refresh: "Aktualisieren",
    loading: "Laden...",
    errorFallback: "Aktion fehlgeschlagen.",
  },
} as const;

export function AdminPageClient({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [studentsQuery, setStudentsQuery] = useState("");
  const [logs, setLogs] = useState<AuditItem[]>([]);
  const [logsQuery, setLogsQuery] = useState("");
  const [resettingStudentId, setResettingStudentId] = useState<string | null>(null);
  const [lastReset, setLastReset] = useState<{ username: string | null; temporaryPassword: string } | null>(null);

  const filteredStudents = useMemo(() => {
    const q = studentsQuery.trim().toLowerCase();
    if (!q) return students;
    return students.filter((item) =>
      [item.username ?? "", item.email ?? "", item.id].join(" ").toLowerCase().includes(q),
    );
  }, [students, studentsQuery]);

  const filteredLogs = useMemo(() => {
    const q = logsQuery.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter((item) =>
      [item.action, item.entityType, item.entityId, item.actor?.username ?? "", item.actor?.email ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [logs, logsQuery]);

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

  useEffect(() => {
    void (async () => {
      try {
        const sessionResponse = await fetch("/api/auth/session", { credentials: "same-origin" });
        const sessionPayload = (await sessionResponse.json()) as SessionResponse;
        const admin = Boolean(
          sessionResponse.ok && sessionPayload.ok && sessionPayload.authenticated && sessionPayload.user.role === "admin",
        );
        setIsAdmin(admin);
        if (!admin) return;
        await Promise.all([loadStudents(), loadLogs()]);
      } catch (err) {
        setError(err instanceof Error ? err.message : t.errorFallback);
      } finally {
        setLoading(false);
      }
    })();
  }, [loadLogs, loadStudents, t.errorFallback]);

  async function handleResetStudent(studentId: string) {
    setResettingStudentId(studentId);
    setError(null);
    setLastReset(null);
    try {
      const response = await fetch(`/api/students/${studentId}/reset-password`, {
        method: "POST",
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
            onClick={() => void Promise.all([loadStudents(), loadLogs()])}
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
        <h2 className="text-xl font-semibold tracking-tight text-slate-950">{t.auditTitle}</h2>
        <input
          type="text"
          value={logsQuery}
          onChange={(event) => setLogsQuery(event.target.value)}
          placeholder={t.auditSearch}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
        />
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
