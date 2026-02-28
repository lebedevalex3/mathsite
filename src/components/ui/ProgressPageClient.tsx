"use client";

import { useEffect, useMemo, useState } from "react";

import { ButtonLink } from "@/src/components/ui/ButtonLink";
import { SurfaceCard } from "@/src/components/ui/SurfaceCard";
import { formatNumber, formatPercent } from "@/src/lib/i18n/format";
import type { SkillProgressMap } from "@/src/lib/progress/types";

type SubtopicItem = {
  id: string;
  slug: string;
  title: string;
};

type SkillItem = {
  id: string;
  title: string;
  subtopicId: string;
  skillSlug: string;
};

type ProgressPageClientProps = {
  locale: "ru" | "en" | "de";
  topicId: string;
  subtopics: SubtopicItem[];
  skills: SkillItem[];
};

type LoadState =
  | { status: "loading"; progress: SkillProgressMap }
  | { status: "ready"; progress: SkillProgressMap }
  | { status: "error"; progress: SkillProgressMap };

type CompareData = {
  currentUser: {
    total: number;
    correct: number;
    accuracy: number;
  };
  platform: {
    avgAccuracy: number | null;
    medianTotal: number | null;
    usersCount: number;
    cohortMinAttempts: number;
    windowDays: number;
  };
  percentile: number | null;
};

type CompareState =
  | { status: "loading"; data: CompareData | null }
  | { status: "ready"; data: CompareData | null }
  | { status: "error"; data: CompareData | null };

const copy = {
  ru: {
    title: "Мой прогресс",
    subtitle: "Следите за прогрессом по навыкам и возвращайтесь к слабым местам.",
    summaryTitle: "5 класс → Пропорции",
    summaryEmpty: "Пока нет попыток. Начните тренировку, чтобы увидеть прогресс.",
    summaryStats: "Точность",
    summaryAttempts: "Попыток",
    subtopicsTitle: "По подтемам",
    weakSkillsTitle: "Слабые навыки",
    compareTitle: "Сравнение с другими",
    comparePercentile: "Ваш перцентиль",
    compareAvgAccuracy: "Средняя точность",
    compareMedianAttempts: "Медиана попыток",
    compareNeedMore:
      "Нужно 10 попыток по теме, чтобы показать сравнение с пользователями за последние 30 дней.",
    compareNoCohort:
      "Пока недостаточно данных по платформе за последние 30 дней для сравнения.",
    compareApiError: "Сравнение временно недоступно.",
    trainWeakSkill: "Тренировать слабый навык",
    openWeakSubtopic: "Открыть подтему",
    weakSkillsEmpty: "Недостаточно данных. Появится после 3+ попыток по навыку.",
    noAttemptsTitle: "Пока нет прогресса",
    noAttemptsBody:
      "Решите несколько задач в тренажёре, и здесь появятся проценты по подтемам и слабые навыки.",
    startTraining: "Начать тренировку",
    openTopic: "Открыть тему",
    read: "Читать",
    train: "Тренировать",
    mastered: "Освоено",
    noAttemptsShort: "Нет попыток",
    apiError: "Не удалось загрузить прогресс. Показываем пустое состояние.",
  },
  en: {
    title: "My Progress",
    subtitle: "Track your skill progress and return to weak areas.",
    summaryTitle: "Grade 5 → Proportions",
    summaryEmpty: "No attempts yet. Start practicing to see progress.",
    summaryStats: "Accuracy",
    summaryAttempts: "Attempts",
    subtopicsTitle: "By subtopics",
    weakSkillsTitle: "Weak skills",
    compareTitle: "Compare with others",
    comparePercentile: "Your percentile",
    compareAvgAccuracy: "Average accuracy",
    compareMedianAttempts: "Median attempts",
    compareNeedMore:
      "You need 10 attempts in this topic to see comparison with users from the last 30 days.",
    compareNoCohort:
      "Not enough platform data from the last 30 days to show comparison yet.",
    compareApiError: "Comparison is temporarily unavailable.",
    trainWeakSkill: "Train weak skill",
    openWeakSubtopic: "Open subtopic",
    weakSkillsEmpty: "Not enough data yet. Appears after 3+ attempts per skill.",
    noAttemptsTitle: "No progress yet",
    noAttemptsBody: "Solve a few tasks in the trainer to see subtopic percentages and weak skills.",
    startTraining: "Start training",
    openTopic: "Open topic",
    read: "Read",
    train: "Train",
    mastered: "Mastered",
    noAttemptsShort: "No attempts",
    apiError: "Failed to load progress. Showing empty state.",
  },
  de: {
    title: "Mein Fortschritt",
    subtitle: "Fortschritt nach Mikro-Fähigkeiten verfolgen und Schwächen gezielt üben.",
    summaryTitle: "Klasse 5 → Proportionen",
    summaryEmpty: "Noch keine Versuche. Starte das Training, um Fortschritt zu sehen.",
    summaryStats: "Genauigkeit",
    summaryAttempts: "Versuche",
    subtopicsTitle: "Nach Unterthemen",
    weakSkillsTitle: "Schwache Fähigkeiten",
    compareTitle: "Vergleich mit anderen",
    comparePercentile: "Ihr Perzentil",
    compareAvgAccuracy: "Durchschnittliche Genauigkeit",
    compareMedianAttempts: "Median Versuche",
    compareNeedMore:
      "Sie benötigen 10 Versuche in diesem Thema für einen Vergleich mit Nutzern der letzten 30 Tage.",
    compareNoCohort:
      "Noch nicht genug Plattformdaten der letzten 30 Tage für einen Vergleich.",
    compareApiError: "Vergleich ist vorübergehend nicht verfügbar.",
    trainWeakSkill: "Schwache Fähigkeit trainieren",
    openWeakSubtopic: "Unterthema öffnen",
    weakSkillsEmpty: "Noch nicht genug Daten. Erscheint nach 3+ Versuchen pro Fähigkeit.",
    noAttemptsTitle: "Noch kein Fortschritt",
    noAttemptsBody: "Löse ein paar Aufgaben im Trainer, dann erscheinen Prozente und Schwächen.",
    startTraining: "Training starten",
    openTopic: "Thema öffnen",
    read: "Lesen",
    train: "Trainieren",
    mastered: "Beherrscht",
    noAttemptsShort: "Keine Versuche",
    apiError: "Fortschritt konnte nicht geladen werden. Leerer Zustand wird angezeigt.",
  },
} as const;

