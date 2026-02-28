"use client";

import { useEffect, useMemo, useState } from "react";

import { ButtonLink } from "@/src/components/ui/ButtonLink";
import { SurfaceCard } from "@/src/components/ui/SurfaceCard";
import type { SkillProgressMap } from "@/src/lib/progress/types";

type Locale = "ru" | "en" | "de";

type Props = {
  locale: Locale;
};

type SkillRef = {
  id: string;
  title: Record<Locale, string>;
};

const TOPIC_ID = "g5.proporcii";

const SKILL_ORDER: SkillRef[] = [
  {
    id: "g5.proporcii.proverit_proporciyu",
    title: {
      ru: "Проверить пропорцию",
      en: "Check a proportion",
      de: "Proportion prüfen",
    },
  },
  {
    id: "g5.proporcii.naiti_neizvestnyi_krainei",
    title: {
      ru: "Найти неизвестный крайний член",
      en: "Find unknown extreme term",
      de: "Unbekanntes Außenverhältnis finden",
    },
  },
  {
    id: "g5.proporcii.naiti_neizvestnyi_srednii",
    title: {
      ru: "Найти неизвестный средний член",
      en: "Find unknown middle term",
      de: "Unbekanntes Mittelglied finden",
    },
  },
  {
    id: "g5.proporcii.reshit_zadachu_na_masshtab",
    title: {
      ru: "Задачи на масштаб",
      en: "Scale problems",
      de: "Maßstab-Aufgaben",
    },
  },
];

const copy = {
  ru: {
    title: "Продолжить",
    subtitle: "Вернись к следующему навыку в теме «Пропорции».",
    topic: "Тема",
    topicValue: "Пропорции",
    progress: "Освоение",
    nextSkill: "Следующий навык",
    continue: "Продолжить навык",
    start: "Начать с основ",
    fallbackSkill: "Базовые навыки темы",
  },
  en: {
    title: "Continue",
    subtitle: "Return to the next skill in the Proportions topic.",
    topic: "Topic",
    topicValue: "Proportions",
    progress: "Mastery",
    nextSkill: "Next skill",
    continue: "Continue skill",
    start: "Start with basics",
    fallbackSkill: "Topic basics",
  },
  de: {
    title: "Fortsetzen",
    subtitle: "Kehre zur nächsten Fähigkeit im Thema Proportionen zurück.",
    topic: "Thema",
    topicValue: "Proportionen",
    progress: "Beherrschung",
    nextSkill: "Nächste Fähigkeit",
    continue: "Fähigkeit fortsetzen",
    start: "Mit Grundlagen starten",
    fallbackSkill: "Grundlagen des Themas",
  },
} as const;

function buildTrainHref(locale: Locale, skillId?: string) {
  if (!skillId) return `/${locale}/5-klass/proporcii/trainer`;
  return `/${locale}/5-klass/proporcii/train?skill=${encodeURIComponent(skillId)}`;
}

function pickNextSkill(progressMap: SkillProgressMap) {
  const inProgress = SKILL_ORDER.find((skill) => progressMap[skill.id]?.status === "in_progress");
  if (inProgress) return inProgress;

  const notStarted = SKILL_ORDER.find((skill) => !progressMap[skill.id] || progressMap[skill.id]?.status === "not_started");
  if (notStarted) return notStarted;

  return SKILL_ORDER[0];
}

function computeMasteredPercent(progressMap: SkillProgressMap) {
  const total = SKILL_ORDER.length;
  const mastered = SKILL_ORDER.filter((skill) => progressMap[skill.id]?.status === "mastered").length;
  return Math.round((mastered / total) * 100);
}

export function HomeContinueSkillCard({ locale }: Props) {
  const t = copy[locale];
  const [progressMap, setProgressMap] = useState<SkillProgressMap>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(`/api/progress?topicId=${encodeURIComponent(TOPIC_ID)}`, {
          credentials: "same-origin",
        });
        if (!response.ok) return;
        const payload = (await response.json()) as { ok?: boolean; progress?: SkillProgressMap };
        if (!cancelled && payload.ok && payload.progress) {
          setProgressMap(payload.progress);
        }
      } catch {
        // fallback renders with empty progress
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const nextSkill = useMemo(() => pickNextSkill(progressMap), [progressMap]);
  const masteryPercent = useMemo(() => computeMasteredPercent(progressMap), [progressMap]);
  const hasAnyProgress = useMemo(
    () => Object.values(progressMap).some((entry) => entry.total > 0),
    [progressMap],
  );

  const ctaHref = buildTrainHref(locale, hasAnyProgress ? nextSkill?.id : undefined);
  const ctaLabel = hasAnyProgress ? t.continue : t.start;

  return (
    <SurfaceCard className="p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">{t.title}</h2>
          <p className="mt-1 text-sm text-slate-600">{t.subtitle}</p>
        </div>
        <ButtonLink href={ctaHref} variant="primary">
          {ctaLabel}
        </ButtonLink>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t.topic}</p>
          <p className="mt-1 text-sm font-medium text-slate-900">{t.topicValue}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t.progress}</p>
          <p className="mt-1 text-sm font-medium text-slate-900">
            {loaded ? `${masteryPercent}%` : "…"}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t.nextSkill}</p>
          <p className="mt-1 text-sm font-medium text-slate-900">
            {hasAnyProgress ? nextSkill?.title[locale] : t.fallbackSkill}
          </p>
        </div>
      </div>
    </SurfaceCard>
  );
}
