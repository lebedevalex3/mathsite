"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ButtonLink } from "@/src/components/ui/ButtonLink";
import { TeacherErrorState, type TeacherApiError } from "@/src/components/ui/TeacherErrorState";
import { SurfaceCard } from "@/src/components/ui/SurfaceCard";
import { formatDateTime, formatNumber } from "@/src/lib/i18n/format";

type TemplateSummary = {
  id: string;
  title: string;
  header: { gradeLabel: string; topicLabel: string };
  sections: Array<{
    label: string;
    count: number;
    difficulty: [number, number];
    skillsCount: number;
  }>;
};

type VariantSummary = {
  id: string;
  topicId: string;
  templateId: string;
  title: string;
  seed: string;
  createdAt: string;
  tasksCount: number;
};

type TeacherVariantsPageClientProps = {
  locale: string;
  initialRole: "student" | "teacher" | "admin";
};

export function TeacherVariantsPageClient({
  locale,
  initialRole,
}: TeacherVariantsPageClientProps) {
  const [role, setRole] = useState(initialRole);
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [variants, setVariants] = useState<VariantSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyTemplateId, setBusyTemplateId] = useState<string | null>(null);
  const [clearingVariants, setClearingVariants] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<TeacherApiError | null>(null);

  const isTeacher = role === "teacher" || role === "admin";

  function parseApiError(payload: unknown, fallbackMessage: string): TeacherApiError {
    if (payload && typeof payload === "object") {
      const data = payload as {
        code?: unknown;
        message?: unknown;
        error?: unknown;
        details?: unknown;
      };
      return {
        code: typeof data.code === "string" ? data.code : undefined,
        message:
          typeof data.message === "string"
            ? data.message
            : typeof data.error === "string"
              ? data.error
              : fallbackMessage,
        details: data.details,
      };
    }
    return { message: fallbackMessage };
  }

  async function loadData() {
    if (!isTeacher) return;
    setLoading(true);
    setError(null);
    try {
      const [templatesResponse, variantsResponse] = await Promise.all([
        fetch("/api/teacher/templates?topicId=g5.proporcii", { credentials: "same-origin" }),
        fetch("/api/teacher/variants", { credentials: "same-origin" }),
      ]);

      const templatesPayload = (await templatesResponse.json()) as {
        ok?: boolean;
        error?: string;
        message?: string;
        templates?: TemplateSummary[];
      };
      const variantsPayload = (await variantsResponse.json()) as {
        ok?: boolean;
        code?: string;
        error?: string;
        message?: string;
        details?: unknown;
        variants?: VariantSummary[];
      };

      if (!templatesResponse.ok || !templatesPayload.ok) {
        setError(parseApiError(templatesPayload, "Не удалось загрузить шаблоны."));
        setTemplates([]);
      } else {
        setTemplates(templatesPayload.templates ?? []);
      }

      if (!variantsResponse.ok || !variantsPayload.ok) {
        setError((prev) => prev ?? parseApiError(variantsPayload, "Не удалось загрузить варианты."));
        setVariants([]);
      } else {
        setVariants(variantsPayload.variants ?? []);
      }
    } catch {
      setError({ message: "Ошибка сети при загрузке teacher-инструментов." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTeacher]);

  async function handleBecomeTeacher() {
    setNotice(null);
    setError(null);
    try {
      const response = await fetch("/api/teacher/become", {
        method: "POST",
        credentials: "same-origin",
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        role?: typeof role;
        code?: string;
        error?: string;
        message?: string;
      };
      if (!response.ok || !payload.ok || !payload.role) {
        setError(parseApiError(payload, "Не удалось выдать роль учителя."));
        return;
      }
      setRole(payload.role);
      setNotice("Роль учителя выдана.");
    } catch {
      setError({ message: "Ошибка сети при выдаче роли учителя." });
    }
  }

  async function handleGenerate(templateId: string) {
    setBusyTemplateId(templateId);
    setNotice(null);
    setError(null);
    try {
      const response = await fetch("/api/teacher/variants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ topicId: "g5.proporcii", templateId }),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        variantId?: string;
        code?: string;
        error?: string;
        message?: string;
        details?: unknown;
      };
      if (!response.ok || !payload.ok || !payload.variantId) {
        setError(parseApiError(payload, "Не удалось сгенерировать вариант."));
        return;
      }
      await loadData();
      setNotice("Вариант сгенерирован.");
    } catch {
      setError({ message: "Ошибка сети при генерации варианта." });
    } finally {
      setBusyTemplateId(null);
    }
  }

  async function handleClearVariants() {
    if (variants.length === 0 || clearingVariants) return;
    const confirmed = window.confirm(
      `Удалить все сгенерированные варианты (${variants.length})? Это действие нельзя отменить.`,
    );
    if (!confirmed) return;

    setClearingVariants(true);
    setNotice(null);
    setError(null);
    try {
      const response = await fetch("/api/teacher/variants", {
        method: "DELETE",
        credentials: "same-origin",
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        deletedCount?: number;
        code?: string;
        message?: string;
        error?: string;
        details?: unknown;
      };

      if (!response.ok || !payload.ok) {
        setError(parseApiError(payload, "Не удалось очистить список вариантов."));
        return;
      }

      const deletedCount = typeof payload.deletedCount === "number" ? payload.deletedCount : 0;
      setVariants([]);
      setNotice(
        deletedCount > 0
          ? `Удалено вариантов: ${deletedCount}.`
          : "Список вариантов уже был пуст.",
      );
    } catch {
      setError({ message: "Ошибка сети при очистке списка вариантов." });
    } finally {
      setClearingVariants(false);
    }
  }

  const showInitialLoading = loading && templates.length === 0 && variants.length === 0;

  return (
    <main className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">
          Teacher MVP
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          Шаблоны вариантов
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          Генерация печатных вариантов по теме «Пропорции» из существующего банка задач.
        </p>
      </section>

      {!isTeacher ? (
        <SurfaceCard className="p-6">
          <h2 className="text-lg font-semibold text-slate-950">Доступ только для учителя</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Для MVP можно выдать роль учителя локально кнопкой ниже.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleBecomeTeacher}
              className="inline-flex items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              Стать учителем (dev)
            </button>
            <ButtonLink href={`/${locale}/teachers`} variant="secondary">
              Страница для учителей
            </ButtonLink>
          </div>
          {notice ? <p className="mt-3 text-sm text-slate-700">{notice}</p> : null}
          {error ? <TeacherErrorState error={error} locale={locale} className="mt-4 p-4" /> : null}
        </SurfaceCard>
      ) : (
        <>
          {notice ? (
            <SurfaceCard className="p-4">
              <p className="text-sm text-slate-700">{notice}</p>
            </SurfaceCard>
          ) : null}
          {error ? <TeacherErrorState error={error} locale={locale} /> : null}

          {showInitialLoading ? (
            <>
              <section className="space-y-3">
                <div className="h-8 w-40 animate-pulse rounded bg-slate-200" />
                <div className="space-y-3">
                  {[0, 1].map((index) => (
                    <SurfaceCard key={`tpl-skeleton-${index}`} className="p-4">
                      <div className="space-y-3">
                        <div className="h-5 w-64 animate-pulse rounded bg-slate-200" />
                        <div className="h-4 w-40 animate-pulse rounded bg-slate-100" />
                        <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                        <div className="h-4 w-5/6 animate-pulse rounded bg-slate-100" />
                      </div>
                    </SurfaceCard>
                  ))}
                </div>
              </section>
              <section className="space-y-3">
                <div className="h-8 w-52 animate-pulse rounded bg-slate-200" />
                <SurfaceCard className="p-4">
                  <div className="space-y-3">
                    <div className="h-5 w-72 animate-pulse rounded bg-slate-200" />
                    <div className="h-4 w-48 animate-pulse rounded bg-slate-100" />
                  </div>
                </SurfaceCard>
              </section>
            </>
          ) : null}

          <section className={`space-y-3 ${showInitialLoading ? "hidden" : ""}`}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                Шаблоны
              </h2>
              <button
                type="button"
                onClick={() => void loadData()}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
              >
                {loading ? "Обновление..." : "Обновить"}
              </button>
            </div>
            <div className="space-y-3">
              {templates.length === 0 ? (
                <SurfaceCard className="p-4">
                  <p className="text-sm text-slate-600">
                    Шаблоны недоступны или ещё не загружены.
                  </p>
                </SurfaceCard>
              ) : null}
              {templates.map((template) => (
                <SurfaceCard key={template.id} className="p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-slate-950">{template.title}</h3>
                      <p className="mt-1 text-xs text-slate-500">{template.id}</p>
                      <ul className="mt-3 space-y-1 text-sm text-slate-700">
                        {template.sections.map((section) => (
                          <li key={`${template.id}:${section.label}`}>
                            {section.label}: {section.count} задач, сложность {section.difficulty[0]}-{section.difficulty[1]}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex shrink-0">
                      <button
                        type="button"
                        disabled={busyTemplateId === template.id || loading}
                        onClick={() => void handleGenerate(template.id)}
                        className="inline-flex items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {busyTemplateId === template.id ? "Генерация..." : "Сгенерировать"}
                      </button>
                    </div>
                  </div>
                </SurfaceCard>
              ))}
            </div>
          </section>

          <section className={`space-y-3 ${showInitialLoading ? "hidden" : ""}`}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                Последние варианты
              </h2>
              <div className="flex items-center gap-3">
                {loading ? <p className="text-xs text-slate-500">Загрузка...</p> : null}
                <button
                  type="button"
                  onClick={() => void handleClearVariants()}
                  disabled={variants.length === 0 || clearingVariants || loading}
                  className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {clearingVariants ? "Очистка..." : "Очистить список"}
                </button>
              </div>
            </div>
            {variants.length === 0 ? (
              <SurfaceCard className="p-5">
                <h3 className="text-sm font-semibold text-slate-900">
                  Пока нет сгенерированных вариантов
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Выберите шаблон выше и нажмите «Сгенерировать», чтобы создать первый вариант.
                </p>
              </SurfaceCard>
            ) : (
              <div className="space-y-3">
                {variants.map((variant) => (
                  <SurfaceCard key={variant.id} className="p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold text-slate-950">{variant.title}</h3>
                        <p className="mt-1 text-sm text-slate-600">
                          {formatDateTime(locale, variant.createdAt)} • {formatNumber(locale, variant.tasksCount)} задач
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <ButtonLink href={`/${locale}/teacher/variants/${variant.id}`} variant="secondary">
                          Открыть
                        </ButtonLink>
                        <ButtonLink
                          href={`/${locale}/teacher/variants/${variant.id}/print`}
                          variant="ghost"
                        >
                          Печать
                        </ButtonLink>
                        <Link
                          href={`/api/teacher/variants/${variant.id}/pdf?locale=${encodeURIComponent(locale)}`}
                          className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium text-[var(--primary)] hover:bg-slate-100 hover:text-[var(--primary-hover)]"
                        >
                          PDF
                        </Link>
                        <Link
                          href={`/api/teacher/variants/${variant.id}/answers-pdf?locale=${encodeURIComponent(locale)}`}
                          className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium text-[var(--primary)] hover:bg-slate-100 hover:text-[var(--primary-hover)]"
                        >
                          Ответы PDF
                        </Link>
                      </div>
                    </div>
                  </SurfaceCard>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