function buildSkillReadHref(locale: string, skillSlug: string) {
  return `/${locale}/topics/proportion/skills/${skillSlug}`;
}

function buildSkillTrainHref(locale: string, skillId: string) {
  return `/${locale}/topics/proportion/train?skill=${encodeURIComponent(skillId)}`;
}

function buildSubtopicHref(locale: string, slug: string) {
  return `/${locale}/topics/proportion/${slug}`;
}

export function ProgressPageClient({
  locale,
  topicId,
  subtopics,
  skills,
}: ProgressPageClientProps) {
  const t = copy[locale];
  const percent = (value: number) => formatPercent(locale, value, { valueKind: "ratio" });
  const integer = (value: number | null | undefined) =>
    formatNumber(locale, value, { maximumFractionDigits: 0 });

  const [state, setState] = useState<LoadState>({ status: "loading", progress: {} });
  const [compareState, setCompareState] = useState<CompareState>({
    status: "loading",
    data: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(`/api/progress?topicId=${encodeURIComponent(topicId)}`, {
          credentials: "same-origin",
        });
        if (!response.ok) {
          if (!cancelled) setState({ status: "error", progress: {} });
          return;
        }

        const payload = (await response.json()) as {
          ok?: boolean;
          progress?: SkillProgressMap;
        };

        if (!cancelled) {
          setState({
            status: payload.ok ? "ready" : "error",
            progress: payload.ok && payload.progress ? payload.progress : {},
          });
        }
      } catch {
        if (!cancelled) setState({ status: "error", progress: {} });
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [topicId]);

  useEffect(() => {
    let cancelled = false;

    async function loadCompare() {
      try {
        const response = await fetch(`/api/compare?topicId=${encodeURIComponent(topicId)}`, {
          credentials: "same-origin",
        });
        if (!response.ok) {
          if (!cancelled) setCompareState({ status: "error", data: null });
          return;
        }

        const payload = (await response.json()) as {
          ok?: boolean;
          currentUser?: CompareData["currentUser"];
          platform?: CompareData["platform"];
          percentile?: number | null;
        };

        if (!cancelled) {
          if (payload.ok && payload.currentUser && payload.platform) {
            setCompareState({
              status: "ready",
              data: {
                currentUser: payload.currentUser,
                platform: payload.platform,
                percentile: payload.percentile ?? null,
              },
            });
          } else {
            setCompareState({ status: "error", data: null });
          }
        }
      } catch {
        if (!cancelled) setCompareState({ status: "error", data: null });
      }
    }

    void loadCompare();
    return () => {
      cancelled = true;
    };
  }, [topicId]);

  const derived = useMemo(() => {
    const progress = state.progress;

    const subtopicRows = subtopics.map((subtopic) => {
      const subtopicSkills = skills.filter((skill) => skill.subtopicId === subtopic.id);

      let attempts = 0;
      let correct = 0;
      for (const skill of subtopicSkills) {
        const item = progress[skill.id];
        if (!item) continue;
        attempts += item.total;
        correct += item.correct;
      }

      return {
        ...subtopic,
        attempts,
        correct,
        accuracy: attempts > 0 ? correct / attempts : 0,
      };
    });

    const totals = subtopicRows.reduce(
      (acc, row) => ({
        totalAttempts: acc.totalAttempts + row.attempts,
        totalCorrect: acc.totalCorrect + row.correct,
      }),
      { totalAttempts: 0, totalCorrect: 0 },
    );

    const weakestSkills = skills
      .map((skill) => ({
        skill,
        progress: progress[skill.id],
      }))
      .filter((entry) => entry.progress && entry.progress.total >= 3)
      .sort((a, b) => {
        if (!a.progress || !b.progress) return 0;
        if (a.progress.accuracy !== b.progress.accuracy) {
          return a.progress.accuracy - b.progress.accuracy;
        }
        return b.progress.total - a.progress.total;
      })
      .slice(0, 3);

    const weakestSkill = weakestSkills[0] ?? null;
    const weakestSubtopic =
      subtopicRows
        .filter((row) => row.attempts > 0)
        .sort((a, b) => {
          if (a.accuracy !== b.accuracy) return a.accuracy - b.accuracy;
          return b.attempts - a.attempts;
        })[0] ?? null;

    return {
      totalAttempts: totals.totalAttempts,
      totalCorrect: totals.totalCorrect,
      overallAccuracy:
        totals.totalAttempts > 0 ? totals.totalCorrect / totals.totalAttempts : 0,
      subtopicRows,
      weakestSkills,
      weakestSkill,
      weakestSubtopic,
      hasAnyProgress: totals.totalAttempts > 0,
    };
  }, [skills, state.progress, subtopics]);

  if (!derived.hasAnyProgress) {
    return (
      <main className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">MVP • Progress</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{t.title}</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">{t.subtitle}</p>
        </section>

        <SurfaceCard className="p-6">
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">{t.noAttemptsTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{t.noAttemptsBody}</p>
          {state.status === "error" ? (
            <p className="mt-2 text-sm text-amber-700">{t.apiError}</p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <ButtonLink href={`/${locale}/topics/proportion/trainer`} variant="primary">
              {t.startTraining}
            </ButtonLink>
            <ButtonLink href={`/${locale}/topics/proportion`} variant="secondary">
              {t.openTopic}
            </ButtonLink>
          </div>
        </SurfaceCard>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">MVP • Progress</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{t.title}</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">{t.subtitle}</p>
      </section>

      <SurfaceCard className="p-6">
        <h2 className="text-xl font-semibold tracking-tight text-slate-950">{t.summaryTitle}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t.summaryStats}
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-950">
              {percent(derived.overallAccuracy)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t.summaryAttempts}
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-950">{integer(derived.totalAttempts)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Верно</p>
            <p className="mt-1 text-2xl font-semibold text-slate-950">{integer(derived.totalCorrect)}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {derived.weakestSkill ? (
            <ButtonLink
              href={buildSkillTrainHref(locale, derived.weakestSkill.skill.id)}
              variant="primary"
            >
              {t.trainWeakSkill}
            </ButtonLink>
          ) : null}
          {derived.weakestSubtopic ? (
            <ButtonLink
              href={buildSubtopicHref(locale, derived.weakestSubtopic.slug)}
              variant="secondary"
            >
              {t.openWeakSubtopic}
            </ButtonLink>
          ) : null}
        </div>
      </SurfaceCard>

      <SurfaceCard className="p-6">
        <h2 className="text-xl font-semibold tracking-tight text-slate-950">{t.compareTitle}</h2>
        {compareState.status === "error" ? (
          <p className="mt-2 text-sm text-slate-600">{t.compareApiError}</p>
        ) : compareState.data && compareState.data.currentUser.total < 10 ? (
          <p className="mt-2 text-sm text-slate-600">{t.compareNeedMore}</p>
        ) : compareState.data && compareState.data.platform.usersCount === 0 ? (
          <p className="mt-2 text-sm text-slate-600">{t.compareNoCohort}</p>
        ) : compareState.data ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t.comparePercentile}
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">
              {compareState.data.percentile !== null
                  ? formatPercent(locale, compareState.data.percentile, {
                      valueKind: "percent",
                      maximumFractionDigits: 0,
                    })
                  : "—"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t.compareAvgAccuracy}
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">
                {compareState.data.platform.avgAccuracy !== null
                  ? percent(compareState.data.platform.avgAccuracy)
                  : "—"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t.compareMedianAttempts}
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">
                {compareState.data.platform.medianTotal !== null
                  ? integer(compareState.data.platform.medianTotal)
                  : "—"}
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-600">…</p>
        )}
      </SurfaceCard>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{t.subtopicsTitle}</h2>
        <div className="space-y-3">
          {derived.subtopicRows.map((row) => (
            <SurfaceCard key={row.id} className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-950">{row.title}</p>
                  <p className="mt-1 text-xs text-slate-600">
                    {row.attempts > 0
                      ? `${percent(row.accuracy)} • ${integer(row.correct)}/${integer(row.attempts)}`
                      : t.noAttemptsShort}
                  </p>
                </div>
                <div className="flex w-full max-w-xs items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-[var(--primary)] transition-all"
                      style={{ width: `${Math.round(row.accuracy * 100)}%` }}
                    />
                  </div>
                  <span className="w-14 text-right text-xs font-medium text-slate-700">
                    {percent(row.accuracy)}
                  </span>
                </div>
                <ButtonLink href={buildSubtopicHref(locale, row.slug)} variant="ghost">
                  {t.openWeakSubtopic}
                </ButtonLink>
              </div>
            </SurfaceCard>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{t.weakSkillsTitle}</h2>
        {derived.weakestSkills.length === 0 ? (
          <SurfaceCard className="p-4">
            <p className="text-sm text-slate-600">{t.weakSkillsEmpty}</p>
          </SurfaceCard>
        ) : (
          <div className="space-y-3">
            {derived.weakestSkills.map(({ skill, progress }) => (
              <SurfaceCard key={skill.id} className="p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-950">{skill.title}</h3>
                      {progress?.status === "mastered" ? (
                        <span className="inline-flex items-center rounded-md border border-[var(--success)]/30 bg-[var(--success-soft)] px-2 py-0.5 text-xs font-medium text-[var(--success)]">
                          {t.mastered}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      {progress
                        ? `${percent(progress.accuracy)} (${integer(progress.correct)}/${integer(progress.total)})`
                        : "—"}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <ButtonLink href={buildSkillReadHref(locale, skill.skillSlug)} variant="secondary">
                      {t.read}
                    </ButtonLink>
                    <ButtonLink href={buildSkillTrainHref(locale, skill.id)} variant="ghost">
                      {t.train}
                    </ButtonLink>
                  </div>
                </div>
              </SurfaceCard>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
