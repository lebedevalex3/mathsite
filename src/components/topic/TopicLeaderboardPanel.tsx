"use client";

import { useEffect, useState } from "react";

import { SurfaceCard } from "@/src/components/ui/SurfaceCard";

type Locale = "ru" | "en" | "de";

type LeaderboardEntry = {
  position: number;
  handle: string;
  accuracy: number;
  attempts: number;
  isCurrentUser: boolean;
};

type LeaderboardPayload = {
  ok?: boolean;
  leaderboard?: {
    entries: LeaderboardEntry[];
    cohortSize: number;
    currentUserPosition: number | null;
  };
};

type Props = {
  locale: Locale;
  topicId: string;
};

const copy = {
  ru: {
    title: "Топ по теме",
    subtitle: "Анонимный рейтинг по точности за последние 30 дней.",
    rank: "Место",
    accuracy: "Точность",
    attempts: "Попытки",
    empty: "Пока недостаточно данных для рейтинга.",
    yourPosition: "Ваше место",
    noPosition: "вне когорты",
  },
  en: {
    title: "Topic Top",
    subtitle: "Anonymous ranking by accuracy over the last 30 days.",
    rank: "Rank",
    accuracy: "Accuracy",
    attempts: "Attempts",
    empty: "Not enough data for ranking yet.",
    yourPosition: "Your position",
    noPosition: "outside cohort",
  },
  de: {
    title: "Top im Thema",
    subtitle: "Anonymes Ranking nach Genauigkeit in den letzten 30 Tagen.",
    rank: "Platz",
    accuracy: "Genauigkeit",
    attempts: "Versuche",
    empty: "Noch nicht genug Daten fur das Ranking.",
    yourPosition: "Ihre Position",
    noPosition: "außerhalb der Kohorte",
  },
} as const;

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function TopicLeaderboardPanel({ locale, topicId }: Props) {
  const t = copy[locale];
  const [state, setState] = useState<LeaderboardPayload["leaderboard"] | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(
          `/api/leaderboard?topicId=${encodeURIComponent(topicId)}&limit=5`,
          { credentials: "same-origin" },
        );
        if (!response.ok) return;
        const payload = (await response.json()) as LeaderboardPayload;
        if (!cancelled && payload.ok && payload.leaderboard) {
          setState(payload.leaderboard);
        }
      } catch {
        // keep empty state
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [topicId]);

  return (
    <SurfaceCard className="p-6">
      <h2 className="text-xl font-semibold tracking-tight text-[var(--text-strong)]">{t.title}</h2>
      <p className="mt-1 text-sm text-[var(--text-muted)]">{t.subtitle}</p>

      {state && state.entries.length > 0 ? (
        <>
          <div className="mt-4 divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            {state.entries.map((entry) => (
              <div
                key={entry.handle}
                className={`grid grid-cols-[64px_1fr_120px_100px] items-center gap-3 px-4 py-3 text-sm ${
                  entry.isCurrentUser ? "bg-[var(--primary-soft)]" : ""
                }`}
              >
                <p className="font-semibold text-[var(--text-strong)]">#{entry.position}</p>
                <p className="font-medium text-[var(--text)]">{entry.handle}</p>
                <p className="text-[var(--text)]">{percent(entry.accuracy)}</p>
                <p className="text-[var(--text)]">{entry.attempts}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>
              {t.yourPosition}:{" "}
              {state.currentUserPosition ? `#${state.currentUserPosition}/${state.cohortSize}` : t.noPosition}
            </span>
            <span>
              {t.rank} / {t.accuracy} / {t.attempts}
            </span>
          </div>
        </>
      ) : (
        <p className="mt-4 text-sm text-[var(--text-muted)]">{t.empty}</p>
      )}
    </SurfaceCard>
  );
}
