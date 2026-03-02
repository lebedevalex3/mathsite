"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { SurfaceCard } from "@/src/components/ui/SurfaceCard";

type Locale = "ru" | "en" | "de";

const copy = {
  ru: {
    title: "Восстановление пароля",
    subtitle: "Введите email, и мы отправим ссылку для сброса пароля.",
    email: "Email",
    submit: "Отправить ссылку",
    done: "Если аккаунт существует, инструкция отправлена.",
    back: "Войти в кабинет",
    errorFallback: "Не удалось отправить запрос. Попробуйте снова.",
    devLinkLabel: "Dev-ссылка для сброса",
  },
  en: {
    title: "Forgot password",
    subtitle: "Enter your email and we will send a reset link.",
    email: "Email",
    submit: "Send reset link",
    done: "If account exists, instructions have been sent.",
    back: "Back to sign in",
    errorFallback: "Failed to submit request. Please try again.",
    devLinkLabel: "Dev reset link",
  },
  de: {
    title: "Passwort vergessen",
    subtitle: "E-Mail eingeben, wir senden einen Link zum Zuruecksetzen.",
    email: "E-Mail",
    submit: "Link senden",
    done: "Falls ein Konto existiert, wurde eine Anleitung gesendet.",
    back: "Zur Anmeldung",
    errorFallback: "Anfrage konnte nicht gesendet werden. Bitte erneut versuchen.",
    devLinkLabel: "Dev-Reset-Link",
  },
} as const;

type SessionPayload = { csrfToken?: string };

export function AuthForgotPasswordPageClient({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const [email, setEmail] = useState("");
  const [csrfToken, setCsrfToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/auth/session", { credentials: "same-origin" }).catch(() => null);
      if (!response) return;
      const payload = (await response.json().catch(() => ({}))) as SessionPayload;
      if (typeof payload.csrfToken === "string") setCsrfToken(payload.csrfToken);
    })();
  }, []);

  async function submit() {
    if (!csrfToken) {
      setError(t.errorFallback);
      return;
    }

    setBusy(true);
    setError(null);
    setResetUrl(null);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({ email, locale }),
      });
      const payload = (await response.json()) as { ok?: boolean; message?: string; resetUrl?: string };
      if (!response.ok || !payload.ok) {
        setError(payload.message ?? t.errorFallback);
        return;
      }
      setDone(true);
      setResetUrl(typeof payload.resetUrl === "string" ? payload.resetUrl : null);
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
          <span className="text-sm font-medium text-slate-700">{t.email}</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          />
        </label>
        <button
          type="button"
          onClick={() => void submit()}
          disabled={busy}
          className="inline-flex rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
        >
          {busy ? "..." : t.submit}
        </button>
        {done ? <p className="text-sm text-emerald-700">{t.done}</p> : null}
        {resetUrl ? (
          <p className="text-sm text-amber-800">
            {t.devLinkLabel}:{" "}
            <a className="underline" href={resetUrl}>
              {resetUrl}
            </a>
          </p>
        ) : null}
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
