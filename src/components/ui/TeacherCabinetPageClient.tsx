"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { SurfaceCard } from "@/src/components/ui/SurfaceCard";
import { formatDateTime, formatNumber } from "@/src/lib/i18n/format";
import type { WorkType } from "@/src/lib/variants/print-recommendation";

type Locale = "ru" | "en" | "de";

type Props = {
  locale: Locale;
};

type SessionUser = {
  id: string;
  role: "student" | "teacher" | "admin";
  email: string | null;
};

type SessionResponse =
  | { ok: true; authenticated: false }
  | { ok: true; authenticated: true; user: SessionUser }
  | { ok: false; message?: string };

type HistoryWork = {
  id: string;
  topicId: string;
  title: string;
  workType: WorkType;
  printProfileJson: unknown;
  createdAt: string;
  variantsCount: number;
};

const copy = {
  ru: {
    eyebrow: "Teacher tools",
    title: "Личный кабинет",
    subtitle: "Войдите, чтобы сохранять и видеть историю собранных работ.",
    email: "Email",
    password: "Пароль",
    signIn: "Войти",
    signUp: "Зарегистрироваться",
    signOut: "Выйти",
    loading: "Загрузка...",
    signedIn: "Вы вошли как",
    roleLabel: "Роль",
    roleStudent: "Ученик",
    roleTeacher: "Учитель",
    roleAdmin: "Администратор",
    teacherOnlyTitle: "Кабинет учителя доступен только для роли teacher/admin",
    teacherOnlyBody:
      "Сейчас ваш аккаунт имеет роль student. Подайте заявку или включите teacher-доступ в dev-режиме.",
    becomeTeacher: "Стать учителем (dev)",
    teachersPage: "Страница для учителей",
    goTools: "Открыть конструктор",
    historyTitle: "Мои работы",
    historySubtitle: "Сохранённые работы в личном кабинете.",
    historySearch: "Поиск по названию...",
    historyAll: "Все",
    historyOpen: "Открыть",
    historyDuplicate: "Создать копию",
    historyEmpty: "Пока нет сохранённых работ.",
    historyVariantsUnit: "вариантов",
    historyTasksUnit: "задач",
    authError: "Не удалось выполнить действие. Попробуйте ещё раз.",
    passwordHint: "Минимум 8 символов.",
    workTypes: {
      lesson: "Работа на уроке",
      quiz: "Самостоятельная",
      homework: "Домашняя работа",
      test: "Контрольная",
    } satisfies Record<WorkType, string>,
  },
  en: {
    eyebrow: "Teacher tools",
    title: "Personal workspace",
    subtitle: "Sign in to save and view generated work history.",
    email: "Email",
    password: "Password",
    signIn: "Sign in",
    signUp: "Sign up",
    signOut: "Sign out",
    loading: "Loading...",
    signedIn: "Signed in as",
    roleLabel: "Role",
    roleStudent: "Student",
    roleTeacher: "Teacher",
    roleAdmin: "Admin",
    teacherOnlyTitle: "Teacher workspace is available only for teacher/admin role",
    teacherOnlyBody:
      "Your account currently has student role. Apply for teacher access or enable teacher role in dev mode.",
    becomeTeacher: "Become teacher (dev)",
    teachersPage: "Teachers page",
    goTools: "Open constructor",
    historyTitle: "My works",
    historySubtitle: "Saved works in your workspace.",
    historySearch: "Search by title...",
    historyAll: "All",
    historyOpen: "Open",
    historyDuplicate: "Duplicate",
    historyEmpty: "No saved works yet.",
    historyVariantsUnit: "variants",
    historyTasksUnit: "tasks",
    authError: "Action failed. Please try again.",
    passwordHint: "At least 8 characters.",
    workTypes: {
      lesson: "Lesson work",
      quiz: "Quiz",
      homework: "Homework",
      test: "Test",
    } satisfies Record<WorkType, string>,
  },
  de: {
    eyebrow: "Teacher tools",
    title: "Persönlicher Bereich",
    subtitle: "Melden Sie sich an, um den Verlauf der erstellten Arbeiten zu speichern und zu sehen.",
    email: "E-Mail",
    password: "Passwort",
    signIn: "Anmelden",
    signUp: "Registrieren",
    signOut: "Abmelden",
    loading: "Laden...",
    signedIn: "Angemeldet als",
    roleLabel: "Rolle",
    roleStudent: "Schüler",
    roleTeacher: "Lehrkraft",
    roleAdmin: "Admin",
    teacherOnlyTitle: "Der Lehrkräfte-Bereich ist nur für teacher/admin verfügbar",
    teacherOnlyBody:
      "Ihr Konto hat aktuell die Rolle student. Beantragen Sie Lehrkräfte-Zugang oder aktivieren Sie teacher im Dev-Modus.",
    becomeTeacher: "Teacher werden (dev)",
    teachersPage: "Lehrkräfte-Seite",
    goTools: "Konstruktor öffnen",
    historyTitle: "Meine Arbeiten",
    historySubtitle: "Gespeicherte Arbeiten im persönlichen Bereich.",
    historySearch: "Nach Titel suchen...",
    historyAll: "Alle",
    historyOpen: "Öffnen",
    historyDuplicate: "Kopie erstellen",
    historyEmpty: "Noch keine Arbeiten gespeichert.",
    historyVariantsUnit: "Varianten",
    historyTasksUnit: "Aufgaben",
    authError: "Aktion fehlgeschlagen. Bitte erneut versuchen.",
    passwordHint: "Mindestens 8 Zeichen.",
    workTypes: {
      lesson: "Unterricht",
      quiz: "Kurztest",
      homework: "Hausaufgabe",
      test: "Klassenarbeit",
    } satisfies Record<WorkType, string>,
  },
} as const;

