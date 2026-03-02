"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { SurfaceCard } from "@/src/components/ui/SurfaceCard";

type Locale = "ru" | "en" | "de";

const copy = {
  ru: {
    title: "Установить новый пароль",
    subtitle: "Введите новый пароль для завершения восстановления.",
    newPassword: "Новый пароль",
    submit: "Сохранить новый пароль",
    done: "Пароль изменен. Войдите снова.",
    invalidToken: "Ссылка недействительна или устарела.",
    back: "В кабинет",
    errorFallback: "Не удалось сбросить пароль. Попробуйте снова.",
  },
  en: {
    title: "Set new password",
    subtitle: "Enter a new password to complete recovery.",
    newPassword: "New password",
    submit: "Save new password",
    done: "Password changed. Please sign in again.",
    invalidToken: "Reset link is invalid or expired.",
    back: "Back to workspace",
    errorFallback: "Failed to reset password. Please try again.",
  },
  de: {
    title: "Neues Passwort setzen",
    subtitle: "Neues Passwort eingeben, um die Wiederherstellung abzuschliessen.",
    newPassword: "Neues Passwort",
    submit: "Neues Passwort speichern",
    done: "Passwort geaendert. Bitte erneut anmelden.",
    invalidToken: "Reset-Link ist ungueltig oder abgelaufen.",
    back: "Zurueck",
    errorFallback: "Passwort konnte nicht zurueckgesetzt werden. Bitte erneut versuchen.",
  },
} as const;

type SessionPayload = { csrfToken?: string };

export function AuthResetPasswordPageClient({
  locale,
  token,
}: {
  locale: Locale;
  token: string | null;
}) {
  const t = copy[locale];
  const router = useRouter();
  const [csrfToken, setCsrfToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/auth/session", { credentials: "same-origin" }).catch(() => null);
      if (!response) return;
      const payload = (await response.json().catch(() => ({}))) as SessionPayload;
      if (typeof payload.csrfToken === "string") setCsrfToken(payload.csrfToken);
    })();
  }, []);

  async function submit() {
    if (!token) {
      setError(t.invalidToken);
      return;
    }
    if (!csrfToken) {
      setError(t.errorFallback);
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({ token, newPassword }),
      });
      const payload = (await response.json()) as { ok?: boolean; code?: string; message?: string };
      if (!response.ok || !payload.ok) {
        if (payload.code === "INVALID_RESET_TOKEN") {
          setError(t.invalidToken);
          return;
        }
        setError(payload.message ?? t.errorFallback);
        return;
      }
      setDone(true);
      setTimeout(() => {
        router.replace(`/${locale}/teacher/cabinet`);
      }, 400);
    } catch {
      setError(t.errorFallback);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">{t.title}</h1>
        <p className="mt-2 text-sm text-slate-600">{t.subtitle}</p>
      </section>
      <SurfaceCard className="space-y-3 p-6">
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
          onClick={() => void submit()}
          disabled={busy || done}
          className="inline-flex rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
        >
          {busy ? "..." : done ? t.done : t.submit}
        </button>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <Link
          href={`/${locale}/teacher/cabinet`}
          className="inline-flex rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
        >
          {t.back}
        </Link>
      </SurfaceCard>
    </main>
  );
}
