"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { SurfaceCard } from "@/src/components/ui/SurfaceCard";

type Locale = "ru" | "en" | "de";

type SessionResponse =
  | {
      ok: true;
      authenticated: false;
      csrfToken?: string;
    }
  | {
      ok: true;
      authenticated: true;
      csrfToken?: string;
      user: {
        id: string;
        role: "student" | "teacher" | "admin";
        mustChangePassword?: boolean;
      };
    }
  | { ok: false; message?: string };

type Props = {
  locale: Locale;
  nextPath?: string | null;
};

const copy = {
  ru: {
    title: "Смена пароля",
    subtitle: "Для продолжения работы нужно обновить пароль.",
    currentPassword: "Текущий пароль",
    newPassword: "Новый пароль",
    submit: "Сохранить пароль",
    loading: "Проверка сессии...",
    done: "Пароль обновлён. Перенаправление...",
    authRequired: "Нужна авторизация.",
    backToCabinet: "В кабинет",
    errorFallback: "Не удалось сменить пароль. Попробуйте ещё раз.",
  },
  en: {
    title: "Change password",
    subtitle: "You need to update your password to continue.",
    currentPassword: "Current password",
    newPassword: "New password",
    submit: "Save password",
    loading: "Checking session...",
    done: "Password updated. Redirecting...",
    authRequired: "Sign-in required.",
    backToCabinet: "Back to workspace",
    errorFallback: "Failed to change password. Please try again.",
  },
  de: {
    title: "Passwort ändern",
    subtitle: "Zum Fortfahren müssen Sie Ihr Passwort aktualisieren.",
    currentPassword: "Aktuelles Passwort",
    newPassword: "Neues Passwort",
    submit: "Passwort speichern",
    loading: "Sitzung wird geprüft...",
    done: "Passwort aktualisiert. Weiterleitung...",
    authRequired: "Anmeldung erforderlich.",
    backToCabinet: "Zurück zum Bereich",
    errorFallback: "Passwort konnte nicht geändert werden. Bitte erneut versuchen.",
  },
} as const;

function sanitizeNextPath(value: string | null | undefined, locale: Locale) {
  if (!value) return `/${locale}/teacher/cabinet`;
  if (!value.startsWith("/")) return `/${locale}/teacher/cabinet`;
  return value;
}

export function AuthChangePasswordPageClient({ locale, nextPath }: Props) {
  const router = useRouter();
  const t = copy[locale];
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const safeNextPath = useMemo(() => sanitizeNextPath(nextPath, locale), [locale, nextPath]);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/auth/session", { credentials: "same-origin" });
        const payload = (await response.json()) as SessionResponse;
        if (payload && typeof payload === "object" && "csrfToken" in payload) {
          const token = (payload as { csrfToken?: unknown }).csrfToken;
          if (typeof token === "string" && token) setCsrfToken(token);
        }
        if (response.ok && payload.ok && payload.authenticated) {
          setAuthenticated(true);
          const shouldChange = payload.user.mustChangePassword === true;
          setMustChangePassword(shouldChange);
          if (!shouldChange) {
            router.replace(safeNextPath);
            return;
          }
        } else {
          setAuthenticated(false);
        }
      } catch {
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    })();
  }, [router, safeNextPath]);

  async function submitChange() {
    if (!csrfToken) {
      setError(t.errorFallback);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const payload = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok || !payload.ok) {
        setError(payload.message ?? t.errorFallback);
        return;
      }
      setDone(true);
      setTimeout(() => {
        router.replace(safeNextPath);
      }, 400);
    } catch {
      setError(t.errorFallback);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <SurfaceCard className="p-6">
        <p className="text-sm text-slate-600">{t.loading}</p>
      </SurfaceCard>
    );
  }

  if (!authenticated) {
    return (
      <SurfaceCard className="p-6">
        <p className="text-sm text-slate-700">{t.authRequired}</p>
        <Link
          href={`/${locale}/teacher/cabinet`}
          className="mt-3 inline-flex rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
        >
          {t.backToCabinet}
        </Link>
      </SurfaceCard>
    );
  }

  if (!mustChangePassword) {
    return (
      <SurfaceCard className="p-6">
        <p className="text-sm text-slate-700">{t.done}</p>
      </SurfaceCard>
    );
  }

  return (
    <main className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">{t.title}</h1>
        <p className="mt-2 text-sm text-slate-600">{t.subtitle}</p>
      </section>

      <SurfaceCard className="space-y-3 p-6">
        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700">{t.currentPassword}</span>
          <input
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700">{t.newPassword}</span>
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          />
        </label>
        <button
          type="button"
          onClick={() => void submitChange()}
          disabled={busy || done}
          className="inline-flex rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
        >
          {done ? t.done : busy ? "..." : t.submit}
        </button>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
      </SurfaceCard>
    </main>
  );
}