function parseGeneration(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const generation = (value as { generation?: unknown }).generation;
  if (!generation || typeof generation !== "object") return null;
  return generation as {
    plan?: Array<{ count?: number }>;
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

export function TeacherCabinetPageClient({ locale }: Props) {
  const t = copy[locale];
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [loadingWorks, setLoadingWorks] = useState(false);
  const [works, setWorks] = useState<HistoryWork[]>([]);
  const [historyQuery, setHistoryQuery] = useState("");
  const [historyFilter, setHistoryFilter] = useState<"all" | WorkType>("all");
  const [duplicateWorkId, setDuplicateWorkId] = useState<string | null>(null);
  const [promotingTeacher, setPromotingTeacher] = useState(false);

  const isTeacherRole = sessionUser?.role === "teacher" || sessionUser?.role === "admin";
  const roleText =
    sessionUser?.role === "admin"
      ? t.roleAdmin
      : sessionUser?.role === "teacher"
        ? t.roleTeacher
        : t.roleStudent;

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/auth/session", { credentials: "same-origin" });
        const payload = (await response.json()) as SessionResponse;
        if (response.ok && payload.ok && payload.authenticated) {
          setSessionUser(payload.user);
        } else {
          setSessionUser(null);
        }
      } catch {
        setSessionUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function submitAuth(url: "/api/auth/sign-in" | "/api/auth/sign-up") {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, password }),
      });
      const payload = (await response.json()) as
        | { ok?: boolean; user?: SessionUser; message?: string }
        | undefined;
      if (!response.ok || !payload?.ok || !payload.user) {
        setError(payload?.message ?? t.authError);
        return;
      }
      setSessionUser(payload.user);
      setPassword("");
    } catch {
      setError(t.authError);
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setBusy(true);
    setError(null);
    try {
      await fetch("/api/auth/sign-out", {
        method: "POST",
        credentials: "same-origin",
      });
      setSessionUser(null);
      setWorks([]);
    } catch {
      setError(t.authError);
    } finally {
      setBusy(false);
    }
  }

  async function becomeTeacherDev() {
    setPromotingTeacher(true);
    setError(null);
    try {
      const response = await fetch("/api/teacher/become", {
        method: "POST",
        credentials: "same-origin",
      });
      const payload = (await response.json()) as { ok?: boolean; user?: SessionUser; message?: string };
      if (!response.ok || !payload.ok || !payload.user) {
        setError(payload.message ?? t.authError);
        return;
      }
      setSessionUser(payload.user);
    } catch {
      setError(t.authError);
    } finally {
      setPromotingTeacher(false);
    }
  }

  const loadWorks = useCallback(async () => {
    if (!sessionUser) {
      setWorks([]);
      return;
    }
    setLoadingWorks(true);
    try {
      const response = await fetch("/api/teacher/demo/works", {
        credentials: "same-origin",
      });
      const payload = (await response.json()) as { ok?: boolean; works?: HistoryWork[] };
      if (!response.ok || !payload.ok) return;
      setWorks(Array.isArray(payload.works) ? payload.works : []);
    } catch {
      // optional block: keep silent in cabinet
    } finally {
      setLoadingWorks(false);
    }
  }, [sessionUser]);

  useEffect(() => {
    if (!sessionUser) {
      setWorks([]);
      return;
    }
    void loadWorks();
  }, [sessionUser, loadWorks]);

  async function handleDuplicateWork(workId: string) {
    setDuplicateWorkId(workId);
    try {
      const response = await fetch(`/api/teacher/demo/works/${workId}/duplicate`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });
      const payload = (await response.json()) as { ok?: boolean };
      if (!response.ok || !payload.ok) return;
      await loadWorks();
    } catch {
      // keep silent in secondary action
    } finally {
      setDuplicateWorkId(null);
    }
  }

  const filteredWorks = useMemo(() => {
    const query = historyQuery.trim().toLowerCase();
    return works
      .filter((work) => (historyFilter === "all" ? true : work.workType === historyFilter))
      .filter((work) => {
        const generation = parseGeneration(work.printProfileJson);
        const title = buildHistoryTitle({
          locale,
          workType: work.workType,
          customTitle: generation?.titleTemplate?.customTitle ?? null,
          date: generation?.titleTemplate?.date ?? null,
        });
        if (!query) return true;
        return title.toLowerCase().includes(query);
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [historyFilter, historyQuery, locale, works]);

  return (
    <main className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">{t.eyebrow}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{t.title}</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">{t.subtitle}</p>
      </section>

      <SurfaceCard className="p-6">
        {loading ? (
          <p className="text-sm text-slate-600">{t.loading}</p>
        ) : sessionUser ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-700">
              {t.signedIn}: <span className="font-semibold text-slate-950">{sessionUser.email ?? sessionUser.id}</span>
            </p>
            <p className="text-sm text-slate-700">
              {t.roleLabel}: <span className="font-semibold text-slate-950">{roleText}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/${locale}/teacher-tools`}
                className="inline-flex items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
              >
                {t.goTools}
              </Link>
              <button
                type="button"
                onClick={() => void signOut()}
                disabled={busy}
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100 disabled:opacity-60"
              >
                {t.signOut}
              </button>
            </div>
            {!isTeacherRole ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-900">{t.teacherOnlyTitle}</p>
                <p className="mt-1 text-sm text-amber-800">{t.teacherOnlyBody}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void becomeTeacherDev()}
                    disabled={promotingTeacher}
                    className="inline-flex items-center justify-center rounded-lg border border-amber-800 bg-amber-800 px-3 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-60"
                  >
                    {promotingTeacher ? "..." : t.becomeTeacher}
                  </button>
                  <Link
                    href={`/${locale}/teachers`}
                    className="inline-flex items-center justify-center rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100"
                  >
                    {t.teachersPage}
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="space-y-3">
            <label className="block space-y-1">
              <span className="text-sm font-medium text-slate-700">{t.email}</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium text-slate-700">{t.password}</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              />
              <span className="text-xs text-slate-500">{t.passwordHint}</span>
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void submitAuth("/api/auth/sign-in")}
                disabled={busy}
                className="inline-flex items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
              >
                {t.signIn}
              </button>
              <button
                type="button"
                onClick={() => void submitAuth("/api/auth/sign-up")}
                disabled={busy}
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100 disabled:opacity-60"
              >
                {t.signUp}
              </button>
            </div>
            {error ? <p className="text-sm text-red-700">{error}</p> : null}
          </div>
        )}
      </SurfaceCard>

      {sessionUser && isTeacherRole ? (
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

          {filteredWorks.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              {t.historyEmpty}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredWorks.map((work) => {
                const generation = parseGeneration(work.printProfileJson);
                const tasksCount =
                  generation?.plan?.reduce(
                    (sum, item) => sum + (typeof item.count === "number" ? item.count : 0),
                    0,
                  ) ?? 0;
                const displayTitle = buildHistoryTitle({
                  locale,
                  workType: work.workType,
                  customTitle: generation?.titleTemplate?.customTitle ?? null,
                  date: generation?.titleTemplate?.date ?? null,
                });
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
                            {work.topicId}
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
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      ) : null}
    </main>
  );
}
