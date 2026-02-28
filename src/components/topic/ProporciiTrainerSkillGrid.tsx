"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { MarkdownMath } from "@/lib/ui/MarkdownMath";
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

type SkillSectionId = "base" | "equations" | "word_problems" | "other";

const copy: Record<
  Locale,
  {
    recommendation: string;
    continueSkill: string;
    recommendationFallback: string;
    startTraining: string;
    recommendationHint: string;
    attempts: string;
    notStarted: string;
    inProgress: string;
    mastered: string;
    tenTasks: string;
    sectionProgress: string;
    sectionTitles: Record<SkillSectionId, string>;
    sectionHints: Record<SkillSectionId, string>;
  }
> = {
  ru: {
    recommendation: "Рекомендуем начать",
    continueSkill: "Продолжить последний навык",
    recommendationFallback: "Выберите первый навык и начните серию.",
    startTraining: "Начать тренировку",
    recommendationHint: "Серия короткая: 10 задач подряд.",
    attempts: "Попытки",
    notStarted: "Не начато",
    inProgress: "В процессе",
    mastered: "Освоено",
    tenTasks: "10 задач",
    sectionProgress: "Освоено",
    sectionTitles: {
      base: "База",
      equations: "Решение пропорций",
      word_problems: "Текстовые задачи",
      other: "Дополнительно",
    },
    sectionHints: {
      base: "Распознавание и базовые свойства пропорции.",
      equations: "Поиск неизвестного и составление пропорции.",
      word_problems: "Применение пропорций в сюжетных задачах.",
      other: "Дополнительные навыки темы.",
    },
  },
  en: {
    recommendation: "Recommended start",
    continueSkill: "Continue recent skill",
    recommendationFallback: "Pick your first skill and start a series.",
    startTraining: "Start training",
    recommendationHint: "Short format: 10 tasks in a row.",
    attempts: "Attempts",
    notStarted: "Not started",
    inProgress: "In progress",
    mastered: "Mastered",
    tenTasks: "10 tasks",
    sectionProgress: "Mastered",
    sectionTitles: {
      base: "Core",
      equations: "Proportion Solving",
      word_problems: "Word Problems",
      other: "Additional",
    },
    sectionHints: {
      base: "Recognition and core proportion properties.",
      equations: "Finding unknowns and building equations.",
      word_problems: "Applying proportions in word tasks.",
      other: "Additional topic skills.",
    },
  },
  de: {
    recommendation: "Empfohlener Start",
    continueSkill: "Letzte Fähigkeit fortsetzen",
    recommendationFallback: "Waehle die erste Faehigkeit und starte die Serie.",
    startTraining: "Training starten",
    recommendationHint: "Kurzes Format: 10 Aufgaben am Stueck.",
    attempts: "Versuche",
    notStarted: "Nicht gestartet",
    inProgress: "In Arbeit",
    mastered: "Beherrscht",
    tenTasks: "10 Aufgaben",
    sectionProgress: "Beherrscht",
    sectionTitles: {
      base: "Basis",
      equations: "Proportionen loesen",
      word_problems: "Sachaufgaben",
      other: "Zusaetzlich",
    },
    sectionHints: {
      base: "Erkennen und Grundregeln der Proportion.",
      equations: "Unbekannte finden und Proportionen aufstellen.",
      word_problems: "Proportionen in Sachaufgaben anwenden.",
      other: "Weitere Faehigkeiten im Thema.",
    },
  },
};

const statusPriority: Record<SkillProgressStatus, number> = {
  in_progress: 0,
  not_started: 1,
  mastered: 2,
};

