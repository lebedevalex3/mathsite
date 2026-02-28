"use client";

import { useEffect, useMemo, useState } from "react";

import { SurfaceCard } from "@/src/components/ui/SurfaceCard";
import type { MotivationBadgeKind, MotivationModel } from "@/src/lib/motivation/model";

type Locale = "ru" | "en" | "de";

type Props = {
  locale: Locale;
};

type MotivationPayload = {
  ok?: boolean;
  motivation?: MotivationModel;
};

const TOPIC_ID = "g5.proporcii";

const copy = {
  ru: {
    title: "Мотивация и прогресс",
    subtitle: "Личный уровень, бейджи и место в рейтинге обновляются после практики.",
    level: "Уровень",
    xp: "XP",
    rank: "Рейтинг",
    rankFallback: "без данных",
    badge: "Следующий бейдж",
    badgeProgress: "Прогресс",
    attemptsBadge: "Практик: 30 попыток",
    accuracyBadge: "Точность: 80%",
    masteryBadge: "Освоить 3 навыка",
    allDone: "Отличный ритм — продолжай серию!",
  },
  en: {
    title: "Motivation and Progress",
    subtitle: "Your level, badges, and ranking update after each practice session.",
    level: "Level",
    xp: "XP",
    rank: "Ranking",
    rankFallback: "no data",
    badge: "Next badge",
    badgeProgress: "Progress",
    attemptsBadge: "Practitioner: 30 attempts",
    accuracyBadge: "Accuracy: 80%",
    masteryBadge: "Master 3 skills",
    allDone: "Great pace - keep the streak going!",
  },
  de: {
    title: "Motivation und Fortschritt",
    subtitle: "Level, Abzeichen und Ranking werden nach jeder Übung aktualisiert.",
    level: "Level",
    xp: "XP",
    rank: "Ranking",
    rankFallback: "keine Daten",
    badge: "Nächstes Abzeichen",
    badgeProgress: "Fortschritt",
    attemptsBadge: "Übung: 30 Versuche",
    accuracyBadge: "Genauigkeit: 80%",
    masteryBadge: "3 Fähigkeiten meistern",
    allDone: "Starkes Tempo - bleib dran!",
  },
} as const;

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatRank(position: number | null, cohortSize: number, percentile: number | null, fallback: string) {
  if (!position || cohortSize <= 0) return fallback;
  if (percentile === null) return `#${position}/${cohortSize}`;
  return `#${position}/${cohortSize} (${Math.round(percentile)}%)`;
}

export function HomeMotivationPanel({ locale }: Props) {
  const t = copy[locale];
  const [motivation, setMotivation] = useState<MotivationModel | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(
          `/api/motivation?topicId=${encodeURIComponent(TOPIC_ID)}&scope=home`,
          { credentials: "same-origin" },
        );
        if (!response.ok) return;
        const payload = (await response.json()) as MotivationPayload;
        if (!cancelled && payload.ok && payload.motivation) {
          setMotivation(payload.motivation);
        }
      } catch {
        // keep fallback values
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const badgeLabelByKind = useMemo<Record<MotivationBadgeKind, string>>(
    () => ({
      attempts: t.attemptsBadge,
      accuracy: t.accuracyBadge,
      mastery: t.masteryBadge,
      streak: t.masteryBadge,
      done: t.allDone,
    }),
    [t.accuracyBadge, t.allDone, t.attemptsBadge, t.masteryBadge],
  );

  const badgeTitle = motivation ? badgeLabelByKind[motivation.badge.kind] : t.attemptsBadge;
  const badgeProgress = motivation?.badge.progress ?? 0;
  const level = motivation?.level ?? 1;
  const xp = motivation?.xp ?? 0;
  const rankPercentile = motivation?.rankPercentile ?? null;
  const rankPosition = motivation?.rankPosition ?? null;
  const rankCohortSize = motivation?.rankCohortSize ?? 0;

  return (
    <SurfaceCard className="p-6">
      <h2 className="text-xl font-semibold tracking-tight text-slate-950">{t.title}</h2>
      <p className="mt-1 text-sm text-slate-600">{t.subtitle}</p>

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
            {formatRank(rankPosition, rankCohortSize, rankPercentile, t.rankFallback)}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t.badge}</p>
        <p className="mt-1 text-sm font-medium text-slate-900">{badgeTitle}</p>
        <p className="mt-2 text-xs text-slate-500">
          {t.badgeProgress}: {percent(Math.min(1, badgeProgress))}
        </p>
        <div className="mt-2 h-2 rounded-full bg-slate-100">
          <div
            className="h-2 rounded-full bg-blue-600 transition-all"
            style={{ width: `${Math.min(100, Math.round(badgeProgress * 100))}%` }}
          />
        </div>
      </div>
    </SurfaceCard>
  );
}
