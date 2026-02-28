"use client";

import { useEffect, useMemo, useState } from "react";

import { ButtonLink } from "@/src/components/ui/ButtonLink";
import { SurfaceCard } from "@/src/components/ui/SurfaceCard";
import type { SkillProgressEntry, SkillProgressMap } from "@/src/lib/progress/types";

type Locale = "ru" | "en" | "de";

type SkillItem = {
  id: string;
  title: string;
  summary: string;
  trainHref?: string;
};

type SkillLevel = {
  id: string;
  title: string;
  hint?: string;
  skills: SkillItem[];
};

type TopicSkillMapProps = {
  locale: Locale;
  topicId: string;
  levels: SkillLevel[];
};

type UiStatus = "not_started" | "in_progress" | "mastered" | "soon";

const copy = {
  ru: {
    title: "Карта навыков",
    subtitle: "Тренируй навыки по шагам и закрывай слабые места.",
    continueTitle: "Продолжить обучение",
    continueSubtitle: "Вернись к следующему шагу или закрепи слабые навыки.",
    continueSkill: "Продолжить навык",
    repeatWeak: "Повторить слабые навыки",
    recommendation: "Рекомендованный следующий навык",
    recommendationReason: {
      not_started: "Навык ещё не начат.",
      in_progress: "Навык в работе, стоит закрепить результат.",
    },
    train: "Тренировать",
    trainRecommended: "Начать этот навык",
    noTrainer: "Скоро",
    status: {
      not_started: "Не начат",
      in_progress: "В работе",
      mastered: "Освоен",
      soon: "Скоро",
    },
    progressSummary: "Освоено навыков",
  },
  en: {
    title: "Skill Map",
    subtitle: "Train step by step and close weak spots.",
    continueTitle: "Continue learning",
    continueSubtitle: "Return to your next step or reinforce weak skills.",
    continueSkill: "Continue skill",
    repeatWeak: "Repeat weak skills",
    recommendation: "Recommended next skill",
    recommendationReason: {
      not_started: "This skill has not been started yet.",
      in_progress: "This skill is in progress and needs reinforcement.",
    },
    train: "Train",
    trainRecommended: "Start this skill",
    noTrainer: "Soon",
    status: {
      not_started: "Not started",
      in_progress: "In progress",
      mastered: "Mastered",
      soon: "Soon",
    },
    progressSummary: "Skills mastered",
  },
  de: {
    title: "Fähigkeiten-Karte",
    subtitle: "Schrittweise trainieren und Schwächen schließen.",
    continueTitle: "Lernen fortsetzen",
    continueSubtitle: "Gehe zum nächsten Schritt zurück oder festige schwache Fähigkeiten.",
    continueSkill: "Fähigkeit fortsetzen",
    repeatWeak: "Schwache Fähigkeiten wiederholen",
    recommendation: "Empfohlene nächste Fähigkeit",
    recommendationReason: {
      not_started: "Diese Fähigkeit wurde noch nicht gestartet.",
      in_progress: "Diese Fähigkeit ist in Bearbeitung und sollte gefestigt werden.",
    },
    train: "Trainieren",
    trainRecommended: "Diese Fähigkeit starten",
    noTrainer: "Bald",
    status: {
      not_started: "Nicht gestartet",
      in_progress: "In Arbeit",
      mastered: "Beherrscht",
      soon: "Bald",
    },
    progressSummary: "Beherrschte Fähigkeiten",
  },
} as const;

function toUiStatus(skill: SkillItem, progress: SkillProgressEntry | undefined): UiStatus {
  if (!skill.trainHref) return "soon";
  if (!progress) return "not_started";
  if (progress.status === "mastered") return "mastered";
  if (progress.status === "in_progress") return "in_progress";
  return "not_started";
}

function statusPillClass(status: UiStatus) {
  if (status === "mastered") {
    return "border-[var(--success)]/30 bg-[var(--success-soft)] text-[var(--success)]";
  }
  if (status === "in_progress") {
    return "border-[var(--border)] bg-[var(--info)] text-[var(--primary)]";
  }
  if (status === "soon") {
    return "border-slate-300 bg-slate-100 text-slate-500";
  }
  return "border-slate-300 bg-white text-slate-600";
}