const sectionRules: Array<{ id: SkillSectionId; skillIds: string[] }> = [
  {
    id: "base",
    skillIds: [
      "g5.proporcii.raspoznat_proporciyu",
      "g5.proporcii.proverit_proporciyu",
      "g5.proporcii.primenit_svoistvo_proporcii",
      "g5.proporcii.preobrazovat_otnoshenie",
    ],
  },
  {
    id: "equations",
    skillIds: [
      "g5.proporcii.naiti_neizvestnyi_krainei",
      "g5.proporcii.naiti_neizvestnyi_srednii",
      "g5.proporcii.sostavit_proporciyu_po_usloviyu",
    ],
  },
  {
    id: "word_problems",
    skillIds: [
      "g5.proporcii.reshit_zadachu_na_proizvoditelnost",
      "g5.proporcii.reshit_zadachu_na_masshtab",
      "g5.proporcii.reshit_zadachu_na_cenu",
    ],
  },
];

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

function resolveSectionId(skillId: string): SkillSectionId {
  for (const rule of sectionRules) {
    if (rule.skillIds.includes(skillId)) return rule.id;
  }
  return "other";
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

  const sections = useMemo(() => {
    const bucket = new Map<SkillSectionId, SkillItem[]>();
    for (const skill of skills) {
      const sectionId = resolveSectionId(skill.skillId);
      const list = bucket.get(sectionId) ?? [];
      list.push(skill);
      bucket.set(sectionId, list);
    }

    const ordered: Array<{ id: SkillSectionId; items: SkillItem[] }> = [
      { id: "base", items: bucket.get("base") ?? [] },
      { id: "equations", items: bucket.get("equations") ?? [] },
      { id: "word_problems", items: bucket.get("word_problems") ?? [] },
      { id: "other", items: bucket.get("other") ?? [] },
    ];

    return ordered
      .filter((section) => section.items.length > 0)
      .map((section) => ({
        ...section,
        items: [...section.items].sort((left, right) => {
          const leftStatus = resolveStatus(progressMap, left.skillId);
          const rightStatus = resolveStatus(progressMap, right.skillId);
          if (statusPriority[leftStatus] !== statusPriority[rightStatus]) {
            return statusPriority[leftStatus] - statusPriority[rightStatus];
          }
          const leftAttempts = progressMap[left.skillId]?.total ?? 0;
          const rightAttempts = progressMap[right.skillId]?.total ?? 0;
          if (leftAttempts !== rightAttempts) return rightAttempts - leftAttempts;
          return left.title.localeCompare(right.title);
        }),
      }));
  }, [progressMap, skills]);

  return (
    <section className="space-y-4">
      <SurfaceCard className="p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">
          {hasAnyProgress ? t.continueSkill : t.recommendation}
        </p>
        <p className="mt-2 text-lg font-semibold tracking-tight text-[var(--text-strong)]">
          {recommendedSkill?.title ?? t.recommendationFallback}
        </p>
        <p className="mt-1 text-sm text-[var(--text-muted)]">{t.recommendationHint}</p>
        <div className="mt-4">
          <ButtonLink href={recommendedHref} variant="primary">
            {t.startTraining}
          </ButtonLink>
        </div>
      </SurfaceCard>

      {sections.map((section) => {
        const masteredCount = section.items.filter(
          (item) => resolveStatus(progressMap, item.skillId) === "mastered",
        ).length;
        return (
          <SurfaceCard key={section.id} className="p-4 sm:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-[var(--text-strong)]">
                  {t.sectionTitles[section.id]}
                </h2>
                <p className="mt-1 text-sm text-[var(--text-muted)]">{t.sectionHints[section.id]}</p>
              </div>
              <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--text)]">
                {t.sectionProgress}: {masteredCount}/{section.items.length}
              </span>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {section.items.map((skill) => {
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
                      <h3 className="mt-3 text-lg font-semibold tracking-tight text-[var(--text-strong)]">
                        {skill.title}
                      </h3>
                      <div className="mt-2 flex-1 text-sm leading-6 text-[var(--text-muted)]">
                        <MarkdownMath className="prose prose-slate max-w-none text-sm leading-6">
                          {skill.description}
                        </MarkdownMath>
                      </div>
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
          </SurfaceCard>
        );
      })}
    </section>
  );
}
