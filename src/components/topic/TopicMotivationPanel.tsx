"use client";

import { useEffect, useMemo, useState } from "react";

import { ButtonLink } from "@/src/components/ui/ButtonLink";
import { SurfaceCard } from "@/src/components/ui/SurfaceCard";
import type { MotivationBadgeKind, MotivationModel } from "@/src/lib/motivation/model";

type Locale = "ru" | "en" | "de";

type Props = {
  locale: Locale;
  topicId: string;
  progressHref: string;
};

type MotivationPayload = {
  ok?: boolean;
  motivation?: MotivationModel;
};

const copy = {
  ru: {
    title: "Мотивация по теме",
    subtitle: "Прогресс считается по попыткам и точности в выбранной теме.",
    level: "Уровень",
    xp: "XP",
    rank: "Рейтинг",
    rankFallback: "без данных",
    badgeTitle: "Бейдж темы",
    badgeProgress: "Прогресс",
    accuracyBadge: "Точность 80% на 20 попытках",
    masteryBadge: "Освоить 3 навыка темы",
    streakBadge: "Серия: 3 тренировки подряд",
    allDone: "Сильный темп! Поддерживай серию.",
    openProgress: "Открыть прогресс",
  },
  en: {
    title: "Topic Motivation",
    subtitle: "Progress is based on attempts and accuracy in this topic.",
    level: "Level",
    xp: "XP",
    rank: "Ranking",
    rankFallback: "no data",
    badgeTitle: "Topic badge",
    badgeProgress: "Progress",
    accuracyBadge: "80% accuracy on 20 attempts",
    masteryBadge: "Master 3 topic skills",
    streakBadge: "Streak: 3 training sessions",
    allDone: "Great pace! Keep the streak going.",
    openProgress: "Open progress",
  },
  de: {
    title: "Themenmotivation",
    subtitle: "Der Fortschritt basiert auf Versuchen und Genauigkeit im Thema.",
    level: "Level",
    xp: "XP",
    rank: "Ranking",
    rankFallback: "keine Daten",
    badgeTitle: "Themenabzeichen",
    badgeProgress: "Fortschritt",
    accuracyBadge: "80% Genauigkeit bei 20 Versuchen",
    masteryBadge: "3 Themenfähigkeiten meistern",
    streakBadge: "Serie: 3 Trainings",
    allDone: "Starkes Tempo! Halte die Serie.",
    openProgress: "Fortschritt öffnen",
  },
} as const;

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function TopicMotivationPanel({ locale, topicId, progressHref }: Props) {
  const t = copy[locale];
  const [motivation, setMotivation] = useState<MotivationModel | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(
          `/api/motivation?topicId=${encodeURIComponent(topicId)}&scope=topic`,
          { credentials: "same-origin" },
        );
        if (!response.ok) return;
        const payload = (await response.json()) as MotivationPayload;
        if (!cancelled && payload.ok && payload.motivation) {
          setMotivation(payload.motivation);
        }
      } catch {
        // fallback mode
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [topicId]);

  const badgeLabelByKind = useMemo<Record<MotivationBadgeKind, string>>(
    () => ({
      attempts: t.accuracyBadge,
      accuracy: t.accuracyBadge,
      mastery: t.masteryBadge,
      streak: t.streakBadge,
      done: t.allDone,
    }),
    [t.accuracyBadge, t.allDone, t.masteryBadge, t.streakBadge],
  );

  const badgeTitle = motivation ? badgeLabelByKind[motivation.badge.kind] : t.accuracyBadge;
  const badgeProgress = motivation?.badge.progress ?? 0;
  const level = motivation?.level ?? 1;
  const xp = motivation?.xp ?? 0;
  const rankPercentile = motivation?.rankPercentile ?? null;

  return (
    <SurfaceCard className="p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">{t.title}</h2>
          <p className="mt-1 text-sm text-slate-600">{t.subtitle}</p>
        </div>
        <ButtonLink href={progressHref} variant="secondary">
          {t.openProgress}
        </ButtonLink>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t.level}</p>
          <p className="mt-1 text-sm font-medium text-slate-900">{level}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t.xp}</p>
          <p className="mt-1 text-sm font-medium text-slate-900">{xp}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t.rank}</p>
          <p className="mt-1 text-sm font-medium text-slate-900">
            {rankPercentile === null ? t.rankFallback : `${rankPercentile}%`}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t.badgeTitle}</p>
        <p className="mt-1 text-sm font-medium text-slate-900">{badgeTitle}</p>
        <p className="mt-2 text-xs text-slate-500">
          {t.badgeProgress}: {percent(Math.min(1, badgeProgress))}
        </p>
        <div className="mt-2 h-2 rounded-full bg-slate-100">
          <div
            className="h-2 rounded-full bg-emerald-600 transition-all"
            style={{ width: `${Math.min(100, Math.round(badgeProgress * 100))}%` }}
          />
        </div>
      </div>
    </SurfaceCard>
  );
}