export function TopicSkillMap({ locale, topicId, levels }: TopicSkillMapProps) {
  const t = copy[locale];
  const [progressMap, setProgressMap] = useState<SkillProgressMap>({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(`/api/progress?topicId=${encodeURIComponent(topicId)}`, {
          credentials: "same-origin",
        });
        if (!response.ok) return;
        const payload = (await response.json()) as {
          ok?: boolean;
          progress?: SkillProgressMap;
        };
        if (!cancelled && payload.ok && payload.progress) {
          setProgressMap(payload.progress);
        }
      } catch {
        // Render without progress badges if API is unavailable.
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [topicId]);

  const allSkills = useMemo(() => levels.flatMap((level) => level.skills), [levels]);
  const readySkills = useMemo(() => allSkills.filter((skill) => Boolean(skill.trainHref)), [allSkills]);

  const masteredCount = readySkills.filter((skill) => {
    const progress = progressMap[skill.id];
    return toUiStatus(skill, progress) === "mastered";
  }).length;

  const recommended = useMemo(() => {
    const notStarted = readySkills.find((skill) => toUiStatus(skill, progressMap[skill.id]) === "not_started");
    if (notStarted) {
      return { skill: notStarted, reason: t.recommendationReason.not_started as string };
    }

    const inProgress = readySkills
      .map((skill) => ({
        skill,
        progress: progressMap[skill.id],
      }))
      .filter((entry) => toUiStatus(entry.skill, entry.progress) === "in_progress")
      .sort((a, b) => (a.progress?.accuracy ?? 0) - (b.progress?.accuracy ?? 0))[0];

    if (inProgress) {
      return { skill: inProgress.skill, reason: t.recommendationReason.in_progress as string };
    }

    return null;
  }, [progressMap, readySkills, t.recommendationReason.in_progress, t.recommendationReason.not_started]);

  const weakestInProgress = useMemo(() => {
    return readySkills
      .map((skill) => ({
        skill,
        progress: progressMap[skill.id],
      }))
      .filter((entry) => toUiStatus(entry.skill, entry.progress) === "in_progress")
      .sort((a, b) => (a.progress?.accuracy ?? 0) - (b.progress?.accuracy ?? 0))[0]?.skill;
  }, [progressMap, readySkills]);

  return (
    <section className="space-y-4">
      {recommended?.skill.trainHref ? (
        <SurfaceCard className="p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-slate-950">{t.continueTitle}</h3>
              <p className="mt-1 text-sm text-slate-600">{t.continueSubtitle}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <ButtonLink href={recommended.skill.trainHref} variant="primary">
                {t.continueSkill}
              </ButtonLink>
              <ButtonLink
                href={weakestInProgress?.trainHref ?? recommended.skill.trainHref}
                variant="secondary"
              >
                {t.repeatWeak}
              </ButtonLink>
            </div>
          </div>
        </SurfaceCard>
      ) : null}

      <SurfaceCard className="p-6 sm:p-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{t.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{t.subtitle}</p>
          </div>
          <p className="text-sm font-medium text-slate-700">
            {t.progressSummary}: {masteredCount}/{readySkills.length}
          </p>
        </div>

        <div className="mt-5 space-y-4">
          {levels.map((level, levelIndex) => (
            <div key={level.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                  {levelIndex + 1}
                </span>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-slate-950">{level.title}</h3>
                  {level.hint ? <p className="mt-1 text-xs text-slate-600">{level.hint}</p> : null}
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {level.skills.map((skill) => {
                  const progress = progressMap[skill.id];
                  const status = toUiStatus(skill, progress);
                  const accuracy = progress ? Math.round(progress.accuracy * 100) : 0;
                  const totals = progress ? `${progress.correct}/${progress.total}` : "0/0";

                  return (
                    <div key={skill.id} className="rounded-xl border border-slate-200 bg-white p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-slate-950">{skill.title}</p>
                        <span
                          className={[
                            "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                            statusPillClass(status),
                          ].join(" ")}
                        >
                          {t.status[status]}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-slate-600">{skill.summary}</p>
                      <p className="mt-2 text-xs text-slate-500">
                        {accuracy}% • {totals}
                      </p>
                      <div className="mt-3">
                        {skill.trainHref ? (
                          <ButtonLink href={skill.trainHref} variant="secondary">
                            {t.train}
                          </ButtonLink>
                        ) : (
                          <span className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-500">
                            {t.noTrainer}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </SurfaceCard>

      {recommended?.skill.trainHref ? (
        <SurfaceCard className="p-6">
          <h3 className="text-lg font-semibold tracking-tight text-slate-950">{t.recommendation}</h3>
          <p className="mt-2 text-sm font-medium text-slate-900">{recommended.skill.title}</p>
          <p className="mt-1 text-sm text-slate-600">{recommended.reason}</p>
          <div className="mt-4">
            <ButtonLink href={recommended.skill.trainHref} variant="primary">
              {t.trainRecommended}
            </ButtonLink>
          </div>
        </SurfaceCard>
      ) : null}
    </section>
  );
}
