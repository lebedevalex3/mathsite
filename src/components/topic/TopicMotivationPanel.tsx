"use client";

import { useEffect, useMemo, useState } from "react";

import { ButtonLink } from "@/src/components/ui/ButtonLink";
import { SurfaceCard } from "@/src/components/ui/SurfaceCard";
import type { SkillProgressMap } from "@/src/lib/progress/types";

type Locale = "ru" | "en" | "de";

type Props = {
  locale: Locale;
  topicId: string;
  progressHref: string;
};

type ComparePayload = {
  ok?: boolean;
  percentile?: number | null;
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
  const [progressMap, setProgressMap] = useState<SkillProgressMap>({});
  const [percentile, setPercentile] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [progressResponse, compareResponse] = await Promise.all([
          fetch(`/api/progress?topicId=${encodeURIComponent(topicId)}`, {
            credentials: "same-origin",
          }),
          fetch(`/api/compare?topicId=${encodeURIComponent(topicId)}`, {
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
              typeof comparePayload.percentile === "number" ? comparePayload.percentile : null,
            );
          }
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

  const summary = useMemo(() => {
    const entries = Object.values(progressMap);
    const totalAttempts = entries.reduce((sum, entry) => sum + entry.total, 0);
    const totalCorrect = entries.reduce((sum, entry) => sum + entry.correct, 0);
    const mastered = entries.filter((entry) => entry.status === "mastered").length;
    const accuracy = totalAttempts > 0 ? totalCorrect / totalAttempts : 0;
    const level = Math.max(1, Math.floor(totalAttempts / 15) + 1);
    const xp = totalCorrect * 4 + mastered * 40;

    return {
      totalAttempts,
      mastered,
      accuracy,
      level,
      xp,
    };
  }, [progressMap]);

  const badge = useMemo(() => {
    if (summary.totalAttempts < 20) {
      return {
        title: t.accuracyBadge,
        progress: summary.totalAttempts / 20,
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
    if (summary.totalAttempts < 30) {
      return {
        title: t.streakBadge,
        progress: summary.totalAttempts / 30,
      };
    }
    return {
      title: t.allDone,
      progress: 1,
    };
  }, [
    summary.accuracy,
    summary.mastered,
    summary.totalAttempts,
    t.accuracyBadge,
    t.allDone,
    t.masteryBadge,
    t.streakBadge,
  ]);

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
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t.badgeTitle}</p>
        <p className="mt-1 text-sm font-medium text-slate-900">{badge.title}</p>
        <p className="mt-2 text-xs text-slate-500">
          {t.badgeProgress}: {percent(Math.min(1, badge.progress))}
        </p>
        <div className="mt-2 h-2 rounded-full bg-slate-100">
          <div
            className="h-2 rounded-full bg-emerald-600 transition-all"
            style={{ width: `${Math.min(100, Math.round(badge.progress * 100))}%` }}
          />
        </div>
      </div>
    </SurfaceCard>
  );
}
