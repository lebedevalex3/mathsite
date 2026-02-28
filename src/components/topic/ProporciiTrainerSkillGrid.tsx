"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { ButtonLink } from "@/src/components/ui/ButtonLink";
import { SurfaceCard } from "@/src/components/ui/SurfaceCard";
import type { SkillProgressMap, SkillProgressStatus } from "@/src/lib/progress/types";

type Locale = "ru" | "en" | "de";

type SkillItem = {
  skillId: string;
  title: string;
  description: string;
};

type Props = {
  locale: string;
  skills: SkillItem[];
};

type ProgressPayload = {
  ok?: boolean;
  progress?: SkillProgressMap;
};

const copy: Record<
  Locale,
  {
    recommendation: string;
    continueSkill: string;
    recommendationFallback: string;
    startTraining: string;
    status: string;
    attempts: string;
    notStarted: string;
    inProgress: string;
    mastered: string;
    tenTasks: string;
  }
> = {
  ru: {
    recommendation: "Рекомендуем начать",
    continueSkill: "Продолжить последний навык",
    recommendationFallback: "Выберите первый навык и начните серию.",
    startTraining: "Начать тренировку",
    status: "Статус",
    attempts: "Попытки",
    notStarted: "Не начато",
    inProgress: "В процессе",
    mastered: "Освоено",
    tenTasks: "10 задач",
  },
  en: {
    recommendation: "Recommended start",
    continueSkill: "Continue recent skill",
    recommendationFallback: "Pick your first skill and start a series.",
    startTraining: "Start training",
    status: "Status",
    attempts: "Attempts",
    notStarted: "Not started",
    inProgress: "In progress",
    mastered: "Mastered",
    tenTasks: "10 tasks",
  },
  de: {
    recommendation: "Empfohlener Start",
    continueSkill: "Letzte Fähigkeit fortsetzen",
    recommendationFallback: "Waehle die erste Faehigkeit und starte die Serie.",
    startTraining: "Training starten",
    status: "Status",
    attempts: "Versuche",
    notStarted: "Nicht gestartet",
    inProgress: "In Arbeit",
    mastered: "Beherrscht",
    tenTasks: "10 Aufgaben",
  },
};

function toLocale(value: string): Locale {
  if (value === "en" || value === "de") return value;
  return "ru";
}

function buildTrainHref(locale: string, skillId: string) {
  return `/${locale}/5-klass/proporcii/train?skill=${encodeURIComponent(skillId)}`;
}

function resolveStatus(progressMap: SkillProgressMap, skillId: string): SkillProgressStatus {
  const entry = progressMap[skillId];
  if (!entry || entry.total === 0) return "not_started";
  return entry.status;
}

function pickRecommendedSkill(skills: SkillItem[], progressMap: SkillProgressMap) {
  const inProgress = skills.find((skill) => resolveStatus(progressMap, skill.skillId) === "in_progress");
  if (inProgress) return inProgress;

  const notStarted = skills.find((skill) => resolveStatus(progressMap, skill.skillId) === "not_started");
  if (notStarted) return notStarted;

  return skills[0] ?? null;
}

export function ProporciiTrainerSkillGrid({ locale, skills }: Props) {
  const typedLocale = toLocale(locale);
  const t = copy[typedLocale];
  const [progressMap, setProgressMap] = useState<SkillProgressMap>({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/progress?topicId=g5.proporcii", {
          credentials: "same-origin",
        });
        if (!response.ok) return;
        const payload = (await response.json()) as ProgressPayload;
        if (!cancelled && payload.ok && payload.progress) {
          setProgressMap(payload.progress);
        }
      } catch {
        // fallback to empty progress
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const recommendedSkill = useMemo(
    () => pickRecommendedSkill(skills, progressMap),
    [skills, progressMap],
  );

  const hasAnyProgress = useMemo(
    () => Object.values(progressMap).some((entry) => entry.total > 0),
    [progressMap],
  );

  const recommendedHref = recommendedSkill
    ? buildTrainHref(locale, recommendedSkill.skillId)
    : `/${locale}/5-klass/proporcii/trainer`;

  return (
    <section className="space-y-4">
      <SurfaceCard className="p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">
          {hasAnyProgress ? t.continueSkill : t.recommendation}
        </p>
        <p className="mt-2 text-lg font-semibold tracking-tight text-[var(--text-strong)]">
          {recommendedSkill?.title ?? t.recommendationFallback}
        </p>
        <div className="mt-4">
          <ButtonLink href={recommendedHref} variant="primary">
            {t.startTraining}
          </ButtonLink>
        </div>
      </SurfaceCard>

      <div className="grid gap-4 md:grid-cols-2">
        {skills.map((skill) => {
          const entry = progressMap[skill.skillId];
          const status = resolveStatus(progressMap, skill.skillId);
          const statusText =
            status === "mastered"
              ? t.mastered
              : status === "in_progress"
                ? t.inProgress
                : t.notStarted;
          const statusClass =
            status === "mastered"
              ? "border-[var(--success)]/30 bg-[var(--success-soft)] text-[var(--success)]"
              : status === "in_progress"
                ? "border-[var(--primary)]/30 bg-[var(--info)] text-[var(--primary)]"
                : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]";

          return (
            <Link key={skill.skillId} href={buildTrainHref(locale, skill.skillId)} className="block h-full">
              <SurfaceCard className="h-full p-5 transition-all hover:border-[var(--primary)] hover:shadow-[0_10px_24px_-18px_rgba(29,78,216,0.45)]">
                <div className="flex items-center justify-between gap-2">
                  <span className={["rounded-full border px-2 py-0.5 text-xs font-semibold", statusClass].join(" ")}>
                    {statusText}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">
                    {t.attempts}: {entry?.total ?? 0}
                  </span>
                </div>
                <h2 className="mt-3 text-lg font-semibold tracking-tight text-[var(--text-strong)]">
                  {skill.title}
                </h2>
                <p className="mt-2 flex-1 text-sm leading-6 text-[var(--text-muted)]">{skill.description}</p>
                <div className="mt-4">
                  <span className="inline-flex items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--primary)]">
                    {t.tenTasks}
                  </span>
                </div>
              </SurfaceCard>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
