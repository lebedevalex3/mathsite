"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { SurfaceCard } from "@/src/components/ui/SurfaceCard";
import { listContentTopicConfigs } from "@/src/lib/content/topic-registry";
import { formatDateTime, formatNumber } from "@/src/lib/i18n/format";
import { topicCatalogEntries } from "@/src/lib/topicMeta";
import type { WorkType } from "@/src/lib/variants/print-recommendation";

type Locale = "ru" | "en" | "de";

type Props = {
  locale: Locale;
  initialReason?: "auth" | "role" | null;
};

type SessionUser = {
  id: string;
  role: "student" | "teacher" | "admin";
  email: string | null;
  username: string | null;
  mustChangePassword: boolean;
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

type ClassItem = {
  id: string;
  name: string;
  joinCode: string;
  isArchived: boolean;
  studentsCount: number;
  createdAt: string;
};

type ClassStudentItem = {
  id: string;
  username: string | null;
  mustChangePassword: boolean;
  createdAt: string;
};

const copy = {
  ru: {
    eyebrow: "Teacher tools",
    title: "Личный кабинет",
    subtitle: "Войдите, чтобы сохранять и видеть историю собранных работ.",
    identifier: "Email или username",
    identifierPlaceholder: "Например, teacher@school.ru или s8k3m2f1",
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
    redirectedAuth: "Чтобы открыть этот раздел, сначала войдите в личный кабинет.",
    redirectedRole: "Для доступа к этому разделу нужна роль teacher или admin.",
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
    historyCreateFirst: "Собрать первую работу",
    historyVariantsUnit: "вариантов",
    historyTasksUnit: "задач",
    authError: "Не удалось выполнить действие. Попробуйте ещё раз.",
    passwordHint: "Минимум 8 символов.",
    classesTitle: "Группы",
    classesSubtitle: "Создавайте группы и управляйте учениками без email.",
    newClassPlaceholder: "Например, 5А",
    createClass: "Создать группу",
    joinCode: "Код вступления",
    studentsCount: "Учеников",
    studentsTitle: "Ученики группы",
    studentsEmpty: "В этой группе пока нет учеников.",
    newStudentUsernamePlaceholder: "username (опционально)",
    createStudent: "Создать ученика",
    removeStudent: "Удалить из группы",
    resetStudentPassword: "Сбросить пароль",
    temporaryPassword: "Временный пароль",
    temporaryPasswordHint: "Покажите ученику один раз. При первом входе пароль нужно сменить.",
    mustChangePassword: "Требуется смена пароля",
    selectClassHint: "Выберите группу, чтобы управлять учениками.",
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
    identifier: "Email or username",
    identifierPlaceholder: "For example, teacher@school.com or s8k3m2f1",
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
    redirectedAuth: "Sign in first to open that section.",
    redirectedRole: "Teacher or admin role is required to access that section.",
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
    historyCreateFirst: "Create first work",
    historyVariantsUnit: "variants",
    historyTasksUnit: "tasks",
    authError: "Action failed. Please try again.",
    passwordHint: "At least 8 characters.",
    classesTitle: "Classes",
    classesSubtitle: "Create classes and manage students without email.",
    newClassPlaceholder: "For example, 5A",
    createClass: "Create class",
    joinCode: "Join code",
    studentsCount: "Students",
    studentsTitle: "Class students",
    studentsEmpty: "No students in this class yet.",
    newStudentUsernamePlaceholder: "username (optional)",
    createStudent: "Create student",
    removeStudent: "Remove from class",
    resetStudentPassword: "Reset password",
    temporaryPassword: "Temporary password",
    temporaryPasswordHint: "Show it once to the student. They must change it after first sign-in.",
    mustChangePassword: "Password change required",
    selectClassHint: "Select a class to manage students.",
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
    identifier: "E-Mail oder Username",
    identifierPlaceholder: "Zum Beispiel teacher@school.de oder s8k3m2f1",
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
    redirectedAuth: "Melden Sie sich zuerst an, um diesen Bereich zu öffnen.",
    redirectedRole: "Für diesen Bereich ist die Rolle teacher oder admin erforderlich.",
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
    historyCreateFirst: "Erste Arbeit erstellen",
    historyVariantsUnit: "Varianten",
    historyTasksUnit: "Aufgaben",
    authError: "Aktion fehlgeschlagen. Bitte erneut versuchen.",
    passwordHint: "Mindestens 8 Zeichen.",
    classesTitle: "Klassen",
    classesSubtitle: "Klassen erstellen und Schüler ohne E-Mail verwalten.",
    newClassPlaceholder: "Zum Beispiel, 5A",
    createClass: "Klasse erstellen",
    joinCode: "Beitrittscode",
    studentsCount: "Schüler",
    studentsTitle: "Schüler der Klasse",
    studentsEmpty: "Noch keine Schüler in dieser Klasse.",
    newStudentUsernamePlaceholder: "Username (optional)",
    createStudent: "Schüler erstellen",
    removeStudent: "Aus Klasse entfernen",
    resetStudentPassword: "Passwort zurücksetzen",
    temporaryPassword: "Temporäres Passwort",
    temporaryPasswordHint: "Nur einmal dem Schüler zeigen. Beim ersten Login muss es geändert werden.",
    mustChangePassword: "Passwortänderung erforderlich",
    selectClassHint: "Wählen Sie eine Klasse, um Schüler zu verwalten.",
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

export function TeacherCabinetPageClient({ locale, initialReason = null }: Props) {
  const t = copy[locale];
  const router = useRouter();
  const topicConfigs = useMemo(() => listContentTopicConfigs(), []);
  const [loading, setLoading] = useState(true);
  const [identifier, setIdentifier] = useState("");
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
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [newClassName, setNewClassName] = useState("");
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [students, setStudents] = useState<ClassStudentItem[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [newStudentUsername, setNewStudentUsername] = useState("");
  const [creatingStudent, setCreatingStudent] = useState(false);
  const [removingStudentId, setRemovingStudentId] = useState<string | null>(null);
  const [resettingStudentId, setResettingStudentId] = useState<string | null>(null);
  const [lastCreatedCredentials, setLastCreatedCredentials] = useState<{
    username: string | null;
    temporaryPassword: string;
  } | null>(null);
  const [lastResetCredentials, setLastResetCredentials] = useState<{
    username: string | null;
    temporaryPassword: string;
  } | null>(null);

  const isTeacherRole = sessionUser?.role === "teacher" || sessionUser?.role === "admin";
  const roleText =
    sessionUser?.role === "admin"
      ? t.roleAdmin
      : sessionUser?.role === "teacher"
        ? t.roleTeacher
        : t.roleStudent;
  const topicTitleById = useMemo(() => {
    const map = new Map<string, string>();
    for (const cfg of topicConfigs) {
      const topicId =
        topicCatalogEntries.find(
          (entry) => entry.id === cfg.topicSlug || entry.slug.endsWith(`/${cfg.topicSlug}`),
        )?.id ?? cfg.topicSlug;
      const title = cfg.titles?.[locale] ?? cfg.titles?.ru ?? topicId;
      map.set(topicId, title);
    }
    return map;
  }, [locale, topicConfigs]);

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

  useEffect(() => {
    if (!sessionUser?.mustChangePassword) return;
    const next = encodeURIComponent(`/${locale}/teacher/cabinet`);
    router.replace(`/${locale}/auth/change-password?next=${next}`);
  }, [locale, router, sessionUser?.mustChangePassword]);

  async function submitAuth(url: "/api/auth/sign-in" | "/api/auth/sign-up") {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ identifier, password }),
      });
      const payload = (await response.json()) as
        | { ok?: boolean; user?: SessionUser; message?: string }
        | undefined;
      if (!response.ok || !payload?.ok || !payload.user) {
        setError(payload?.message ?? t.authError);
        return;
      }
      setSessionUser(payload.user);
      setIdentifier("");
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

  const loadClasses = useCallback(async () => {
    if (!sessionUser) {
      setClasses([]);
      setSelectedClassId(null);
      return;
    }
    if (!(sessionUser.role === "teacher" || sessionUser.role === "admin")) {
      setClasses([]);
      setSelectedClassId(null);
      return;
    }
    setLoadingClasses(true);
    try {
      const response = await fetch("/api/classes", { credentials: "same-origin" });
      const payload = (await response.json()) as { ok?: boolean; classes?: ClassItem[] };
      if (!response.ok || !payload.ok) return;
      const nextClasses = Array.isArray(payload.classes) ? payload.classes : [];
      setClasses(nextClasses);
      setSelectedClassId((prev) => {
        if (prev && nextClasses.some((item) => item.id === prev)) return prev;
        return nextClasses[0]?.id ?? null;
      });
    } catch {
      // optional block
    } finally {
      setLoadingClasses(false);
    }
  }, [sessionUser]);

  const loadStudents = useCallback(async (classId: string) => {
    setLoadingStudents(true);
    try {
      const response = await fetch(`/api/classes/${classId}/students`, {
        credentials: "same-origin",
      });
      const payload = (await response.json()) as { ok?: boolean; students?: ClassStudentItem[] };
      if (!response.ok || !payload.ok) return;
      setStudents(Array.isArray(payload.students) ? payload.students : []);
    } catch {
      // optional block
    } finally {
      setLoadingStudents(false);
    }
  }, []);

  useEffect(() => {
    if (!sessionUser) {
      setWorks([]);
      return;
    }
    void loadWorks();
  }, [sessionUser, loadWorks]);

  useEffect(() => {
    if (!sessionUser || !isTeacherRole) {
      setClasses([]);
      setSelectedClassId(null);
      setStudents([]);
      return;
    }
    void loadClasses();
  }, [isTeacherRole, loadClasses, sessionUser]);

  useEffect(() => {
    if (!selectedClassId) {
      setStudents([]);
      return;
    }
    void loadStudents(selectedClassId);
  }, [loadStudents, selectedClassId]);

  async function createClass() {
    const name = newClassName.trim();
    if (!name) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/classes", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const payload = (await response.json()) as { ok?: boolean; message?: string; class?: ClassItem };
      if (!response.ok || !payload.ok) {
        setError(payload.message ?? t.authError);
        return;
      }
      setNewClassName("");
      await loadClasses();
      if (payload.class?.id) setSelectedClassId(payload.class.id);
    } catch {
      setError(t.authError);
    } finally {
      setBusy(false);
    }
  }

  async function createStudent() {
    if (!selectedClassId) return;
    setCreatingStudent(true);
    setError(null);
    setLastCreatedCredentials(null);
    setLastResetCredentials(null);
    try {
      const response = await fetch(`/api/classes/${selectedClassId}/students`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newStudentUsername.trim() || undefined }),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
        student?: { username: string | null };
        temporaryPassword?: string;
      };
      if (!response.ok || !payload.ok || !payload.temporaryPassword) {
        setError(payload.message ?? t.authError);
        return;
      }
      setNewStudentUsername("");
      setLastCreatedCredentials({
        username: payload.student?.username ?? null,
        temporaryPassword: payload.temporaryPassword,
      });
      await loadClasses();
      await loadStudents(selectedClassId);
    } catch {
      setError(t.authError);
    } finally {
      setCreatingStudent(false);
    }
  }

  async function removeStudent(studentId: string) {
    if (!selectedClassId) return;
    setRemovingStudentId(studentId);
    setError(null);
    try {
      const response = await fetch(`/api/classes/${selectedClassId}/students/${studentId}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; message?: string };
      if (!response.ok || !payload.ok) {
        setError(payload.message ?? t.authError);
        return;
      }
      await loadClasses();
      await loadStudents(selectedClassId);
    } catch {
      setError(t.authError);
    } finally {
      setRemovingStudentId(null);
    }
  }

  async function resetStudentPassword(studentId: string) {
    setResettingStudentId(studentId);
    setError(null);
    setLastResetCredentials(null);
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
        setError(payload.message ?? t.authError);
        return;
      }
      setLastResetCredentials({
        username: payload.student?.username ?? null,
        temporaryPassword: payload.temporaryPassword,
      });
      if (selectedClassId) {
        await loadStudents(selectedClassId);
      }
    } catch {
      setError(t.authError);
    } finally {
      setResettingStudentId(null);
    }
  }

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

  const activeClass = useMemo(
    () => classes.find((item) => item.id === selectedClassId) ?? null,
    [classes, selectedClassId],
  );

  return (
    <main className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">{t.eyebrow}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{t.title}</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">{t.subtitle}</p>
        {initialReason ? (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {initialReason === "auth" ? t.redirectedAuth : t.redirectedRole}
          </div>
        ) : null}
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
              <span className="text-sm font-medium text-slate-700">{t.identifier}</span>
              <input
                type="text"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder={t.identifierPlaceholder}
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
              <h2 className="text-xl font-semibold tracking-tight text-slate-950">{t.classesTitle}</h2>
              <p className="mt-1 text-sm text-slate-600">{t.classesSubtitle}</p>
            </div>
            <button
              type="button"
              onClick={() => void loadClasses()}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
            >
              {loadingClasses ? "..." : "↻"}
            </button>
          </div>

          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <input
              type="text"
              value={newClassName}
              onChange={(event) => setNewClassName(event.target.value)}
              placeholder={t.newClassPlaceholder}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            />
            <button
              type="button"
              onClick={() => void createClass()}
              disabled={busy}
              className="rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
            >
              {t.createClass}
            </button>
          </div>

          {classes.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              {t.selectClassHint}
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
              <div className="space-y-2">
                {classes.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedClassId(item.id)}
                    className={[
                      "w-full rounded-xl border p-3 text-left",
                      selectedClassId === item.id
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-slate-50 text-slate-900 hover:bg-slate-100",
                    ].join(" ")}
                  >
                    <p className="text-sm font-semibold">{item.name}</p>
                    <p
                      className={[
                        "mt-1 text-xs",
                        selectedClassId === item.id ? "text-slate-200" : "text-slate-600",
                      ].join(" ")}
                    >
                      {t.joinCode}: {item.joinCode} • {t.studentsCount}: {item.studentsCount}
                    </p>
                  </button>
                ))}
              </div>

              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-lg font-semibold text-slate-950">
                  {activeClass ? `${t.studentsTitle} · ${activeClass.name}` : t.studentsTitle}
                </h3>
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <input
                    type="text"
                    value={newStudentUsername}
                    onChange={(event) => setNewStudentUsername(event.target.value)}
                    placeholder={t.newStudentUsernamePlaceholder}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => void createStudent()}
                    disabled={!activeClass || creatingStudent}
                    className="rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
                  >
                    {creatingStudent ? "..." : t.createStudent}
                  </button>
                </div>

                {lastCreatedCredentials ? (
                  <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900">
                    <p>
                      <span className="font-semibold">{t.temporaryPassword}:</span>{" "}
                      <code>{lastCreatedCredentials.temporaryPassword}</code>
                    </p>
                    <p className="mt-1 text-xs">{t.temporaryPasswordHint}</p>
                  </div>
                ) : null}

                {lastResetCredentials ? (
                  <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                    <p>
                      <span className="font-semibold">{t.temporaryPassword}:</span>{" "}
                      <code>{lastResetCredentials.temporaryPassword}</code>
                    </p>
                    <p className="mt-1 text-xs">{t.temporaryPasswordHint}</p>
                  </div>
                ) : null}

                {loadingStudents ? (
                  <p className="text-sm text-slate-600">...</p>
                ) : students.length === 0 ? (
                  <p className="text-sm text-slate-600">{t.studentsEmpty}</p>
                ) : (
                  <div className="space-y-2">
                    {students.map((student) => (
                      <div
                        key={student.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-950">{student.username ?? student.id}</p>
                          {student.mustChangePassword ? (
                            <p className="text-xs text-amber-700">{t.mustChangePassword}</p>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => void resetStudentPassword(student.id)}
                            disabled={resettingStudentId === student.id}
                            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-100 disabled:opacity-60"
                          >
                            {resettingStudentId === student.id ? "..." : t.resetStudentPassword}
                          </button>
                          <button
                            type="button"
                            onClick={() => void removeStudent(student.id)}
                            disabled={removingStudentId === student.id}
                            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-100 disabled:opacity-60"
                          >
                            {removingStudentId === student.id ? "..." : t.removeStudent}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      ) : null}

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
              <p>{t.historyEmpty}</p>
              <Link
                href={`/${locale}/teacher-tools`}
                className="mt-3 inline-flex items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
              >
                {t.historyCreateFirst}
              </Link>
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
                            {topicTitleById.get(work.topicId) ?? work.topicId}
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
