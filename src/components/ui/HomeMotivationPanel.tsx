"use client";

import { useEffect, useMemo, useState } from "react";

import { SurfaceCard } from "@/src/components/ui/SurfaceCard";
import type { SkillProgressMap } from "@/src/lib/progress/types";

type Locale = "ru" | "en" | "de";

type Props = {
  locale: Locale;
};

type ComparePayload = {
  ok?: boolean;
  percentile?: number | null;
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

export function HomeMotivationPanel({ locale }: Props) {
  const t = copy[locale];
  const [progressMap, setProgressMap] = useState<SkillProgressMap>({});
  const [percentile, setPercentile] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [progressResponse, compareResponse] = await Promise.all([
          fetch(`/api/progress?topicId=${encodeURIComponent(TOPIC_ID)}`, {
            credentials: "same-origin",
          }),
          fetch(`/api/compare?topicId=${encodeURIComponent(TOPIC_ID)}`, {
            credentials: "same-origin",
          }),
        ]);

        if (progressResponse.ok) {
          const progressPayload = (await progressResponse.json()) as {
            ok?: boolean;
            progress?: SkillProgressMap;
          };
          if (!cancelled && progressPayload.ok && progressPayload.progress) {
            setProgressMap(progressPayload.progress);
          }
        }

        if (compareResponse.ok) {
          const comparePayload = (await compareResponse.json()) as ComparePayload;
          if (!cancelled) {
            setPercentile(
              typeof comparePayload.percentile === "number"
                ? comparePayload.percentile
                : null,
            );
          }
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

  const summary = useMemo(() => {
    const entries = Object.values(progressMap);
    const totalAttempts = entries.reduce((sum, entry) => sum + entry.total, 0);
    const totalCorrect = entries.reduce((sum, entry) => sum + entry.correct, 0);
    const mastered = entries.filter((entry) => entry.status === "mastered").length;
    const accuracy = totalAttempts > 0 ? totalCorrect / totalAttempts : 0;

    const level = Math.max(1, Math.floor(totalAttempts / 20) + 1);
    const xp = totalCorrect * 5 + mastered * 50;

    return {
      totalAttempts,
      totalCorrect,
      mastered,
      accuracy,
      level,
      xp,
    };
  }, [progressMap]);

  const badge = useMemo(() => {
    if (summary.totalAttempts < 30) {
      return {
        title: t.attemptsBadge,
        progress: summary.totalAttempts / 30,
      };
    }
    if (summary.accuracy < 0.8) {
      return {
        title: t.accuracyBadge,
        progress: summary.accuracy / 0.8,
      };
    }
    if (summary.mastered < 3) {
      return {
        title: t.masteryBadge,
        progress: summary.mastered / 3,
      };
    }
    return {
      title: t.allDone,
      progress: 1,
    };
  }, [summary.accuracy, summary.mastered, summary.totalAttempts, t.accuracyBadge, t.allDone, t.attemptsBadge, t.masteryBadge]);

  return (
    <SurfaceCard className="p-6">
      <h2 className="text-xl font-semibold tracking-tight text-slate-950">{t.title}</h2>
      <p className="mt-1 text-sm text-slate-600">{t.subtitle}</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t.level}</p>
          <p className="mt-1 text-sm font-medium text-slate-900">{summary.level}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t.xp}</p>
          <p className="mt-1 text-sm font-medium text-slate-900">{summary.xp}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t.rank}</p>
          <p className="mt-1 text-sm font-medium text-slate-900">
            {percentile === null ? t.rankFallback : `${percentile}%`}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t.badge}</p>
        <p className="mt-1 text-sm font-medium text-slate-900">{badge.title}</p>
        <p className="mt-2 text-xs text-slate-500">
          {t.badgeProgress}: {percent(Math.min(1, badge.progress))}
        </p>
        <div className="mt-2 h-2 rounded-full bg-slate-100">
          <div
            className="h-2 rounded-full bg-blue-600 transition-all"
            style={{ width: `${Math.min(100, Math.round(badge.progress * 100))}%` }}
          />
        </div>
      </div>
    </SurfaceCard>
  );
}
